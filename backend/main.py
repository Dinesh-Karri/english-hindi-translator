from fastapi import FastAPI, Query, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from model_manager import translate_text_with_model, MODEL_REGISTRY
from evaluation import evaluate_model_on_dataset, EVALUATION_DATASET, compute_bleu_score, compute_meteor_score
from dotenv import load_dotenv
import os
import sys
import tempfile
from datetime import datetime
from gtts import gTTS
import speech_recognition as sr
from sentence_transformers import SentenceTransformer, util
import nltk

# Fix Windows console encoding for Unicode output
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ✅ Load .env file (for Hugging Face token and other secrets)
load_dotenv()

# Download NLTK data required for METEOR score computation
try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
    print("[OK] NLTK data downloaded successfully.")
except Exception as e:
    print(f"[WARN] NLTK download warning: {e}")

# Load a lightweight sentence similarity model
similarity_model = SentenceTransformer('all-MiniLM-L6-v2')

# ------------------------------------------------------------
# ⚙️ FastAPI Configuration
# ------------------------------------------------------------
app = FastAPI(
    title="AutoLingo: AI-Powered English → Hindi Translation API",
    description="Translate English text to Hindi using NLLB, mT5, Marian, or GRU models.",
    version="3.0"
)

# ✅ Allow frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# 🧾 Request Body Schemas
# ------------------------------------------------------------
class TranslationRequest(BaseModel):
    text: str


class TTSRequest(BaseModel):
    text: str


# In-memory storage
translation_history = []

# ------------------------------------------------------------
# 🌐 Root Endpoint
# ------------------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "Welcome to AutoLingo: AI-Powered English→Hindi Translation API 🌍",
        "available_models": list(MODEL_REGISTRY.keys()),
        "endpoints": {
            "translate": "POST /translate?model=<model_name>",
            "tts": "POST /tts",
            "speech": "POST /speech",
            "evaluate": "GET /evaluate?model=<model_name>",
            "compare": "GET /compare",
            "models": "GET /models",
            "history": "GET /history",
            "dataset": "GET /dataset"
        }
    }

# ------------------------------------------------------------
# 📊 Global Model Statistics Tracker
# ------------------------------------------------------------
model_statistics = {
    model_key: {
        "total_translations": 0,
        "correct_translations": 0,
        "average_bleu": 0.0,
        "average_meteor": 0.0,
        "average_latency": 0.0
    }
    for model_key in MODEL_REGISTRY.keys()
}

# ------------------------------------------------------------
# 🧠 Translation Endpoint
# ------------------------------------------------------------
@app.post("/translate")
def translate_text(
    req: TranslationRequest,
    model: str = Query(default="nllb", description="Choose model: nllb, mt5, marian, or gru")
):
    """
    Translate English text to Hindi using selected model and dynamically update metrics.
    """
    try:
        if model not in MODEL_REGISTRY:
            raise HTTPException(status_code=400, detail=f"Invalid model. Available: {list(MODEL_REGISTRY.keys())}")

        # ------------------------------------------------------------
        # 1️⃣ Perform Translation
        # ------------------------------------------------------------
        result = translate_text_with_model(req.text, model)
        translated = result.get("translation", "").strip()

        # ------------------------------------------------------------
        # 2️⃣ Find Closest Reference Sentence (semantic match)
        # ------------------------------------------------------------
        english_sentences = [pair["english"] for pair in EVALUATION_DATASET]
        hindi_sentences = [pair["hindi"] for pair in EVALUATION_DATASET]

        try:
            query_emb = similarity_model.encode(req.text, convert_to_tensor=True)
            dataset_embs = similarity_model.encode(english_sentences, convert_to_tensor=True)
            cos_scores = util.cos_sim(query_emb, dataset_embs)[0]
            best_match_idx = int(cos_scores.argmax())
            closest_ref = hindi_sentences[best_match_idx]
        except Exception as e:
            print("[WARN] Similarity model fallback:", e)
            closest_ref = hindi_sentences[0] if len(hindi_sentences) > 0 else ""

        # ------------------------------------------------------------
        # 3️⃣ Compute BLEU and METEOR
        # ------------------------------------------------------------
        if closest_ref and translated:
            bleu_live = compute_bleu_score([closest_ref], [translated])
            meteor_live = compute_meteor_score([closest_ref], [translated])
            print(f"[DEBUG] ref='{closest_ref[:50]}', hyp='{translated[:50]}', bleu={bleu_live}, meteor={meteor_live}")
        else:
            bleu_live, meteor_live = 0.0, 0.0

        result["bleu"] = round(bleu_live, 4)
        result["meteor"] = round(meteor_live, 4)

        # ------------------------------------------------------------
        # 4️⃣ Update Statistics for Model
        # ------------------------------------------------------------
        stats = model_statistics[model]
        stats["total_translations"] += 1

        # ✅ Latency
        stats["average_latency"] = (
            (stats["average_latency"] * (stats["total_translations"] - 1)) + result.get("time_taken", 0)
        ) / stats["total_translations"]

        # ✅ BLEU
        stats["average_bleu"] = (
            (stats["average_bleu"] * (stats["total_translations"] - 1)) + bleu_live
        ) / stats["total_translations"]

        # ✅ METEOR
        stats["average_meteor"] = (
            (stats["average_meteor"] * (stats["total_translations"] - 1)) + meteor_live
        ) / stats["total_translations"]

        # ✅ Accuracy — count only if translation seems “good”
        if bleu_live > 0.5 or meteor_live > 0.5:
            stats["correct_translations"] += 1

        # ------------------------------------------------------------
        # 5️⃣ Save to History
        # ------------------------------------------------------------
        translation_history.append({
            "english": req.text,
            "hindi": translated,
            "reference": closest_ref,
            "bleu": bleu_live,
            "meteor": meteor_live,
            "model": model,
            "time_taken": result.get("time_taken", 0),
            "timestamp": datetime.now().isoformat()
        })

        return result

    except Exception as e:
        print("[ERROR] Error in /translate:", e)
        raise HTTPException(status_code=500, detail=str(e))




