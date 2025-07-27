# SoMa - African Language Book Translation Platform

SoMa is a modern, multi-page web application that helps readers access literature in their native African languages. The platform provides PDF translation, multiple reading modes, audio playback, and speech-to-text functionality.

## Features

### 🏠 Home Page
- **Hero Section**: Clear introduction to SoMa's mission
- **Feature Showcase**: Highlights key capabilities with animated cards
- **Supported Languages**: Display of all supported African languages
- **Call-to-Action**: Direct links to Library and Reader pages

### 📚 Library Page
- **PDF Upload**: Drag-and-drop or click-to-browse file upload
- **Language Selection**: Choose from Hausa, Yoruba, Igbo, Swahili, and Kinyarwanda
- **Book Management**: View all saved books with progress tracking
- **Sorting Options**: Sort by recent, title, or language
- **Delete Functionality**: Remove books from library

### 📖 Reader Page
- **Three Reading Modes**:
  - **Inline**: Single-column translated text
  - **Side-by-Side**: Original and translated text side by side
  - **Audio**: Text-to-speech playback with controls
- **Font Controls**: Adjustable font size
- **Audio Controls**: Play, pause, stop, and speed adjustment
- **Speech-to-Text**: Record audio and get transcriptions/translations
- **Upload Integration**: Direct PDF upload and translation

### ⚙️ Settings Page
- **Theme Toggle**: Light and dark mode support
- **Reading Preferences**: Font size, default reading mode, audio speed
- **Language Preferences**: Set preferred target language
- **Data Management**: Clear all data or export settings
- **Upcoming Features**: Preview of planned functionality

## Technical Stack

### Backend
- **Flask**: Python web framework
- **Google Cloud APIs**:
  - **Translate API**: For text translation
  - **Text-to-Speech API**: For audio generation
  - **Speech-to-Text API**: For voice recognition
- **PyPDF2**: PDF text extraction
- **CORS**: Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **CSS Grid/Flexbox**: Modern responsive layouts
- **LocalStorage**: Client-side data persistence
- **Web APIs**: MediaRecorder, File API, Audio API

## Setup Instructions

### Prerequisites
- Python 3.7+
- Google Cloud account with APIs enabled
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SoMa
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Google Cloud credentials**
   - Create a Google Cloud project
   - Enable the following APIs:
     - Google Cloud Translate API
     - Google Cloud Text-to-Speech API
     - Google Cloud Speech-to-Text API
   - Create a service account and download the JSON key file
   - Set environment variables:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
     export GOOGLE_API_KEY="your-api-key"
     ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:5001`
   - The application will serve the home page by default

## File Structure

```
SoMa/
├── app.py                 # Flask backend
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── static/
│   ├── home.html         # Home page
│   ├── library.html      # Library page
│   ├── reader.html       # Reader page
│   ├── settings.html     # Settings page
│   ├── css/
│   │   ├── global.css    # Shared styles
│   │   ├── home.css      # Home page styles
│   │   ├── library.css   # Library page styles
│   │   ├── reader.css    # Reader page styles
│   │   └── settings.css  # Settings page styles
│   └── js/
│       ├── global.js     # Shared utilities
│       ├── home.js       # Home page logic
│       ├── library.js    # Library page logic
│       ├── reader.js     # Reader page logic
│       └── settings.js   # Settings page logic
```

## API Endpoints

### Translation
- `POST /translate-pdf`: Upload and translate PDF files
- `POST /translate`: Translate text snippets

### Audio
- `POST /speak`: Generate audio from text
- `POST /speech-to-text`: Transcribe audio to text

### Languages
- `GET /languages`: Get supported languages

## Usage Guide

### Uploading and Translating Books

1. **Navigate to Library page**
   - Click "Library" in the navigation
   - Or go directly to `/static/library.html`

2. **Upload a PDF**
   - Drag and drop a PDF file onto the upload area
   - Or click "Choose File" to browse

3. **Select target language**
   - Choose from the dropdown menu
   - Supported languages: Hausa, Yoruba, Igbo, Swahili, Kinyarwanda

4. **Translate**
   - Click "Translate Book"
   - Wait for processing to complete
   - Book will be saved to your library

### Reading Books

1. **Access Reader page**
   - Click "Reader" in navigation
   - Or go directly to `/static/reader.html`

2. **Choose reading mode**
   - **Inline**: Single column reading
   - **Side-by-Side**: Compare original and translated
   - **Audio**: Listen to text with controls

3. **Adjust settings**
   - Use font size controls
   - Adjust audio speed
   - Switch between themes

### Using Speech-to-Text

1. **Navigate to Reader page**
2. **Scroll to Voice Recording section**
3. **Click "Start Recording"**
4. **Speak into your microphone**
5. **Click "Stop Recording"**
6. **View transcript and translation**

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Development

### Adding New Languages

1. **Update backend** (`app.py`):
   ```python
   SUPPORTED_LANGUAGES = {
       'hau_Latn': 'ha',  # Hausa
       'yor_Latn': 'yo',  # Yoruba
       'ibo_Latn': 'ig',  # Igbo
       'swh_Latn': 'sw',  # Swahili
       'kin_Latn': 'rw',  # Kinyarwanda
       'new_lang': 'nl',  # New language
   }
   ```

2. **Update frontend** (all HTML files):
   ```html
   <option value="new_lang">🇳🇬 New Language</option>
   ```

### Styling

The application uses a modular CSS approach:
- `global.css`: Shared styles, navigation, themes
- Page-specific CSS files for unique styling
- Dark theme support throughout
- Responsive design for all screen sizes

### JavaScript Architecture

- **Global utilities**: Theme management, API helpers, localStorage
- **Page-specific classes**: Each page has its own JavaScript class
- **Event-driven**: Clean separation of concerns
- **Error handling**: Comprehensive error handling and user feedback

## Troubleshooting

### Common Issues

1. **Translation fails**
   - Check Google Cloud API credentials
   - Verify API quotas and billing
   - Check file size (max 50MB)

2. **Audio not working**
   - Ensure microphone permissions
   - Check browser compatibility
   - Verify Google Cloud Speech-to-Text API

3. **Theme not persisting**
   - Check localStorage support
   - Clear browser cache
   - Verify JavaScript is enabled

### Debug Mode

Run Flask in debug mode for detailed error messages:
```bash
export FLASK_ENV=development
python app.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**SoMa** - Making African literature accessible to everyone. 