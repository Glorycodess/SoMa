// ===== SETTINGS PAGE JAVASCRIPT =====

class SettingsPage {
  constructor() {
    this.settings = {};
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.renderSettings();
  }

  setupEventListeners() {
    // Font size controls
    const decreaseFontSize = document.getElementById('decreaseFontSize');
    const increaseFontSize = document.getElementById('increaseFontSize');

    if (decreaseFontSize) {
      decreaseFontSize.addEventListener('click', () => {
        this.settings.fontSize = Math.max(12, this.settings.fontSize - 2);
        this.updateFontSizeDisplay();
        this.saveSettings();
      });
    }

    if (increaseFontSize) {
      increaseFontSize.addEventListener('click', () => {
        this.settings.fontSize = Math.min(24, this.settings.fontSize + 2);
        this.updateFontSizeDisplay();
        this.saveSettings();
      });
    }

    // Reading mode selection
    const defaultReadingMode = document.getElementById('defaultReadingMode');
    if (defaultReadingMode) {
      defaultReadingMode.addEventListener('change', (e) => {
        this.settings.defaultReadingMode = e.target.value;
        this.saveSettings();
      });
    }

    // Audio speed selection
    const defaultAudioSpeed = document.getElementById('defaultAudioSpeed');
    if (defaultAudioSpeed) {
      defaultAudioSpeed.addEventListener('change', (e) => {
        this.settings.defaultAudioSpeed = parseFloat(e.target.value);
        this.saveSettings();
      });
    }

    // Preferred language selection
    const preferredLanguage = document.getElementById('preferredLanguage');
    if (preferredLanguage) {
      preferredLanguage.addEventListener('change', (e) => {
        this.settings.preferredLanguage = e.target.value;
        this.saveSettings();
      });
    }

    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this.clearAllData();
      });
    }

    // Export settings button
    const exportSettingsBtn = document.getElementById('exportSettingsBtn');
    if (exportSettingsBtn) {
      exportSettingsBtn.addEventListener('click', () => {
        this.exportSettings();
      });
    }
  }

  loadSettings() {
    this.settings = StorageManager.getSettings();
  }

  renderSettings() {
    this.updateFontSizeDisplay();
    this.updateSelectValues();
  }

  updateFontSizeDisplay() {
    const fontSizeDisplay = document.getElementById('currentFontSize');
    if (fontSizeDisplay) {
      fontSizeDisplay.textContent = this.settings.fontSize;
    }
  }

  updateSelectValues() {
    const defaultReadingMode = document.getElementById('defaultReadingMode');
    const defaultAudioSpeed = document.getElementById('defaultAudioSpeed');
    const preferredLanguage = document.getElementById('preferredLanguage');

    if (defaultReadingMode) {
      defaultReadingMode.value = this.settings.defaultReadingMode;
    }

    if (defaultAudioSpeed) {
      defaultAudioSpeed.value = this.settings.defaultAudioSpeed;
    }

    if (preferredLanguage) {
      preferredLanguage.value = this.settings.preferredLanguage;
    }
  }

  saveSettings() {
    StorageManager.saveSettings(this.settings);
    Utils.showNotification('Settings saved successfully', 'success');
  }

  clearAllData() {
    const confirmed = confirm(
      'Are you sure you want to clear all data? This will remove:\n' +
      '• All saved books\n' +
      '• Reading progress\n' +
      '• Notes and highlights\n' +
      '• All settings\n\n' +
      'This action cannot be undone.'
    );

    if (confirmed) {
      try {
        StorageManager.clearAllData();
        Utils.showNotification('All data cleared successfully', 'success');
        
        // Reset settings to defaults
        this.settings = {
          theme: 'light',
          fontSize: 16,
          defaultReadingMode: 'inline',
          defaultAudioSpeed: 1,
          preferredLanguage: ''
        };
        
        this.renderSettings();
        this.saveSettings();
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/static/home.html';
        }, 2000);
        
      } catch (error) {
        console.error('Error clearing data:', error);
        Utils.showNotification('Failed to clear data', 'error');
      }
    }
  }

  exportSettings() {
    try {
      const exportData = {
        settings: this.settings,
        books: StorageManager.getBooks(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `soma-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      Utils.showNotification('Settings exported successfully', 'success');
      
    } catch (error) {
      console.error('Error exporting settings:', error);
      Utils.showNotification('Failed to export settings', 'error');
    }
  }

  // Import settings (for future use)
  importSettings(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
            StorageManager.saveSettings(this.settings);
          }
          
          if (data.books) {
            StorageManager.saveBooks(data.books);
          }
          
          this.renderSettings();
          Utils.showNotification('Settings imported successfully', 'success');
          resolve();
          
        } catch (error) {
          console.error('Error parsing imported file:', error);
          Utils.showNotification('Invalid settings file', 'error');
          reject(error);
        }
      };
      
      reader.onerror = () => {
        Utils.showNotification('Failed to read file', 'error');
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
}

// Initialize settings page
let settingsPage;
document.addEventListener('DOMContentLoaded', function() {
  settingsPage = new SettingsPage();
}); 