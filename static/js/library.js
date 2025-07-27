// ===== LIBRARY PAGE JAVASCRIPT =====

class LibraryPage {
  constructor() {
    this.books = {};
    this.currentFile = null;
    this.currentLanguage = '';
    this.init();
  }

  init() {
    this.loadBooks();
    this.setupEventListeners();
    this.renderBooks();
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

    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBooks(e.target.value);
      });
    }
  }

  handleFileSelect(file) {
    // Validate file
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

  async translateBook() {
    if (!this.currentFile || !this.currentLanguage) {
      Utils.showNotification('Please select a file and language', 'error');
      return;
    }

    const translateBtn = document.getElementById('translateBtn');
    const statusElement = document.getElementById('translationStatus');

    try {
      // Update UI
      translateBtn.disabled = true;
      translateBtn.textContent = 'Translating...';
      if (statusElement) {
        statusElement.textContent = 'Uploading and translating your book...';
      }

      // Call translation API
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

      this.books[this.currentFile.name] = bookData;
      StorageManager.saveBooks(this.books);

      // Update UI
      Utils.showNotification('Book translated and saved successfully!', 'success');
      if (statusElement) {
        statusElement.textContent = 'Book translated and saved successfully!';
      }

      // Reset form
      this.resetForm();
      this.renderBooks();

    } catch (error) {
      console.error('Translation error:', error);
      Utils.showNotification(error.message, 'error');
      if (statusElement) {
        statusElement.textContent = 'Translation failed. Please try again.';
      }
    } finally {
      // Reset button
      translateBtn.disabled = false;
      translateBtn.textContent = '📚 Translate Book';
    }
  }

  resetForm() {
    this.currentFile = null;
    this.currentLanguage = '';
    
    const fileInput = document.getElementById('fileInput');
    const targetLanguage = document.getElementById('targetLanguage');
    const fileName = document.getElementById('fileName');
    const statusElement = document.getElementById('translationStatus');

    if (fileInput) fileInput.value = '';
    if (targetLanguage) targetLanguage.value = '';
    if (fileName) {
      fileName.textContent = '';
      fileName.style.display = 'none';
    }
    if (statusElement) {
      statusElement.textContent = 'Ready to translate. Upload a PDF and select a language to begin.';
    }

    this.updateTranslateButton();
  }

  loadBooks() {
    this.books = StorageManager.getBooks();
  }

  renderBooks() {
    const booksList = document.getElementById('booksList');
    const emptyState = document.getElementById('emptyState');

    if (!booksList) return;

    const bookEntries = Object.entries(this.books);
    
    if (bookEntries.length === 0) {
      booksList.innerHTML = '';
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
      return;
    }

    if (emptyState) {
      emptyState.classList.add('hidden');
    }

    const booksHTML = bookEntries.map(([title, book]) => {
      const progress = this.calculateProgress(book);
      const languageName = this.getLanguageName(book.language);
      
      return `
        <div class="book-card" data-title="${title}">
          <div class="book-header">
            <div>
              <h3 class="book-title">${title}</h3>
              <p class="book-language">${languageName}</p>
            </div>
          </div>
          
          <div class="book-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <p class="progress-text">${progress}% complete</p>
          </div>
          
          <div class="book-actions">
            <button class="btn btn-primary read-btn" onclick="libraryPage.readBook('${title}')">
              📖 Continue Reading
            </button>
            <button class="btn btn-danger delete-btn" onclick="libraryPage.deleteBook('${title}')">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    booksList.innerHTML = booksHTML;
  }

  calculateProgress(book) {
    if (!book.content) return 0;
    
    const totalPages = Math.ceil(book.content.length / 1000); // Rough estimate
    const currentPage = book.currentPage || 1;
    
    return Math.min(Math.round((currentPage / totalPages) * 100), 100);
  }

  getLanguageName(languageCode) {
    const languageMap = {
      'hau_Latn': 'Hausa',
      'yor_Latn': 'Yoruba',
      'ibo_Latn': 'Igbo',
      'swh_Latn': 'Swahili',
      'kin_Latn': 'Kinyarwanda'
    };
    
    return languageMap[languageCode] || languageCode;
  }

  readBook(bookTitle) {
    StorageManager.setCurrentBook(bookTitle);
    window.location.href = '/static/reader.html';
  }

  deleteBook(bookTitle) {
    if (confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      delete this.books[bookTitle];
      StorageManager.saveBooks(this.books);
      
      // Clear current book if it's the one being deleted
      const currentBook = StorageManager.getCurrentBook();
      if (currentBook === bookTitle) {
        StorageManager.setCurrentBook('');
      }
      
      this.renderBooks();
      Utils.showNotification('Book deleted successfully', 'success');
    }
  }

  sortBooks(sortBy) {
    const bookEntries = Object.entries(this.books);
    
    switch (sortBy) {
      case 'title':
        bookEntries.sort(([a], [b]) => a.localeCompare(b));
        break;
      case 'language':
        bookEntries.sort(([, a], [, b]) => this.getLanguageName(a.language).localeCompare(this.getLanguageName(b.language)));
        break;
      case 'recent':
      default:
        bookEntries.sort(([, a], [, b]) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
    }

    // Re-render with sorted books
    const booksList = document.getElementById('booksList');
    if (booksList) {
      const booksHTML = bookEntries.map(([title, book]) => {
        const progress = this.calculateProgress(book);
        const languageName = this.getLanguageName(book.language);
        
        return `
          <div class="book-card" data-title="${title}">
            <div class="book-header">
              <div>
                <h3 class="book-title">${title}</h3>
                <p class="book-language">${languageName}</p>
              </div>
            </div>
            
            <div class="book-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <p class="progress-text">${progress}% complete</p>
            </div>
            
            <div class="book-actions">
              <button class="btn btn-primary read-btn" onclick="libraryPage.readBook('${title}')">
                📖 Continue Reading
              </button>
              <button class="btn btn-danger delete-btn" onclick="libraryPage.deleteBook('${title}')">
                🗑️ Delete
              </button>
            </div>
          </div>
        `;
      }).join('');

      booksList.innerHTML = booksHTML;
    }
  }
}

// Initialize library page
let libraryPage;
document.addEventListener('DOMContentLoaded', function() {
  libraryPage = new LibraryPage();
}); 