# test_translation.py
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# ✅ Load Meta's NLLB-200 pre-trained model
model_name = "facebook/nllb-200-distilled-600M"

print("Loading model... (first time takes a few minutes)")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
print("✅ Model loaded successfully!\n")

# Define the language codes (for NLLB-200)
src_lang = "eng_Latn"   # English
tgt_lang = "hin_Deva"   # Hindi (Devanagari script)

def translate_to_hindi(text):
    # Set source language for tokenizer
    tokenizer.src_lang = src_lang
    encoded = tokenizer(text, return_tensors="pt")

    # Generate Hindi translation
    generated_tokens = model.generate(
        **encoded,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt_lang),  # ✅ Correct way
        max_length=256,
        num_beams=5
    )
    return tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]

# 🔍 Test translations
examples = [
    "Hello, how are you?",
    "I am learning Artificial Intelligence.",
    "This project will translate English text into correct Hindi text."
]

for eng in examples:
    print("English:", eng)
    print("Hindi:", translate_to_hindi(eng))
    print()
