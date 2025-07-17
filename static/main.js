// Home page functionality

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('typewriterHeadline')) {
    loadTheme();
    setupEventListeners();
    startMarqueeQuotes();
  }
});

// --- Marquee Quotes (unchanged) ---
const QUOTES = [
  { text: '"Language is the road map of a culture. It tells you where its people come from and where they are going."', author: '— Rita Mae Brown' },
  { text: '"Reading is essential for those who seek to rise above the ordinary."', author: '— Jim Rohn' },
  { text: '"The beauty of the world lies in the diversity of its people."', author: '— African Proverb' },
  { text: '"Knowledge is like a garden; if it is not cultivated, it cannot be harvested."', author: '— African Proverb' },
];

function startMarqueeQuotes() {
  const marquee = document.getElementById('marqueeQuotes');
  if (!marquee) return;
  let html = '';
  for (let i = 0; i < 2; i++) {
    for (const q of QUOTES) {
      html += `<span class="inline-block px-8 text-xl md:text-2xl text-gray-700 italic">${q.text} <span class='text-lg text-gray-500 font-medium not-italic ml-2'>${q.author}</span></span>`;
    }
  }
  marquee.innerHTML = html;
  let pos = 0;
  const speed = 1;
  function animate() {
    pos -= speed;
    if (Math.abs(pos) >= marquee.scrollWidth / 2) pos = 0;
    marquee.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(animate);
  }
  animate();
}

// --- Theme Switcher and other homepage logic (unchanged) ---
function setupEventListeners() {
  const lightTheme = document.getElementById('lightTheme');
  const darkTheme = document.getElementById('darkTheme');
  const parchmentTheme = document.getElementById('parchmentTheme');
  if (lightTheme) lightTheme.addEventListener('click', () => setTheme('light'));
  if (darkTheme) darkTheme.addEventListener('click', () => setTheme('dark'));
  if (parchmentTheme) parchmentTheme.addEventListener('click', () => setTheme('parchment'));
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

function initializeAnimations() {
  // Add fade-in animation to elements as they come into view
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  }, observerOptions);
  
  // Observe elements for animation
  document.querySelectorAll('.bg-white\\/80, .text-center').forEach(el => {
    observer.observe(el);
  });
}

// Smooth scrolling for anchor links
function scrollToFeatures() {
  document.getElementById('features').scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  });
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  /* Title letter animation */
  .title-letter {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
  }
  
  .title-letter[data-letter="S"] { color: #3b82f6; }
  .title-letter[data-letter="o"] { color: #6b7280; }
  .title-letter[data-letter="M"] { color: #8b5cf6; }
  .title-letter[data-letter="a"] { color: #6b7280; }
  
  /* Typing effect */
  .typing-text {
    border-right: 2px solid transparent;
    white-space: nowrap;
    overflow: hidden;
  }
  
  /* Quote carousel */
  .quote-track {
    display: flex;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    width: 400%; /* 4 quotes * 100% */
  }
  
  .quote-slide {
    width: 25%; /* 100% / 4 quotes */
    flex-shrink: 0;
    opacity: 0.7;
    transform: scale(0.95);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .quote-slide.active {
    opacity: 1;
    transform: scale(1);
  }
  
  /* Enhanced animations */
  .fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Theme-specific styling */
  [data-theme="dark"] .title-letter[data-letter="S"] { color: #60a5fa; }
  [data-theme="dark"] .title-letter[data-letter="M"] { color: #a78bfa; }
  [data-theme="dark"] .title-letter[data-letter="o"],
  [data-theme="dark"] .title-letter[data-letter="a"] { color: #9ca3af; }
  
  .theme-parchment .title-letter[data-letter="S"] { color: #8b4513; }
  .theme-parchment .title-letter[data-letter="M"] { color: #654321; }
  .theme-parchment .title-letter[data-letter="o"],
  .theme-parchment .title-letter[data-letter="a"] { color: #654321; }
  
  [data-theme="dark"] .quote-slide p {
    color: #e5e7eb;
  }
  
  [data-theme="dark"] .quote-slide .text-gray-600 {
    color: #9ca3af;
  }
  
  .theme-parchment .quote-slide p {
    color: #2c1810;
  }
  
  .theme-parchment .quote-slide .text-gray-600 {
    color: #654321;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .quote-track {
      width: 400%;
    }
    
    .quote-slide {
      width: 25%;
    }
  }
`;
document.head.appendChild(style);

