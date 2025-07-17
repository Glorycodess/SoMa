// Translate page functionality

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  setupPDFJS();
  setupEventListeners();
  initializeState();
});

let pdfFile = null;
let originalText = '';
let translatedText = '';
let currentView = 'sideBySide';

// Pagination state
let originalPages = [];
let translatedPages = [];
let currentPageIndex = 0;
const WORDS_PER_PAGE = 300; // Adjust this value to control page size

// Audio state
let audioElement = null;
let audioUrl = null;

function setupPDFJS() {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function setupEventListeners() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const chooseFileBtn = document.getElementById('chooseFileBtn');
  const targetLanguage = document.getElementById('targetLanguage');
  const translateBtn = document.getElementById('translateBtn');

  dropzone.addEventListener('click', () => fileInput.click());
  chooseFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  dropzone.addEventListener('dragover', handleDragOver);
  dropzone.addEventListener('dragleave', handleDragLeave);
  dropzone.addEventListener('drop', handleDrop);
  fileInput.addEventListener('change', handleFileSelect);
  targetLanguage.addEventListener('change', handleLanguageChange);

  translateBtn.addEventListener('click', () => {
    if (pdfFile && targetLanguage.value) {
      startTranslation();
    }
  });

  document.getElementById('sideBySideBtn').addEventListener('click', () => setView('sideBySide'));
  document.getElementById('inlineBtn').addEventListener('click', () => setView('inline'));
  document.getElementById('audioBtn').addEventListener('click', () => setView('audio'));
  document.getElementById('lightTheme').addEventListener('click', () => setTheme('light'));
  document.getElementById('darkTheme').addEventListener('click', () => setTheme('dark'));
  document.getElementById('parchmentTheme').addEventListener('click', () => setTheme('parchment'));
  document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPageIndex - 1));
  document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPageIndex + 1));
  
  // Audio player controls
  setupAudioControls();
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type === 'application/pdf') {
      setFile(file);
    } else {
      showError('Please select a valid PDF file.');
    }
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    setFile(file);
  }
}

function setFile(file) {
  pdfFile = file;
  document.getElementById('fileName').textContent = file.name;
  updateTranslationStatus('PDF uploaded successfully. Select a language to translate.');
  updateTranslateBtnState();
}

function handleLanguageChange() {
  updateTranslateBtnState();
  const targetLanguage = document.getElementById('targetLanguage').value;
  if (targetLanguage && pdfFile) {
    updateTranslationStatus('Ready to translate. Click "Translate Book".');
  } else if (targetLanguage) {
    updateTranslationStatus('Language selected. Upload a PDF to translate.');
  }
}

function updateTranslateBtnState() {
  const btn = document.getElementById('translateBtn');
  const targetLanguage = document.getElementById('targetLanguage').value;
  btn.disabled = !(pdfFile && targetLanguage);
}

async function startTranslation() {
  if (!pdfFile || !document.getElementById('targetLanguage').value) {
    return;
  }
  showLoading(true);
  updateTranslationStatus('Extracting text from PDF...');
  try {
    originalText = await extractTextFromPDF(pdfFile);
    updateTranslationStatus('Text extracted. Translating...');
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('target_language', document.getElementById('targetLanguage').value);

    const response = await fetch('/translate-pdf', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    const data = await response.json();

    // Backend returns full translated paragraphs array — join for local pagination
    if (Array.isArray(data.translated_text)) {
      translatedText = data.translated_text.join('\n\n');
    } else {
      translatedText = data.translated_text || 'Translation not available';
    }

    // Paginate locally
    originalPages = splitTextIntoPages(originalText);
    translatedPages = splitTextIntoPages(translatedText);
    currentPageIndex = 0;

    displayResults();
    updateTranslationStatus('Translation completed successfully!');
  } catch (error) {
    console.error('Translation error:', error);
    showError('Translation failed. Please try again.');
  } finally {
    showLoading(false);
  }
}

function splitTextIntoPages(text) {
  if (!text) return [''];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  if (paragraphs.length === 0) return [text];
  const pages = [];
  let currentPage = '';
  let currentWordCount = 0;
  for (const paragraph of paragraphs) {
    const paragraphWordCount = paragraph.split(/\s+/).length;
    if (currentWordCount + paragraphWordCount > WORDS_PER_PAGE && currentPage.trim()) {
      pages.push(currentPage.trim());
      currentPage = paragraph;
      currentWordCount = paragraphWordCount;
    } else {
      currentPage = currentPage ? currentPage + '\n\n' + paragraph : paragraph;
      currentWordCount += paragraphWordCount;
    }
  }
  if (currentPage.trim()) pages.push(currentPage.trim());
  return pages.length > 0 ? pages : [text];
}

function goToPage(pageIndex) {
  const totalPages = Math.max(originalPages.length, translatedPages.length);
  if (pageIndex < 0 || pageIndex >= totalPages) {
    return;
  }
  currentPageIndex = pageIndex;
  updatePageDisplay();
  updatePaginationButtons();
}

function updatePageDisplay() {
  const originalPage = originalPages[currentPageIndex] || '';
  const translatedPage = translatedPages[currentPageIndex] || '';
  document.getElementById('originalText').textContent = originalPage;
  document.getElementById('translatedText').textContent = translatedPage;
  document.getElementById('audioText').textContent = translatedPage;
  
  if (currentView === 'inline') updateInlineView();
  if (currentView === 'audio') updateAudioView();
  
  document.getElementById('currentPage').textContent = currentPageIndex + 1;
  document.getElementById('totalPages').textContent = Math.max(originalPages.length, translatedPages.length);
}

function updatePaginationButtons() {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const totalPages = Math.max(originalPages.length, translatedPages.length);

  prevBtn.disabled = currentPageIndex <= 0;
  nextBtn.disabled = currentPageIndex >= totalPages - 1;
}

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n\n';
  }
  return text.trim();
}

