// ===== READER PAGE JAVASCRIPT =====

class ReaderPage {
  constructor() {
    this.currentBook = null;
    this.currentMode = 'inline';
    this.fontSize = 16;
    this.audioPlayer = null;
    this.currentFile = null;
    this.currentLanguage = '';
    this.init();
  }

  init() {
    this.loadCurrentBook();
    this.setupEventListeners();
    this.setupAudioPlayer();
    this.setupReadingModes();
    this.setupFontControls();
    this.setupVoiceTranslation();
  }

  setupEventListeners() {
    // File upload
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const chooseFileBtn = document.getElementById('chooseFileBtn');

    if (dropzone) {
      dropzone.addEventListener('click', () => fileInput.click());
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileSelect(files[0]);
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelect(e.target.files[0]);
        }
      });
    }

    if (chooseFileBtn) {
      chooseFileBtn.addEventListener('click', () => fileInput.click());
    }

    // Language selection
    const targetLanguage = document.getElementById('targetLanguage');
    if (targetLanguage) {
      targetLanguage.addEventListener('change', (e) => {
        this.currentLanguage = e.target.value;
        this.updateTranslateButton();
      });
    }

    // Translate button
    const translateBtn = document.getElementById('translateBtn');
    if (translateBtn) {
      translateBtn.addEventListener('click', () => {
        this.translateBook();
      });
    }
  }

  setupAudioPlayer() {
    this.audioPlayer = document.getElementById('audioElement');
    if (this.audioPlayer) {
      this.audioPlayer.addEventListener('loadedmetadata', () => {
        this.updateTimeDisplay();
      });

      this.audioPlayer.addEventListener('timeupdate', () => {
        this.updateProgress();
      });

      this.audioPlayer.addEventListener('ended', () => {
        this.resetAudioControls();
      });
    }
  }

  setupReadingModes() {
    const inlineBtn = document.getElementById('inlineBtn');
    const sideBySideBtn = document.getElementById('sideBySideBtn');
    const voiceTranslationBtn = document.getElementById('voiceTranslationBtn');

    if (inlineBtn) {
      inlineBtn.addEventListener('click', () => this.switchMode('inline'));
    }

    if (sideBySideBtn) {
      sideBySideBtn.addEventListener('click', () => this.switchMode('sideBySide'));
    }

    if (voiceTranslationBtn) {
      voiceTranslationBtn.addEventListener('click', () => this.switchMode('voiceTranslation'));
    }
  }

  setupFontControls() {
    const decreaseFont = document.getElementById('decreaseFont');
    const increaseFont = document.getElementById('increaseFont');
    const fontSizeDisplay = document.getElementById('fontSize');

    if (decreaseFont) {
      decreaseFont.addEventListener('click', () => {
        this.fontSize = Math.max(12, this.fontSize - 2);
        this.updateFontSize();
      });
    }

    if (increaseFont) {
      increaseFont.addEventListener('click', () => {
        this.fontSize = Math.min(24, this.fontSize + 2);
        this.updateFontSize();
      });
    }

    this.updateFontSize();
  }

  setupVoiceTranslation() {
    const audioLanguage = document.getElementById('audioLanguage');
    const playAudioBtn = document.getElementById('playAudioBtn');
    const voiceAudioLanguage = document.getElementById('voiceAudioLanguage');
    const voicePlayAudioBtn = document.getElementById('voicePlayAudioBtn');

    if (audioLanguage) {
      audioLanguage.addEventListener('change', () => {
        this.updatePlayAudioButton();
      });
    }

    if (playAudioBtn) {
      playAudioBtn.addEventListener('click', () => {
        this.playAudio();
      });
    }

    if (voiceAudioLanguage) {
      voiceAudioLanguage.addEventListener('change', () => {
        this.updateVoicePlayAudioButton();
      });
    }

    if (voicePlayAudioBtn) {
      voicePlayAudioBtn.addEventListener('click', () => {
        this.playVoiceAudio();
      });
    }

    // Setup voice gender controls
    this.setupVoiceGenderControls();
  }

  setupVoiceGenderControls() {
    const genderRadios = document.querySelectorAll('input[name="voiceGender"]');
    const audioGenderRadios = document.querySelectorAll('input[name="voiceGenderAudio"]');

    genderRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.currentVoiceGender = radio.value;
      });
    });

    audioGenderRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.currentAudioVoiceGender = radio.value;
      });
    });

    // Set default values
    this.currentVoiceGender = 'male';
    this.currentAudioVoiceGender = 'male';
  }

  switchMode(mode) {
    // Update mode buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => btn.classList.remove('active'));

    const activeButton = document.getElementById(`${mode}Btn`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // Hide all reading modes
    const readingModes = document.querySelectorAll('.reading-mode');
    readingModes.forEach(modeEl => modeEl.classList.remove('active'));

    // Show selected mode
    const selectedMode = document.getElementById(`${mode}Mode`);
    if (selectedMode) {
      selectedMode.classList.add('active');
    }

    this.currentMode = mode;
    this.loadCurrentBook(); // Reload content for new mode
  }

  updateFontSize() {
    const fontSizeDisplay = document.getElementById('fontSize');
    if (fontSizeDisplay) {
      fontSizeDisplay.textContent = this.fontSize;
    }

    // Apply font size to reading content
    const readingElements = document.querySelectorAll('.inline-text, .panel-content');
    readingElements.forEach(element => {
      element.style.fontSize = `${this.fontSize}px`;
    });
  }

  loadCurrentBook() {
    const currentBookTitle = StorageManager.getCurrentBook();
    if (!currentBookTitle) {
      this.showPlaceholder();
      return;
    }

    const books = StorageManager.getBooks();
    this.currentBook = books[currentBookTitle];
    
    if (!this.currentBook) {
      this.showPlaceholder();
      return;
    }

    this.displayBookContent();
    this.updatePlayAudioButton();
  }

  displayBookContent() {
    if (!this.currentBook) return;

    const content = this.currentBook.content || '';
    const originalText = this.currentBook.originalText || '';

    // Update inline mode (sentence-by-sentence comparison)
    const inlineText = document.getElementById('inlineText');
    if (inlineText) {
      inlineText.innerHTML = this.formatSentenceBySentence(originalText, content);
    }

    // Update side-by-side mode
    const originalTextEl = document.getElementById('originalText');
    const translatedTextEl = document.getElementById('translatedText');
    
    if (originalTextEl) {
      originalTextEl.innerHTML = this.formatText(originalText || 'Original text not available');
    }
    
    if (translatedTextEl) {
      translatedTextEl.innerHTML = this.formatText(content);
    }

    // Update voice translation mode
    const voiceTranslationText = document.getElementById('voiceTranslationText');
    if (voiceTranslationText) {
      voiceTranslationText.innerHTML = this.formatText(content);
    }

    // Setup scroll sync for side-by-side mode
    this.setupScrollSync();
  }

  setupScrollSync() {
    const originalPanel = document.getElementById('originalText');
    const translatedPanel = document.getElementById('translatedText');

    if (originalPanel && translatedPanel) {
      // Sync original to translated
      originalPanel.addEventListener('scroll', () => {
        const scrollPercent = originalPanel.scrollTop / (originalPanel.scrollHeight - originalPanel.clientHeight);
        const targetScroll = scrollPercent * (translatedPanel.scrollHeight - translatedPanel.clientHeight);
        translatedPanel.scrollTop = targetScroll;
      });

      // Sync translated to original
      translatedPanel.addEventListener('scroll', () => {
        const scrollPercent = translatedPanel.scrollTop / (translatedPanel.scrollHeight - translatedPanel.clientHeight);
        const targetScroll = scrollPercent * (originalPanel.scrollHeight - originalPanel.clientHeight);
        originalPanel.scrollTop = targetScroll;
      });
    }
  }

  formatText(text) {
    if (!text) return '<p class="placeholder-text">No content available</p>';
    
    // Split into paragraphs and format
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length === 0) {
      return '<p class="placeholder-text">No content available</p>';
    }

    return paragraphs.map(paragraph => 
      `<p>${paragraph.trim()}</p>`
    ).join('');
  }

  formatSentenceBySentence(originalText, translatedText) {
    // FIXED: Check if we have at least translated text (original text is optional)
    if (!translatedText) {
      return '<p class="placeholder-text">No content available for sentence comparison.</p>';
    }

    // Split texts into sentences - handle case where original text might not be available
    const originalSentences = originalText ? this.splitIntoSentences(originalText) : [];
    const translatedSentences = this.splitIntoSentences(translatedText);

    // Create sentence blocks for inline reading view
    const maxLength = Math.max(originalSentences.length, translatedSentences.length);
    let sentenceBlocksHTML = '';

    for (let i = 0; i < maxLength; i++) {
      const originalSentence = originalSentences[i] || '';
      const translatedSentence = translatedSentences[i] || '';

      if (originalSentence || translatedSentence) {
        sentenceBlocksHTML += `
          <div class="sentence-block">
            ${originalSentence ? `
              <div class="sentence-label original-label">📖 Original</div>
              <div class="original-sentence">${originalSentence}</div>
            ` : ''}
            ${translatedSentence ? `
              <div class="sentence-label translated-label">🌍 Translated</div>
              <div class="translated-sentence">${translatedSentence}</div>
            ` : ''}
          </div>
        `;
      }
    }

    return sentenceBlocksHTML || '<p class="placeholder-text">No sentences found for comparison.</p>';
  }

  splitIntoSentences(text) {
    if (!text) return [];
    
    // Split by common sentence endings, but be careful with abbreviations
    const sentences = text.split(/(?<=[.!?])\s+/).filter(sentence => sentence.trim());
    
    // If no sentences found, split by paragraphs
    if (sentences.length <= 1) {
      return text.split('\n\n').filter(paragraph => paragraph.trim());
    }
    
    return sentences;
  }

  showPlaceholder() {
    const placeholders = document.querySelectorAll('.inline-text, .panel-content');
    placeholders.forEach(element => {
      element.innerHTML = '<p class="placeholder-text">Upload a book to start reading in your preferred language.</p>';
    });
  }

  handleFileSelect(file) {
    const validation = Utils.validateFile(file);
    if (!validation.isValid) {
      Utils.showNotification(validation.errors.join('\n'), 'error');
      return;
    }

    this.currentFile = file;
    this.updateFileName(file.name);
    this.updateTranslateButton();
    Utils.showNotification(`File "${file.name}" selected successfully`, 'success');
  }

  updateFileName(fileName) {
    const fileNameElement = document.getElementById('fileName');
    if (fileNameElement) {
      fileNameElement.textContent = fileName;
      fileNameElement.style.display = 'block';
    }
  }

  updateTranslateButton() {
    const translateBtn = document.getElementById('translateBtn');
    if (translateBtn) {
      const canTranslate = this.currentFile && this.currentLanguage;
      translateBtn.disabled = !canTranslate;
    }
  }

  updatePlayAudioButton() {
    const playAudioBtn = document.getElementById('playAudioBtn');
    const audioLanguage = document.getElementById('audioLanguage');
    
    if (playAudioBtn && audioLanguage) {
      const hasContent = this.currentBook && this.currentBook.content;
      const hasLanguage = audioLanguage.value;
      playAudioBtn.disabled = !hasContent || !hasLanguage;
    }
  }

  updateVoicePlayAudioButton() {
    const voicePlayAudioBtn = document.getElementById('voicePlayAudioBtn');
    const voiceAudioLanguage = document.getElementById('voiceAudioLanguage');
    
    if (voicePlayAudioBtn && voiceAudioLanguage) {
      const hasContent = this.currentBook && this.currentBook.content;
      const hasLanguage = voiceAudioLanguage.value;
      voicePlayAudioBtn.disabled = !hasContent || !hasLanguage;
    }
  }

  async translateBook() {
    if (!this.currentFile || !this.currentLanguage) {
      Utils.showNotification('Please select a file and language', 'error');
      return;
    }

    const translateBtn = document.getElementById('translateBtn');
    const statusElement = document.getElementById('translationStatus');

    try {
      translateBtn.disabled = true;
      translateBtn.textContent = 'Translating...';
      if (statusElement) {
        statusElement.style.display = 'block';
        statusElement.querySelector('.status-text').textContent = 'Uploading and translating your book...';
      }

      const result = await APIHelper.translatePDF(this.currentFile, this.currentLanguage);

      // Save book to localStorage
      const bookData = {
        title: this.currentFile.name,
        content: result.translated_text,
        originalText: result.original_text || '',
        language: this.currentLanguage,
        dateAdded: new Date().toISOString(),
        currentPage: 1,
        notes: {},
        highlights: []
      };

      const books = StorageManager.getBooks();
      books[this.currentFile.name] = bookData;
      StorageManager.saveBooks(books);
      StorageManager.setCurrentBook(this.currentFile.name);

      this.currentBook = bookData;
      this.displayBookContent();
      this.updatePlayAudioButton();

      Utils.showNotification('Book translated and loaded successfully!', 'success');
      if (statusElement) {
        statusElement.querySelector('.status-text').textContent = 'Book translated and loaded successfully!';
      }

    } catch (error) {
      console.error('Translation error:', error);
      Utils.showNotification(error.message, 'error');
      if (statusElement) {
        statusElement.querySelector('.status-text').textContent = 'Translation failed. Please try again.';
      }
    } finally {
      translateBtn.disabled = false;
      translateBtn.textContent = '📚 Translate Book';
    }
  }

  // Voice Translation Audio Controls
  async playAudio() {
    if (!this.currentBook || !this.currentBook.content) {
      Utils.showNotification('No content available for audio playback', 'error');
      return;
    }

    const audioLanguage = document.getElementById('audioLanguage');
    if (!audioLanguage || !audioLanguage.value) {
      Utils.showNotification('Please select a language for audio', 'error');
      return;
    }

    try {
      const playAudioBtn = document.getElementById('playAudioBtn');
      playAudioBtn.disabled = true;
      playAudioBtn.textContent = 'Generating Audio...';

      const result = await APIHelper.speak(this.currentBook.content, audioLanguage.value, this.currentVoiceGender);
      
      if (result.audio_content) {
        const audioBlob = this.base64ToBlob(result.audio_content, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.audioPlayer.src = audioUrl;
        this.audioPlayer.play();
        
        this.updateAudioControls('playing');
        this.showAudioPlayer();
        
        Utils.showNotification('Audio generated successfully!', 'success');
      } else {
        throw new Error('No audio content received');
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      Utils.showNotification('Failed to generate audio', 'error');
    } finally {
      const playAudioBtn = document.getElementById('playAudioBtn');
      playAudioBtn.disabled = false;
      playAudioBtn.textContent = '🔊 Play Audio';
    }
  }

  async playVoiceAudio() {
    if (!this.currentBook || !this.currentBook.content) {
      Utils.showNotification('No content available for audio playback', 'error');
      return;
    }

    const voiceAudioLanguage = document.getElementById('voiceAudioLanguage');
    if (!voiceAudioLanguage || !voiceAudioLanguage.value) {
      Utils.showNotification('Please select a language for audio', 'error');
      return;
    }

    try {
      const voicePlayAudioBtn = document.getElementById('voicePlayAudioBtn');
      voicePlayAudioBtn.disabled = true;
      voicePlayAudioBtn.textContent = 'Generating Audio...';

      const result = await APIHelper.speak(this.currentBook.content, voiceAudioLanguage.value, this.currentAudioVoiceGender);
      
      if (result.audio_content) {
        const audioBlob = this.base64ToBlob(result.audio_content, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const voiceAudioElement = document.getElementById('voiceAudioElement');
        voiceAudioElement.src = audioUrl;
        voiceAudioElement.play();
        
        this.updateVoiceAudioControls('playing');
        this.showVoiceAudioPlayer();
        
        Utils.showNotification('Audio generated successfully!', 'success');
      } else {
        throw new Error('No audio content received');
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      Utils.showNotification('Failed to generate audio', 'error');
    } finally {
      const voicePlayAudioBtn = document.getElementById('voicePlayAudioBtn');
      voicePlayAudioBtn.disabled = false;
      voicePlayAudioBtn.textContent = '🔊 Play Audio Translation';
    }
  }

  pauseAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.updateAudioControls('paused');
    }
  }

  stopAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      this.updateAudioControls('stopped');
    }
  }

  showAudioPlayer() {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
      audioPlayer.style.display = 'block';
    }
  }

  updateAudioControls(state) {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (state === 'playing') {
      if (playBtn) playBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
    } else {
      if (playBtn) playBtn.style.display = 'inline-flex';
      if (pauseBtn) pauseBtn.style.display = 'none';
    }
  }

  resetAudioControls() {
    this.updateAudioControls('stopped');
  }

  updateProgress() {
    if (!this.audioPlayer) return;

    const progressFill = document.getElementById('progressFill');
    const timeDisplay = document.getElementById('timeDisplay');

    if (progressFill && this.audioPlayer.duration) {
      const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
      progressFill.style.width = `${progress}%`;
    }

    if (timeDisplay) {
      const currentTime = Utils.formatTime(this.audioPlayer.currentTime);
      const totalTime = Utils.formatTime(this.audioPlayer.duration || 0);
      timeDisplay.textContent = `${currentTime} / ${totalTime}`;
    }
  }

  updateTimeDisplay() {
    this.updateProgress();
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  showVoiceAudioPlayer() {
    const voiceAudioPlayer = document.getElementById('voiceAudioPlayer');
    if (voiceAudioPlayer) {
      voiceAudioPlayer.style.display = 'block';
    }
  }

  updateVoiceAudioControls(state) {
    const voicePlayBtn = document.getElementById('voicePlayBtn');
    const voicePauseBtn = document.getElementById('voicePauseBtn');

    if (state === 'playing') {
      if (voicePlayBtn) voicePlayBtn.style.display = 'none';
      if (voicePauseBtn) voicePauseBtn.style.display = 'inline-flex';
    } else {
      if (voicePlayBtn) voicePlayBtn.style.display = 'inline-flex';
      if (voicePauseBtn) voicePauseBtn.style.display = 'none';
    }
  }

  pauseVoiceAudio() {
    const voiceAudioElement = document.getElementById('voiceAudioElement');
    if (voiceAudioElement) {
      voiceAudioElement.pause();
      this.updateVoiceAudioControls('paused');
    }
  }

  stopVoiceAudio() {
    const voiceAudioElement = document.getElementById('voiceAudioElement');
    if (voiceAudioElement) {
      voiceAudioElement.pause();
      voiceAudioElement.currentTime = 0;
      this.updateVoiceAudioControls('stopped');
    }
  }
}

// Initialize reader page
let readerPage;
document.addEventListener('DOMContentLoaded', function() {
  readerPage = new ReaderPage();
  
  // Setup audio controls
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      readerPage.audioPlayer.play();
      readerPage.updateAudioControls('playing');
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      readerPage.pauseAudio();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      readerPage.stopAudio();
    });
  }

  // Setup voice audio controls
  const voicePlayBtn = document.getElementById('voicePlayBtn');
  const voicePauseBtn = document.getElementById('voicePauseBtn');
  const voiceStopBtn = document.getElementById('voiceStopBtn');

  if (voicePlayBtn) {
    voicePlayBtn.addEventListener('click', () => {
      const voiceAudioElement = document.getElementById('voiceAudioElement');
      voiceAudioElement.play();
      readerPage.updateVoiceAudioControls('playing');
    });
  }

  if (voicePauseBtn) {
    voicePauseBtn.addEventListener('click', () => {
      readerPage.pauseVoiceAudio();
    });
  }

  if (voiceStopBtn) {
    voiceStopBtn.addEventListener('click', () => {
      readerPage.stopVoiceAudio();
    });
  }
}); 