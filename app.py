import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import threading
import PyPDF2

# -----------------------------
# Supported African languages and codes (NLLB-200)
SUPPORTED_LANGUAGES = {
    'Hausa': 'hau_Latn',
    'Yoruba': 'yor_Latn',
    'Igbo': 'ibo_Latn',
    'Swahili': 'swh_Latn',
    'Kinyarwanda': 'kin_Latn',
}

# -----------------------------
# Efficient model/tokenizer loading with thread-safe singleton
class NLLBModel:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.model_name = "facebook/nllb-200-distilled-600M"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

# -----------------------------
# Helper: Validate language code

def is_supported_language_code(lang_code):
    return lang_code in SUPPORTED_LANGUAGES.values()

def get_language_name_from_code(lang_code):
    for name, code in SUPPORTED_LANGUAGES.items():
        if code == lang_code:
            return name
    return None

# -----------------------------
# Helper to split long text

def split_text_into_chunks(text, max_words=200):
    words = text.split()
    return [' '.join(words[i:i+max_words]) for i in range(0, len(words), max_words)]

# -----------------------------
# Translation function (handles chunking and lang code fix)

def translate(text, target_language_code):
    if not is_supported_language_code(target_language_code):
        raise ValueError(f"Unsupported language code: {target_language_code}")

    nllb = NLLBModel.get_instance()
    tokenizer = nllb.tokenizer
    model = nllb.model

    chunks = split_text_into_chunks(text, max_words=200)
    translations = []

    for chunk in chunks:
        inputs = tokenizer(chunk, return_tensors="pt", truncation=True, max_length=1000)
        forced_bos_token_id = tokenizer.convert_tokens_to_ids(target_language_code)
        output_tokens = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=512
        )
        translated_chunk = tokenizer.batch_decode(output_tokens, skip_special_tokens=True)[0]
        translations.append(translated_chunk)

    return ' '.join(translations)

# -----------------------------
# PDF text extraction helper

def extract_text_from_pdf(file_stream):
    reader = PyPDF2.PdfReader(file_stream)
    text = ''
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + '\n'
    return text.strip()

# -----------------------------
# Flask API setup

app = Flask(__name__, static_folder='static')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/translate', methods=['POST'])
def translate_api():
    data = request.get_json()
    if not data or 'text' not in data or 'target_language' not in data:
        return jsonify({'error': 'Missing "text" or "target_language" in request.'}), 400

    text = data['text']
    target_language = data['target_language']

    if target_language in SUPPORTED_LANGUAGES:
        target_language_code = SUPPORTED_LANGUAGES[target_language]
    else:
        target_language_code = target_language

    if not is_supported_language_code(target_language_code):
        return jsonify({'error': f'Unsupported language. Supported: {list(SUPPORTED_LANGUAGES.keys())}'}), 400

    try:
        translated = translate(text, target_language_code)
        return jsonify({
            'translated_text': translated,
            'target_language': get_language_name_from_code(target_language_code) or target_language_code
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/translate-pdf', methods=['POST'])
def translate_pdf_api():
    if 'file' not in request.files or 'target_language' not in request.form:
        return jsonify({'error': 'Missing PDF file or target_language.'}), 400

    file = request.files['file']
    target_language = request.form['target_language']

    if target_language in SUPPORTED_LANGUAGES:
        target_language_code = SUPPORTED_LANGUAGES[target_language]
    else:
        target_language_code = target_language

    if not is_supported_language_code(target_language_code):
        return jsonify({'error': f'Unsupported language. Supported: {list(SUPPORTED_LANGUAGES.keys())}'}), 400

    try:
        text = extract_text_from_pdf(file)
        if not text:
            return jsonify({'error': 'No extractable text found in PDF.'}), 400

        translated = translate(text, target_language_code)
        return jsonify({
            'translated_text': translated,
            'target_language': get_language_name_from_code(target_language_code) or target_language_code
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/languages', methods=['GET'])
def get_languages():
    return jsonify(SUPPORTED_LANGUAGES)

# -----------------------------
# Run the app
if __name__ == '__main__':
    app.run(debug=True, port=5001)