function displayResults() {
  document.getElementById('resultsSection').classList.remove('hidden');
  const languageName = getLanguageName(document.getElementById('targetLanguage').value);
  document.getElementById('selectedLanguage').textContent = languageName;
  document.getElementById('translatedHeader').textContent = `Translated Text (${languageName})`;
  document.getElementById('audioHeader').textContent = `Audio Reading Mode (${languageName})`;
  
  // Add audio button to the translated header area
  addAudioButton();
  
  updatePageDisplay();
  updatePaginationButtons();
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setView(view) {
  currentView = view;
  updateView();
}

function updateView() {
  const sideBySideView = document.getElementById('sideBySideView');
  const inlineView = document.getElementById('inlineView');
  const audioView = document.getElementById('audioView');
  const sideBySideBtn = document.getElementById('sideBySideBtn');
  const inlineBtn = document.getElementById('inlineBtn');
  const audioBtn = document.getElementById('audioBtn');
  
  // Hide all views
  sideBySideView.classList.add('hidden');
  inlineView.classList.add('hidden');
  audioView.classList.add('hidden');
  
  // Reset all buttons
  sideBySideBtn.className = 'px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900';
  inlineBtn.className = 'px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900';
  audioBtn.className = 'px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900';
  
  if (currentView === 'sideBySide') {
    sideBySideView.classList.remove('hidden');
    sideBySideBtn.className = 'px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white';
  } else if (currentView === 'inline') {
    inlineView.classList.remove('hidden');
    inlineBtn.className = 'px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white';
    updateInlineView();
  } else if (currentView === 'audio') {
    audioView.classList.remove('hidden');
    audioBtn.className = 'px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white';
    updateAudioView();
  }
}

function updateInlineView() {
  if (!originalPages.length || !translatedPages.length) return;
  const originalPage = originalPages[currentPageIndex] || '';
  const translatedPage = translatedPages[currentPageIndex] || '';
  const originalSentences = originalPage.split(/[.!?]+/).filter(s => s.trim());
  const translatedSentences = translatedPage.split(/[.!?]+/).filter(s => s.trim());
  let html = '';
  const maxLength = Math.max(originalSentences.length, translatedSentences.length);
  for (let i = 0; i < maxLength; i++) {
    const originalSentence = originalSentences[i] || '';
    const translatedSentence = translatedSentences[i] || '';
    if (translatedSentence.trim()) {
      html += `<div class="inline-sentence mb-4">
        <p class="text-gray-900 font-medium mb-2">${translatedSentence.trim()}.</p>
        <p class="text-gray-600 italic text-sm">${originalSentence.trim() || ''}.</p>
      </div>`;
    }
  }
  document.getElementById('inlineContent').innerHTML = html;
}

function loadTheme() {
  const savedTheme = localStorage.getItem('soma-theme') || 'light';
  setTheme(savedTheme);
}

function setTheme(theme) {
  const html = document.documentElement;
  const body = document.body;
  html.removeAttribute('data-theme');
  body.classList.remove('theme-light', 'theme-dark', 'theme-parchment');
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    body.classList.add('theme-dark');
  } else if (theme === 'parchment') {
    body.classList.add('theme-parchment');
  } else {
    body.classList.add('theme-light');
  }
  updateThemeToggleButtons(theme);
  localStorage.setItem('soma-theme', theme);
}

function updateThemeToggleButtons(theme) {
  const lightBtn = document.getElementById('lightTheme');
  const darkBtn = document.getElementById('darkTheme');
  const parchmentBtn = document.getElementById('parchmentTheme');
  [lightBtn, darkBtn, parchmentBtn].forEach(btn => {
    if (btn) btn.className = 'px-3 py-1 rounded-md text-sm font-medium theme-toggle-inactive';
  });
  if (theme === 'light' && lightBtn) lightBtn.className = 'px-3 py-1 rounded-md text-sm font-medium theme-toggle-active';
  if (theme === 'dark' && darkBtn) darkBtn.className = 'px-3 py-1 rounded-md text-sm font-medium theme-toggle-active';
  if (theme === 'parchment' && parchmentBtn) parchmentBtn.className = 'px-3 py-1 rounded-md text-sm font-medium theme-toggle-active';
}

