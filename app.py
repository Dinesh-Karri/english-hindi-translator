# app.py
import gradio as gr
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from gtts import gTTS
import speech_recognition as sr
import tempfile
import os

# ✅ Load translation model
model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

src_lang = "eng_Latn"
tgt_lang = "hin_Deva"

# Translate English text → Hindi + Audio
def translate_to_hindi(text):
    if not text.strip():
        return "Please enter or speak English text.", None
    tokenizer.src_lang = src_lang
    encoded = tokenizer(text, return_tensors="pt")
    generated_tokens = model.generate(
        **encoded,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt_lang),
        max_length=256,
        num_beams=5
    )
    translated = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]

    # Convert translated Hindi text to speech
    tts = gTTS(translated, lang="hi")
    tmp_path = tempfile.mktemp(suffix=".mp3")
    tts.save(tmp_path)

    return translated, tmp_path

# 🎙️ Recognize speech from mic
def recognize_speech_from_mic(audio_file):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_file) as source:
        audio_data = recognizer.record(source)
    try:
        text = recognizer.recognize_google(audio_data)
        return text
    except sr.UnknownValueError:
        return "Sorry, I couldn't understand your voice. Please try again."
    except sr.RequestError:
        return "Speech recognition service unavailable. Check your internet."

# 🌐 Build Gradio App
with gr.Blocks(title="English → Hindi Translator with Voice") as demo:
    gr.Markdown("## 🎙️ English → Hindi Translator\nSpeak or type English, get Hindi translation + voice output.")

    with gr.Row():
        text_input = gr.Textbox(label="Enter English text", lines=3, placeholder="Type or use voice input...")
        mic_input = gr.Audio(sources=["microphone"], type="filepath", label="🎤 Speak English")


    translate_button = gr.Button("Translate")
    hindi_output = gr.Textbox(label="Hindi Translation")
    audio_output = gr.Audio(label="Listen to Hindi pronunciation")

    # Connect events
    translate_button.click(fn=translate_to_hindi, inputs=text_input, outputs=[hindi_output, audio_output])
    mic_input.change(fn=recognize_speech_from_mic, inputs=mic_input, outputs=text_input)

if __name__ == "__main__":
    demo.launch()
