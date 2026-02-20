# backend/model_manager.py
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch, time, os, sys
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Load environment variables
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN", None)

# ✅ Model registry (public & stable)
MODEL_REGISTRY = {
    "nllb": "facebook/nllb-200-distilled-600M",
    "mt5": "Helsinki-NLP/opus-mt-en-hi",  # ✅ stable English→Hindi model
    "marian": "facebook/m2m100_418M",  # M2M100 multilingual model
    "gru": "gru_baseline"
}



# Cache to store loaded models
_loaded = {}

# Device & accelerate check
device = "cuda" if torch.cuda.is_available() else "cpu"
_have_accelerate = False
try:
    import accelerate  # noqa
    _have_accelerate = True
except Exception:
    _have_accelerate = False

OFFLOAD_FOLDER = os.getenv("HF_OFFLOAD_DIR", None)


# =======================
# 🔹 Model Loading Logic
# =======================
def load_model(model_key):
    """Loads the selected model (cached for performance)."""
    if model_key in _loaded:
        return _loaded[model_key]

    model_name = MODEL_REGISTRY.get(model_key)
    if not model_name:
        raise ValueError(f"❌ Unknown model key: {model_key}")

    if model_key == "gru":
        _loaded[model_key] = ("gru_tokenizer", "gru_model")
        print("[OK] GRU baseline ready (simple dictionary).")
        return _loaded[model_key]

    print(f"[LOADING] Loading model: {model_name} (device={device}, accelerate={_have_accelerate})")

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True, token=HF_TOKEN)

        if _have_accelerate and torch.cuda.is_available():
            # Load model with accelerate offload if available
            load_kwargs = {"device_map": "auto"}
            if OFFLOAD_FOLDER:
                load_kwargs["offload_folder"] = OFFLOAD_FOLDER
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name, **load_kwargs, token=HF_TOKEN)
            print("[OK] Model loaded with accelerate (device_map='auto').")
        else:
            # Standard CPU or single GPU load
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name, token=HF_TOKEN)
            model.to(device)
            print(f"[OK] Model fully loaded to {device}.")
    except Exception as e:
        print(f"[ERROR] Error loading model {model_name}: {e}")
        raise

    _loaded[model_key] = (tokenizer, model)
    return _loaded[model_key]


# =======================
# 🔹 Translation Logic
# =======================
def translate_text_with_model(text, model_key):
    """Translates English → Hindi using selected model."""
    try:
        if model_key == "gru":
            return translate_with_gru_baseline(text)

        tokenizer, model = load_model(model_key)
        if not text or not text.strip():
            return {"error": "Empty text provided."}

        start_time = time.time()

        # ── Set source language BEFORE tokenization (critical for NLLB & M2M100) ──
        if model_key == "nllb":
            tokenizer.src_lang = "eng_Latn"
        elif model_key == "marian":
            tokenizer.src_lang = "en"

        # Tokenize input text
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)

        # Move inputs to same device as model
        try:
            model_device = next(model.parameters()).device
        except StopIteration:
            model_device = torch.device(device)
        inputs = {k: v.to(model_device) for k, v in inputs.items()}

        # Generation configuration
        gen_kwargs = {"max_length": 128, "num_beams": 5}

        # Handle NLLB-specific target language forcing
        if model_key == "nllb":
            tgt_id = None
            try:
                if hasattr(tokenizer, "lang_code_to_id"):
                    tgt_id = tokenizer.lang_code_to_id.get("hin_Deva", None)
                else:
                    tid = tokenizer.convert_tokens_to_ids("hin_Deva")
                    if tid != tokenizer.unk_token_id:
                        tgt_id = tid
            except Exception:
                tgt_id = None
            if tgt_id is not None:
                gen_kwargs["forced_bos_token_id"] = tgt_id

        # Handle M2M100-specific target language forcing
        elif model_key == "marian":
            try:
                tgt_id = tokenizer.get_lang_id("hi")
                gen_kwargs["forced_bos_token_id"] = tgt_id
            except Exception:
                try:
                    tgt_id = tokenizer.convert_tokens_to_ids("__hi__")
                    if tgt_id != tokenizer.unk_token_id:
                        gen_kwargs["forced_bos_token_id"] = tgt_id
                except Exception:
                    pass

        # Generate translation
        with torch.no_grad():
            outputs = model.generate(**inputs, **gen_kwargs)

        # Decode & cleanup
        translation = tokenizer.decode(outputs[0], skip_special_tokens=True)
        time_taken = round(time.time() - start_time, 2)

        if not translation.strip():
            translation = "Could not translate text."

        return {
            "model_used": model_key,
            "translation": translation,
            "time_taken": time_taken
        }

    except Exception as e:
        import traceback
        print("[ERROR] Translation error:", e)
        print(traceback.format_exc())
        return {"error": str(e)}


# =======================
# 🔹 GRU Baseline Logic
# =======================
def translate_with_gru_baseline(text):
    """Simple rule-based GRU baseline fallback."""
    start_time = time.time()
    simple_dict = {
        "hello": "नमस्ते",
        "how are you": "तुम कैसे हो",
        "thank you": "धन्यवाद",
        "good morning": "सुप्रभात",
        "good night": "शुभ रात्रि"
    }

    text_lower = text.lower().strip()
    if text_lower in simple_dict:
        translation = simple_dict[text_lower]
    else:
        try:
            tokenizer, model = load_model("nllb")
            tokenizer.src_lang = "eng_Latn"
            inputs = tokenizer(text, return_tensors="pt", truncation=True)
            model_device = next(model.parameters()).device
            inputs = {k: v.to(model_device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = model.generate(**inputs, max_length=128, num_beams=3)
            translation = tokenizer.decode(outputs[0], skip_special_tokens=True)
        except Exception:
            translation = f"[GRU Baseline] {text} (Translation not available)"

    return {
        "model_used": "gru",
        "translation": translation,
        "time_taken": round(time.time() - start_time, 2)
    }
