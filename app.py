import re
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import PyPDF2
from google.cloud import texttospeech
import base64
import os
from dotenv import load_dotenv
import traceback  # <-- added import

# -----------------------------
# CONFIGURATION

load_dotenv()

# Load Google API keys from .env
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS
else:
    print("Warning: GOOGLE_APPLICATION_CREDENTIALS not set in .env")

# Supported languages for translation and TTS
SUPPORTED_LANGUAGES = {
    'hau_Latn': 'ha',  # Hausa
    'yor_Latn': 'yo',  # Yoruba
    'ibo_Latn': 'ig',  # Igbo
    'swh_Latn': 'sw',  # Swahili
    'kin_Latn': 'rw',  # Kinyarwanda
}

# Map short language codes to full Google TTS locale codes
GOOGLE_TTS_LANG_CODES = {
    'ha': 'ha-Latn-NG',
    'yo': 'yo-NG',
    'ig': 'ig-NG',
    'sw': 'sw-KE',
    'rw': 'rw-RW',
    'en': 'en-US',
}

# -----------------------------
# HELPER FUNCTIONS

def is_supported_language_code(lang_code):
    return lang_code in SUPPORTED_LANGUAGES

def get_language_code(lang_key):
    return SUPPORTED_LANGUAGES.get(lang_key)

def get_language_key_from_code(code):
    for key, val in SUPPORTED_LANGUAGES.items():
        if val == code:
            return key
    return None

def clean_translated_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r' \n ', '\n', text)
    return text.strip()

def translate_text(text, target_language_code):
    if not GOOGLE_API_KEY:
        raise Exception("Google API key not set.")
    if target_language_code not in SUPPORTED_LANGUAGES.values():
        raise ValueError(f"Unsupported language code: {target_language_code}")

    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
    data = {
        "q": text,
        "target": target_language_code,
        "format": "text"
    }

    response = requests.post(url, json=data)
    if response.status_code != 200:
        raise Exception(f"Google Translate API error: {response.text}")

    result = response.json()
    return result['data']['translations'][0]['translatedText']

def extract_text_from_pdf(file_stream):
    reader = PyPDF2.PdfReader(file_stream)
    text = ''
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + '\n'
    return text.strip()

def synthesize_speech(text, language_code="en-US"):
    client = texttospeech.TextToSpeechClient()

    input_text = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code,
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=input_text,
        voice=voice,
        audio_config=audio_config
    )
    return response.audio_content

# -----------------------------
# FLASK APP SETUP

app = Flask(__name__, static_folder='static')
CORS(app)

# -----------------------------
# ROUTES

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/translate', methods=['POST'])
def translate_api():
    data = request.get_json()
    if not data or 'text' not in data or 'target_language' not in data:
        return jsonify({'error': 'Missing "text" or "target_language" in request.'}), 400

    text = data['text']
    lang_input = data['target_language']
    target_language_code = get_language_code(lang_input)

    if not target_language_code:
        return jsonify({'error': f'Unsupported language. Supported: {list(SUPPORTED_LANGUAGES.keys())}'}), 400

    try:
        translated = translate_text(text, target_language_code)
        cleaned = clean_translated_text(translated)
        return jsonify({'translated_text': cleaned, 'target_language': lang_input})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/translate-pdf', methods=['POST'])
def translate_pdf():
    try:
        file = request.files.get('file')
        target_language = request.form.get('target_language')

        if not file or file.filename == '':
            return jsonify({'error': 'No PDF file uploaded.'}), 400
        if not target_language:
            return jsonify({'error': 'No target language specified.'}), 400
        if target_language not in SUPPORTED_LANGUAGES:
            return jsonify({'error': f'Unsupported language. Supported: {list(SUPPORTED_LANGUAGES.keys())}'}), 400

        target_language_code = get_language_code(target_language)
        if not target_language_code:
            return jsonify({'error': 'Could not map target language to Google Translate code.'}), 400

        extracted_text = extract_text_from_pdf(file.stream)
        if not extracted_text:
            return jsonify({'translated_text': '[No text found in PDF]', 'target_language': target_language})

        translated_text = translate_text(extracted_text, target_language_code)
        cleaned_text = clean_translated_text(translated_text)

        return jsonify({'translated_text': cleaned_text, 'target_language': target_language})

    except Exception as e:
        print(f"Error in /translate-pdf: {e}")
        return jsonify({'error': f"Server error: {str(e)}"}), 500

@app.route('/languages', methods=['GET'])
def get_languages():
    return jsonify({
        'hau_Latn': 'Hausa',
        'yor_Latn': 'Yoruba',
        'ibo_Latn': 'Igbo',
        'swh_Latn': 'Swahili',
        'kin_Latn': 'Kinyarwanda'
    })

@app.route('/speak', methods=['POST'])
def speak():
    data = request.get_json()
    if not data or 'text' not in data or 'language_code' not in data:
        return jsonify({'error': 'Missing "text" or "language_code"'}), 400

    text = data['text']
    language_code = data['language_code']

    # Map short language codes to full Google TTS codes
    google_tts_lang_code = GOOGLE_TTS_LANG_CODES.get(language_code, "en-US")

    try:
        audio_content = synthesize_speech(text, google_tts_lang_code)
        audio_b64 = base64.b64encode(audio_content).decode('utf-8')
        return jsonify({'audio_content': audio_b64})

    except Exception as e:
        traceback.print_exc()  # <--- added full error print for debugging
        return jsonify({'error': str(e)}), 500

# -----------------------------
# RUN APP

if __name__ == '__main__':
    app.run(debug=True, port=5001)
