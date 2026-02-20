# backend/model_loader.py
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "facebook/nllb-200-distilled-600M"

print("🚀 Loading translation model... (takes 1–2 mins first time)")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("✅ Model loaded successfully!")

src_lang = "eng_Latn"
tgt_lang = "hin_Deva"

def translate_text(text: str) -> str:
    text = text.strip()
    if not text:
        return "Please provide English text."
    tokenizer.src_lang = src_lang
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt_lang),
        max_length=256,
        num_beams=5
    )
    return tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