function updateTranslationStatus(message) {
  document.getElementById('translationStatus').textContent = message;
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.toggle('hidden', !show);
}

function showError(message) {
  updateTranslationStatus(`Error: ${message}`);
  showLoading(false);
}

function getLanguageName(code) {
  const map = {
    'hau_Latn': 'Hausa',
    'yor_Latn': 'Yoruba',
    'ibo_Latn': 'Igbo',
    'swh_Latn': 'Swahili',
    'kin_Latn': 'Kinyarwanda'
  };
  return map[code] || code;
}

function initializeState() {
  updateView();
  updateTranslateBtnState();
}

async function playTranslatedAudio(text) {
  try {
    updateTranslationStatus('Generating audio...');
    
    const response = await fetch('/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        language_code: 'en-US'
      })
    });
    
    if (!response.ok) {
      throw new Error('Audio generation failed');
    }
    
    const data = await response.json();
    
    if (data.audio_content) {
      const audio = new Audio('data:audio/mp3;base64,' + data.audio_content);
      audio.play().catch(error => {
        console.error('Audio playback failed:', error);
        updateTranslationStatus('Translation completed! (Audio playback failed)');
      });
      updateTranslationStatus('Translation completed! Playing audio...');
    } else {
      throw new Error('No audio content received');
    }
  } catch (error) {
    console.error('Audio generation error:', error);
    updateTranslationStatus('Translation completed! (Audio generation failed)');
  }
}

function addAudioButton() {
  const translatedHeader = document.getElementById('translatedHeader');
  
  // Check if audio button already exists
  if (document.getElementById('audioBtn')) {
    return;
  }
  
  // Create audio button
  const audioBtn = document.createElement('button');
  audioBtn.id = 'audioBtn';
  audioBtn.className = 'ml-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm flex items-center';
  audioBtn.innerHTML = `
    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
    </svg>
    Play Audio
  `;
  
  audioBtn.addEventListener('click', () => {
    playTranslatedAudio(translatedText);
  });
  
  // Insert button after the header
  translatedHeader.parentNode.insertBefore(audioBtn, translatedHeader.nextSibling);
}

function setupAudioControls() {
  audioElement = document.getElementById('audioElement');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const progressBar = document.getElementById('progressBar');
  const rewindBtn = document.getElementById('rewindBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  
  playPauseBtn.addEventListener('click', togglePlayPause);
  progressBar.addEventListener('input', seekAudio);
  rewindBtn.addEventListener('click', () => seekAudioBySeconds(-10));
  forwardBtn.addEventListener('click', () => seekAudioBySeconds(10));
  
  // Audio element events
  audioElement.addEventListener('loadedmetadata', updateAudioDuration);
  audioElement.addEventListener('timeupdate', updateAudioProgress);
  audioElement.addEventListener('ended', handleAudioEnded);
}

function updateAudioView() {
  if (!translatedPages.length) return;
  
  const translatedPage = translatedPages[currentPageIndex] || '';
  document.getElementById('audioText').textContent = translatedPage;
  
  // Generate audio for current page if not already available
  if (currentView === 'audio' && translatedPage.trim()) {
    generateAudioForPage(translatedPage);
  }
}

async function generateAudioForPage(text) {
  try {
    const response = await fetch('/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        language_code: 'en-US'
      })
    });
    
    if (!response.ok) {
      throw new Error('Audio generation failed');
    }
    
    const data = await response.json();
    
    if (data.audio_content) {
      audioUrl = 'data:audio/mp3;base64,' + data.audio_content;
      audioElement.src = audioUrl;
      audioElement.load();
    }
  } catch (error) {
    console.error('Audio generation error:', error);
  }
}

function togglePlayPause() {
  if (audioElement.paused) {
    audioElement.play();
    document.getElementById('playIcon').classList.add('hidden');
    document.getElementById('pauseIcon').classList.remove('hidden');
  } else {
    audioElement.pause();
    document.getElementById('playIcon').classList.remove('hidden');
    document.getElementById('pauseIcon').classList.add('hidden');
  }
}

function seekAudio() {
  const progressBar = document.getElementById('progressBar');
  const time = (progressBar.value / 100) * audioElement.duration;
  audioElement.currentTime = time;
}

function seekAudioBySeconds(seconds) {
  audioElement.currentTime = Math.max(0, Math.min(audioElement.duration, audioElement.currentTime + seconds));
}

function updateAudioProgress() {
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const currentTimeSpan = document.getElementById('currentTime');
  
  if (audioElement.duration) {
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    progressBar.value = progress;
    progressFill.style.width = progress + '%';
  }
  
  currentTimeSpan.textContent = formatTime(audioElement.currentTime);
}

function updateAudioDuration() {
  const totalTimeSpan = document.getElementById('totalTime');
  totalTimeSpan.textContent = formatTime(audioElement.duration);
}

function handleAudioEnded() {
  document.getElementById('playIcon').classList.remove('hidden');
  document.getElementById('pauseIcon').classList.add('hidden');
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}