# ------------------------------------------------------------
# 🔊 Text-to-Speech Endpoint
# ------------------------------------------------------------
@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    try:
        if not req.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        tts = gTTS(text=req.text, lang='hi', slow=False)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_file.name)
        temp_file.close()

        return FileResponse(
            temp_file.name,
            media_type='audio/mpeg',
            filename='translation.mp3'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# 🎙️ Speech-to-Text Endpoint
# ------------------------------------------------------------
@app.post("/speech")
async def speech_to_text(file: UploadFile = File(...)):
    try:
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_file.name) as source:
            audio_data = recognizer.record(source)

        try:
            text = recognizer.recognize_google(audio_data)
            os.unlink(temp_file.name)
            return {"text": text}
        except sr.UnknownValueError:
            os.unlink(temp_file.name)
            raise HTTPException(status_code=400, detail="Could not understand audio")
        except sr.RequestError as e:
            os.unlink(temp_file.name)
            raise HTTPException(status_code=500, detail=f"Speech recognition error: {str(e)}")

    except Exception as e:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# 📈 Evaluation & Comparison
# ------------------------------------------------------------
@app.get("/evaluate")
def evaluate_model(model: str = Query(..., description="Model to evaluate: nllb, mt5, marian, or gru")):
    try:
        if model not in MODEL_REGISTRY:
            raise HTTPException(status_code=400, detail="Invalid model")

        def model_func(text):
            return translate_text_with_model(text, model)

        results = evaluate_model_on_dataset(model_func, EVALUATION_DATASET)
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/compare")
def compare_models():
    try:
        if not model_statistics:
            raise HTTPException(status_code=404, detail="No statistics yet.")

        comparison_results = {}
        for model_key, stats in model_statistics.items():
            comparison_results[model_key] = {
                "accuracy": round((stats["correct_translations"] / stats["total_translations"]) * 100, 2)
                if stats["total_translations"] > 0 else 0.0,
                "bleu": round(stats["average_bleu"], 3),
                "meteor": round(stats["average_meteor"], 3),
                "latency": round(stats["average_latency"], 2),
                "total_samples": stats["total_translations"]
            }

        best_model = max(comparison_results.items(), key=lambda x: x[1]["bleu"], default=("nllb", {}))

        return {
            "models": comparison_results,
            "best_model": {
                "name": best_model[0],
                "accuracy": comparison_results[best_model[0]]["accuracy"],
                "bleu": comparison_results[best_model[0]]["bleu"]
            },
            "summary": {
                "total_models": len(comparison_results),
                "total_samples": sum([v["total_samples"] for v in comparison_results.values()])
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# 📋 Models, Dataset, History
# ------------------------------------------------------------
@app.get("/models")
def get_models():
    return {"models": MODEL_REGISTRY, "count": len(MODEL_REGISTRY)}


@app.get("/dataset")
def get_dataset():
    return {"dataset": EVALUATION_DATASET, "total_samples": len(EVALUATION_DATASET)}


@app.get("/history")
def get_history(limit: int = Query(default=50)):
    return {"history": translation_history[-limit:], "total": len(translation_history)}


@app.delete("/history")
def clear_history():
    global translation_history
    translation_history = []
    return {"message": "History cleared successfully"}


# ------------------------------------------------------------
# ✅ Run command
# ------------------------------------------------------------
# Run manually:
# python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
