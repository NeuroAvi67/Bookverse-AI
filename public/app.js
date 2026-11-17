/**
 * ==============================================================================
 * BOOKVERSE AI — CORE APPLICATION CONTROLLER
 * ==============================================================================
 * Orchestrates:
 * 1. SPA Navigation & Section Routing
 * 2. Intelligent Book Search & Normalized Metadata Aggregation
 * 3. 3D Hardcover Book State Synchronization
 * 4. Multi-Tier AI Summaries (1m, 5m, 15m, Chapter breakdowns)
 * 5. Deep Research Dossier Generation & Academic Citations
 * 6. Contextual Conversational AI Book Assistant
 * 7. Neural Audiobook Player & Web Speech Narration Engine
 * 8. Comparative Epistemology Matrix
 * 9. Local-First & Supabase Personal Library Persistence
 * 10. System Health Telemetry & Settings
 * ==============================================================================
 */

// Global Application State
const BookVerseState = {
  activeSection: 'home',
  searchMode: 'all',
  currentBook: null,
  curatedBooks: [],
  catalogResults: [],
  compareQueue: [],
  library: {
    saved: [],
    reading: [],
    completed: [],
    dossiers: []
  },
  audioPlayer: {
    isPlaying: false,
    utterance: null,
    speechRate: 1.0,
    currentTime: 0,
    duration: 870, // 14m 30s
    timerInterval: null,
    sleepTimerId: null
  },
  chatHistory: [],
  userSettings: {
    geminiKey: '',
    openaiKey: '',
    graphicsMode: 'high'
  }
};

// ==============================================================================
// 1. INITIALIZATION & LIFECYCLE
// ==============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();
  setupNavigationHandlers();
  setupSearchHandlers();
  setupStudioHandlers();
  setupAudioPlayer();
  
  // Load initial curated masterworks
  await fetchCuratedShowcase();

  // Check backend server health
  await checkServerHealth();
});

function loadLocalState() {
  try {
    const savedLib = localStorage.getItem('bv_library');
    if (savedLib) BookVerseState.library = JSON.parse(savedLib);

    const savedSettings = localStorage.getItem('bv_settings');
    if (savedSettings) BookVerseState.userSettings = JSON.parse(savedSettings);

    const savedQueue = localStorage.getItem('bv_compare_queue');
    if (savedQueue) BookVerseState.compareQueue = JSON.parse(savedQueue);

    updateLibraryBadges();
    updateCompareQueueUI();
  } catch (e) {
    console.warn('Local storage load error:', e);
  }
}

function persistLibrary() {
  try {
    localStorage.setItem('bv_library', JSON.stringify(BookVerseState.library));
    updateLibraryBadges();
  } catch (e) {
    console.warn('Failed to persist library:', e);
  }
}

function updateLibraryBadges() {
  const totalSaved = BookVerseState.library.saved.length;
  const navCount = document.getElementById('nav-library-count');
  if (navCount) navCount.innerText = totalSaved;

  const countSaved = document.getElementById('lib-count-saved');
  if (countSaved) countSaved.innerText = totalSaved;

  const countReading = document.getElementById('lib-count-reading');
  if (countReading) countReading.innerText = BookVerseState.library.reading.length;

  const countCompleted = document.getElementById('lib-count-completed');
  if (countCompleted) countCompleted.innerText = BookVerseState.library.completed.length;
}

// ==============================================================================
// 2. SPA NAVIGATION & ROUTING
// ==============================================================================
function setupNavigationHandlers() {
  const navLinks = document.querySelectorAll('.bv-nav-links .nav-item');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      navigateTo(target);
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-trigger');
  const navMenu = document.querySelector('.bv-nav-links');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navMenu.style.display === 'flex';
      navMenu.style.display = isVisible ? 'none' : 'flex';
    });
  }
}

function navigateTo(sectionId) {
  BookVerseState.activeSection = sectionId;

  // Update nav links
  document.querySelectorAll('.bv-nav-links .nav-item').forEach(link => {
    if (link.getAttribute('data-target') === sectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Switch visible section
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const activeSec = document.getElementById(`section-${sectionId}`);
  if (activeSec) {
    activeSec.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Hook specific triggers
  if (sectionId === 'library') renderLibraryGrid();
  if (sectionId === 'compare') renderComparisonSlots();
}

// ==============================================================================
// 3. CURATED SHOWCASE & 3D INITIALIZATION
// ==============================================================================
async function fetchCuratedShowcase() {
  try {
    const res = await fetch('/api/books/curated/showcase');
    if (!res.ok) throw new Error('Failed to fetch curated showcase');
    const data = await res.json();
    BookVerseState.curatedBooks = data.curated || [];
    renderTrendingBooks(BookVerseState.curatedBooks);

    // Set initial 3D featured book
    if (BookVerseState.curatedBooks.length > 0) {
      setActiveBook(BookVerseState.curatedBooks[0], false);
    }
  } catch (err) {
    console.error('Error fetching showcase:', err);
  }
}

function renderTrendingBooks(books) {
  const grid = document.getElementById('trending-books-grid');
  if (!grid) return;

  grid.innerHTML = books.map(book => createBookCardHTML(book)).join('');
}

function createBookCardHTML(book) {
  const authorName = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown');
  const rating = book.rating || book.averageRating || 4.7;
  const category = (book.categories && book.categories[0]) || book.category || book.genre || 'Literature';
  const cover = book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  return `
    <div class="book-item-card" onclick="handleBookCardClick('${book.id}')">
      <div class="card-cover-wrap">
        <img src="${cover}" alt="${escapeHTML(book.title)}" loading="lazy">
        <div class="card-overlay-actions">
          <button class="btn btn-gold btn-sm" onclick="event.stopPropagation(); loadBookInto3DAndOpen('${book.id}')">
            <span>Inspect in 3D</span>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); quickAddCompare('${book.id}')">
            <span>+ Compare</span>
          </button>
        </div>
      </div>
      <div class="card-info">
        <span class="card-category">${escapeHTML(category)}</span>
        <h4 class="card-title">${escapeHTML(book.title)}</h4>
        <p class="card-author">${escapeHTML(authorName)}</p>
        <div class="card-footer">
          <span class="card-rating">★ ${rating}</span>
          <span class="card-pages">${book.pageCount ? `${book.pageCount} pages` : 'Special Edition'}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// ==============================================================================
// 4. BOOK SEARCH & METADATA AGGREGATOR
// ==============================================================================
function setupSearchHandlers() {
  const modeTabs = document.querySelectorAll('.search-mode-tab');
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      BookVerseState.searchMode = tab.getAttribute('data-mode') || 'all';
    });
  });
}

async function handleSearchSubmit(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('hero-search-input');
  const query = input?.value?.trim();
  if (!query) return;

  await executeSearch(query, BookVerseState.searchMode);
  navigateTo('explore');
  const catInput = document.getElementById('catalog-search-input');
  if (catInput) catInput.value = query;
}

function quickSearch(title) {
  const input = document.getElementById('hero-search-input');
  if (input) input.value = title;
  executeSearch(title, 'all');
  navigateTo('explore');
}

function quickCategorySearch(category) {
  const catInput = document.getElementById('catalog-search-input');
  if (catInput) catInput.value = category;
  executeSearch(category, 'subject');
  navigateTo('explore');
}

function triggerCatalogSearch() {
  const input = document.getElementById('catalog-search-input');
  const query = input?.value?.trim();
  if (query) executeSearch(query, 'all');
}

async function executeSearch(query, type = 'all') {
  const statusBar = document.getElementById('search-status-bar');
  const statusText = document.getElementById('search-status-text');
  const resultsGrid = document.getElementById('catalog-results-grid');
  const emptyState = document.getElementById('catalog-empty-state');

  if (statusBar) statusBar.style.display = 'flex';
  if (statusText) statusText.innerText = `Searching global index for "${query}"...`;
  if (emptyState) emptyState.style.display = 'none';

  try {
    const url = `/api/books/search?q=${encodeURIComponent(query)}&type=${type}&limit=24`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
    const data = await res.json();

    BookVerseState.catalogResults = data.books || [];

    if (resultsGrid) {
      if (BookVerseState.catalogResults.length === 0) {
        resultsGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
      } else {
        resultsGrid.innerHTML = BookVerseState.catalogResults.map(createBookCardHTML).join('');
      }
    }

    // Automatically synchronize top result into 3D stage
    if (BookVerseState.catalogResults.length > 0) {
      setActiveBook(BookVerseState.catalogResults[0], false);
    }
  } catch (err) {
    console.error('Search query error:', err);
    if (resultsGrid) resultsGrid.innerHTML = `<p class="text-muted" style="padding: 2rem;">Error querying search API: ${err.message}</p>`;
  } finally {
    if (statusBar) statusBar.style.display = 'none';
  }
}

// ==============================================================================
// 5. ACTIVE BOOK & 3D HARDCOVER SYNCHRONIZATION
// ==============================================================================
function findBookById(id) {
  return BookVerseState.curatedBooks.find(b => b.id === id) ||
         BookVerseState.catalogResults.find(b => b.id === id) ||
         BookVerseState.library.saved.find(b => b.id === id) ||
         BookVerseState.currentBook;
}

function setActiveBook(book, triggerOpen = false) {
  if (!book) return;
  BookVerseState.currentBook = book;

  // Update 3D Stage Info Bar
  const titleEl = document.getElementById('featured-title');
  const authorEl = document.getElementById('featured-author');
  const authorStr = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown');
  const genreStr = (book.categories && book.categories[0]) || book.genre || 'Literature';

  if (titleEl) titleEl.innerText = book.title;
  if (authorEl) authorEl.innerText = `${authorStr} • ${genreStr}`;

  // Update 2D Fallback Cover
  const fallbackImg = document.getElementById('fallback-cover-img');
  if (fallbackImg && book.coverImage) fallbackImg.src = book.coverImage;

  // Update 3D Texture dynamically
  if (window.book3DEngine) {
    window.book3DEngine.updateBookCover(book.coverImage, book.title, authorStr);
    if (triggerOpen) {
      window.book3DEngine.openBook(() => openActiveBookStudio());
    }
  }

  // Update Assistant context panel
  updateAssistantActiveBook(book);
}

function handleBookCardClick(id) {
  const book = findBookById(id);
  if (book) {
    setActiveBook(book, false);
    openActiveBookStudio();
  }
}

function loadBookInto3DAndOpen(id) {
  const book = findBookById(id);
  if (book) {
    setActiveBook(book, true);
    navigateTo('home');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}

// ==============================================================================
// 6. BOOK STUDIO MODAL (OVERVIEW, SUMMARIES, DOSSIER, AUDIO, CHAT)
// ==============================================================================
function setupStudioHandlers() {
  const tabs = document.querySelectorAll('.studio-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabTarget = tab.getAttribute('data-tab');
      switchStudioTab(tabTarget);
    });
  });

  // Summary Tier Tabs
  const tierTabs = document.querySelectorAll('.tier-tab');
  tierTabs.forEach(tTab => {
    tTab.addEventListener('click', () => {
      tierTabs.forEach(t => t.classList.remove('active'));
      tTab.classList.add('active');
      const tier = tTab.getAttribute('data-tier');
      renderSummaryTier(tier);
    });
  });
}

function switchStudioTab(tabId) {
  document.querySelectorAll('.studio-tab').forEach(t => {
    if (t.getAttribute('data-tab') === tabId) t.classList.add('active');
    else t.classList.remove('active');
  });

  document.querySelectorAll('.studio-content-panel').forEach(p => {
    p.classList.remove('active');
  });

  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) activePanel.classList.add('active');

  // Trigger content generators if needed
  if (tabId === 'summaries' && !BookVerseState.currentBook.summaryData) {
    fetchBookSummary(BookVerseState.currentBook);
  }
  if (tabId === 'research' && !BookVerseState.currentBook.researchData) {
    fetchStudioResearchDossier(BookVerseState.currentBook);
  }
  if (tabId === 'audiobook') {
    updateAudiobookPlayerMetadata(BookVerseState.currentBook);
  }
}

function openActiveBookStudio() {
  const book = BookVerseState.currentBook;
  if (!book) return;

  const modal = document.getElementById('book-studio-modal');
  if (!modal) return;

  // Populate Header
  const titleEl = document.getElementById('studio-title');
  const authorEl = document.getElementById('studio-author');
  const catEl = document.getElementById('studio-category');
  const authorStr = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown');
  
  if (titleEl) titleEl.innerText = book.title;
  if (authorEl) authorEl.innerText = `${authorStr} • ${book.publishedDate || 'Archive'}`;
  if (catEl) catEl.innerText = (book.categories && book.categories[0]) || book.genre || 'Masterwork';

  // Populate Overview tab
  const coverImg = document.getElementById('studio-cover-img');
  if (coverImg && book.coverImage) coverImg.src = book.coverImage;

  const isbnEl = document.getElementById('studio-isbn');
  if (isbnEl) isbnEl.innerText = book.isbn || 'N/A';

  const pagesEl = document.getElementById('studio-pages');
  if (pagesEl) pagesEl.innerText = book.pageCount || 'Unknown';

  const pubEl = document.getElementById('studio-publisher');
  if (pubEl) pubEl.innerText = book.publisher || 'Independent Press';

  const langEl = document.getElementById('studio-language');
  if (langEl) langEl.innerText = book.language || 'EN';

  const synEl = document.getElementById('studio-synopsis');
  if (synEl) synEl.innerText = book.description || 'No extended synopsis cataloged for this edition.';

  // Check save state
  updateStudioSaveButton();

  // Reset to Overview tab
  switchStudioTab('overview');

  modal.classList.add('active');
}

function closeBookStudioModal() {
  const modal = document.getElementById('book-studio-modal');
  if (modal) modal.classList.remove('active');
  if (window.book3DEngine && window.book3DEngine.isOpen) {
    window.book3DEngine.closeBook();
  }
}

function updateStudioSaveButton() {
  const saveBtn = document.getElementById('studio-save-lib-btn');
  const saveLabel = document.getElementById('studio-save-label');
  if (!saveBtn || !saveLabel || !BookVerseState.currentBook) return;

  const isSaved = BookVerseState.library.saved.some(b => b.id === BookVerseState.currentBook.id);
  saveLabel.innerText = isSaved ? 'Saved in Library ✓' : 'Add to Library';
  if (isSaved) {
    saveBtn.classList.add('btn-gold');
    saveBtn.classList.remove('btn-outline');
  } else {
    saveBtn.classList.remove('btn-gold');
    saveBtn.classList.add('btn-outline');
  }
}

function toggleSaveCurrentBook() {
  const book = BookVerseState.currentBook;
  if (!book) return;

  const idx = BookVerseState.library.saved.findIndex(b => b.id === book.id);
  if (idx >= 0) {
    BookVerseState.library.saved.splice(idx, 1);
  } else {
    BookVerseState.library.saved.unshift(book);
  }

  persistLibrary();
  updateStudioSaveButton();
}

// ==============================================================================
// 7. MULTI-TIER AI BOOK SUMMARIES (1m, 5m, 15m, Chapters)
// ==============================================================================
async function fetchBookSummary(book) {
  const displayBox = document.getElementById('summary-display-box');
  if (displayBox) {
    displayBox.innerHTML = `
      <div class="text-center" style="padding: 2.5rem;">
        <div class="pulsing-dot" style="margin: 0 auto 1rem auto;"></div>
        <p>Synthesizing multi-tier literary breakdown for "${book.title}"...</p>
      </div>
    `;
  }

  try {
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: book.title,
        author: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
        provider: 'gemini'
      })
    });

    const data = await res.json();
    book.summaryData = data.summary;
    renderSummaryTier('1min');
  } catch (err) {
    console.error('Error fetching summary:', err);
    if (displayBox) {
      displayBox.innerHTML = `<p class="text-muted">Failed to generate summary: ${err.message}</p>`;
    }
  }
}

function renderSummaryTier(tier) {
  const displayBox = document.getElementById('summary-display-box');
  const summary = BookVerseState.currentBook?.summaryData;
  if (!displayBox || !summary) return;

  if (tier === '1min') {
    const one = summary.oneMinuteSummary;
    displayBox.innerHTML = `
      <div class="summary-tier-content">
        <h3 class="gold-gradient" style="font-size: 1.4rem; margin-bottom: 0.75rem;">${one.headline}</h3>
        <div class="thesis-callout" style="margin-bottom: 1.5rem;">
          <strong>Core Takeaway:</strong> ${one.coreTakeaway}
        </div>
        <h4 style="color: var(--gold-light); margin-bottom: 0.75rem;">Key Pillars:</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem;">
          ${one.keyTakeaways.map(t => `<li style="display:flex; gap:0.5rem;"><span style="color:var(--gold-primary);">✦</span> <span>${t}</span></li>`).join('')}
        </ul>
      </div>
    `;
  } else if (tier === '5min') {
    const five = summary.fiveMinuteSummary;
    displayBox.innerHTML = `
      <div class="summary-tier-content">
        <h4 style="color: var(--gold-light); margin-bottom: 0.5rem;">Background & Epistemic Context</h4>
        <p style="margin-bottom: 1.5rem;">${five.backgroundAndContext}</p>
        
        <div class="thesis-callout" style="margin-bottom: 1.5rem;">
          <strong>Central Thesis:</strong> ${five.centralThesis}
        </div>

        <h4 style="color: var(--gold-light); margin-bottom: 0.75rem;">Major Conceptual Frameworks:</h4>
        <div style="display:grid; gap: 1rem; margin-bottom: 1.5rem;">
          ${five.majorFrameworks.map(f => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 1rem; border-radius: 8px;">
              <strong style="color: #FFF; display:block; margin-bottom: 0.3rem;">${f.title}</strong>
              <span style="color: var(--text-muted); font-size: 0.9rem;">${f.explanation}</span>
            </div>
          `).join('')}
        </div>

        <h4 style="color: var(--gold-light); margin-bottom: 0.75rem;">Practical Action Lessons:</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem;">
          ${five.practicalLessons.map(l => `<li style="display:flex; gap:0.5rem;"><span style="color:var(--blue-electric);">✓</span> <span>${l}</span></li>`).join('')}
        </ul>
      </div>
    `;
  } else if (tier === '15min') {
    const fifteen = summary.fifteenMinuteSummary;
    displayBox.innerHTML = `
      <div class="summary-tier-content">
        <h4 style="color: var(--gold-light); margin-bottom: 0.5rem;">Exhaustive Synthesis</h4>
        <p style="margin-bottom: 1.5rem;">${fifteen.comprehensiveBreakdown}</p>

        <h4 style="color: var(--gold-light); margin-bottom: 0.75rem;">Thematic Arcs:</h4>
        <div style="display:grid; gap: 1rem; margin-bottom: 1.75rem;">
          ${fifteen.chapterOrThematicArcs.map(a => `
            <div style="background: rgba(3,7,18,0.7); border-left: 3px solid var(--gold-primary); padding: 1rem 1.25rem;">
              <h5 style="color: #FFF; font-size: 1rem; margin-bottom: 0.3rem;">${a.section}</h5>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">${a.summary}</p>
              <small style="color: var(--gold-champagne); font-family: var(--font-mono);">Insight: ${a.coreInsight}</small>
            </div>
          `).join('')}
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div style="background: rgba(56,189,248,0.05); border: 1px solid rgba(56,189,248,0.2); padding: 1rem; border-radius: 8px;">
            <strong style="color: var(--blue-electric); display:block; margin-bottom: 0.5rem;">Analytical Strengths:</strong>
            <ul style="font-size: 0.85rem; color: var(--text-muted); padding-left: 1.2rem;">
              ${fifteen.criticalAnalysis.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          <div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); padding: 1rem; border-radius: 8px;">
            <strong style="color: #F87171; display:block; margin-bottom: 0.5rem;">Identified Limitations:</strong>
            <ul style="font-size: 0.85rem; color: var(--text-muted); padding-left: 1.2rem;">
              ${fifteen.criticalAnalysis.limitations.map(l => `<li>${l}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  } else if (tier === 'chapters') {
    const chapters = summary.fifteenMinuteSummary?.chapterOrThematicArcs || [];
    displayBox.innerHTML = `
      <div class="summary-tier-content">
        <h4 style="color: var(--gold-light); margin-bottom: 1rem;">Chapter-by-Chapter Analytical Breakdown</h4>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${chapters.map((c, i) => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 1.25rem; border-radius: 8px;">
              <span class="badge" style="margin-bottom: 0.5rem;">Chapter Track ${i + 1}</span>
              <h5 style="color: #FFF; font-size: 1.05rem; margin-bottom: 0.4rem;">${c.section}</h5>
              <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">${c.summary}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// ==============================================================================
// 8. AI DEEP RESEARCH PIPELINE (Dossier & Academic Citations)
// ==============================================================================
async function fetchStudioResearchDossier(book) {
  const container = document.getElementById('studio-dossier-box');
  if (container) {
    container.innerHTML = `
      <div class="text-center" style="padding: 2.5rem;">
        <div class="pulsing-dot" style="margin: 0 auto 1rem auto;"></div>
        <p>Executing 10-stage academic research protocol for "${book.title}"...</p>
      </div>
    `;
  }

  try {
    const res = await fetch('/api/ai/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: book.title,
        author: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
        isbn: book.isbn
      })
    });

    const data = await res.json();
    book.researchData = data.dossier;
    renderDossierHTML(container, data.dossier);
  } catch (err) {
    if (container) container.innerHTML = `<p class="text-muted">Failed to generate dossier: ${err.message}</p>`;
  }
}

async function executeDeepResearch() {
  const titleInput = document.getElementById('research-book-title');
  const authorInput = document.getElementById('research-book-author');
  const providerSelect = document.getElementById('research-provider-select');
  const outContainer = document.getElementById('research-output-container');
  const placeholder = document.getElementById('research-placeholder');
  const sheet = document.getElementById('dossier-sheet');

  const title = titleInput?.value?.trim();
  if (!title) {
    alert('Please enter a book title to initiate research.');
    return;
  }

  if (placeholder) placeholder.style.display = 'none';
  if (sheet) {
    sheet.style.display = 'block';
    sheet.innerHTML = `
      <div class="text-center" style="padding: 4rem;">
        <div class="pulsing-dot" style="margin: 0 auto 1.5rem auto;"></div>
        <h3>Executing Academic Research Protocol</h3>
        <p class="text-muted">Querying peer-reviewed indices, verifying empirical claims, and synthesizing dossier...</p>
      </div>
    `;
  }

  try {
    const res = await fetch('/api/ai/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: title,
        author: authorInput?.value?.trim() || '',
        provider: providerSelect?.value || 'gemini'
      })
    });

    const data = await res.json();
    renderDossierHTML(sheet, data.dossier);
  } catch (err) {
    if (sheet) sheet.innerHTML = `<p class="text-muted">Research execution error: ${err.message}</p>`;
  }
}

function renderDossierHTML(container, dossier) {
  if (!container || !dossier) return;

  container.innerHTML = `
    <div class="dossier-header">
      <div>
        <span class="gold-badge">PEER-REVIEWED PUBLICATION DOSSIER</span>
        <h3 class="dossier-title">${escapeHTML(dossier.book.title)}</h3>
        <p class="dossier-meta">Author: ${escapeHTML(dossier.book.author)} • ${escapeHTML(dossier.book.publicationYear)}</p>
      </div>
      <div class="confidence-badge">
        Rigor Score: ${dossier.confidenceScore}%
      </div>
    </div>

    <div class="dossier-section">
      <h4><span style="color:var(--gold-primary);">✦</span> Intellectual Context & Lineage</h4>
      <p style="color: var(--text-muted); line-height: 1.7;">${escapeHTML(dossier.book.intellectualContext)}</p>
    </div>

    <div class="dossier-section">
      <h4><span style="color:var(--gold-primary);">✦</span> Central Thesis</h4>
      <div class="thesis-callout">
        ${escapeHTML(dossier.centralThesis)}
      </div>
    </div>

    <div class="dossier-section">
      <h4><span style="color:var(--gold-primary);">✦</span> Verified Facts & Empirical Foundations</h4>
      <div class="claims-grid">
        ${(dossier.verifiedFacts || []).map(f => `
          <div class="claim-card">
            <div class="claim-header">${escapeHTML(f.claim)}</div>
            <div class="claim-evidence">Evidence: ${escapeHTML(f.evidence)}</div>
            <div class="claim-source">Source Index: ${escapeHTML(f.source)}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="dossier-section">
      <h4><span style="color:var(--gold-primary);">✦</span> Author's Original Arguments</h4>
      <div class="claims-grid">
        ${(dossier.authorOriginalArguments || []).map(a => `
          <div class="claim-card" style="border-left: 3px solid var(--gold-primary);">
            <div class="claim-header">${escapeHTML(a.argument)}</div>
            <div class="claim-evidence">${escapeHTML(a.rationale)}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="dossier-section">
      <h4><span style="color:var(--gold-primary);">✦</span> Academic Consensus & Open Debates</h4>
      <div class="thesis-callout" style="margin-bottom: 1rem; border-left-color: var(--blue-electric);">
        <strong>Consensus:</strong> ${escapeHTML(dossier.academicConsensusVsDebate?.consensus || 'Broad multidisciplinary agreement.')}
      </div>
      <ul style="padding-left: 1.25rem; color: var(--text-muted); font-size: 0.9rem;">
        ${(dossier.academicConsensusVsDebate?.openDebates || []).map(d => `<li style="margin-bottom: 0.4rem;">${escapeHTML(d)}</li>`).join('')}
      </ul>
    </div>

    <div class="dossier-section">
      <h4><span style="color:var(--gold-primary);">✦</span> Bibliographic & Archival Citations</h4>
      <div>
        ${(dossier.academicCitations || []).map(c => `
          <div class="citation-item">
            <span class="badge" style="margin-right: 0.5rem;">${escapeHTML(c.type)}</span>
            <strong>${escapeHTML(c.citation)}</strong>
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">Relevance: ${escapeHTML(c.relevance)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==============================================================================
// 9. CONTEXTUAL AI BOOK ASSISTANT (CHAT COMPANION)
// ==============================================================================
function updateAssistantActiveBook(book) {
  const coverEl = document.getElementById('assistant-book-cover');
  const titleEl = document.getElementById('assistant-book-title');
  const authorEl = document.getElementById('assistant-book-author');
  const isbnEl = document.getElementById('assistant-book-isbn');
  const descEl = document.getElementById('assistant-book-desc');

  if (coverEl && book.coverImage) coverEl.src = book.coverImage;
  if (titleEl) titleEl.innerText = book.title;
  if (authorEl) authorEl.innerText = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;
  if (isbnEl) isbnEl.innerText = `ISBN: ${book.isbn || 'Canonical Edition'}`;
  if (descEl) descEl.innerText = `Currently Calibrated: "${book.title}" — Answers will cite specific arguments and themes.`;
}

async function handleChatSubmit(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('chat-user-input');
  const message = input?.value?.trim();
  if (!message) return;

  input.value = '';
  await sendChatMessage(message);
}

function sendSuggestedChat(promptText) {
  sendChatMessage(promptText);
}

async function sendChatMessage(query) {
  const stream = document.getElementById('chat-messages-stream');
  if (!stream) return;

  // Append user bubble
  appendChatBubble('user', query);

  // Append temporary thinking indicator
  const thinkingId = `thinking_${Date.now()}`;
  appendChatBubble('assistant', 'Synthesizing literary context...', thinkingId);

  const modelSelect = document.getElementById('chat-model-select');
  const currentBook = BookVerseState.currentBook || { title: 'General Literature', authors: ['Canon'] };

  try {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: currentBook.title,
        author: Array.isArray(currentBook.authors) ? currentBook.authors.join(', ') : currentBook.authors,
        bookContext: currentBook.description || currentBook.summaryData || {},
        userQuery: query,
        model: modelSelect?.value || 'gemini-2.5-flash'
      })
    });

    const data = await res.json();
    const thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) thinkingEl.remove();

    appendChatBubble('assistant', data.reply);
  } catch (err) {
    const thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) thinkingEl.remove();
    appendChatBubble('assistant', `Encountered communication error: ${err.message}`);
  }
}

function appendChatBubble(role, text, tempId = null) {
  const stream = document.getElementById('chat-messages-stream');
  if (!stream) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-message msg-${role}`;
  if (tempId) bubble.id = tempId;

  bubble.innerHTML = `
    <div class="msg-bubble">${escapeHTML(text).replace(/\n/g, '<br>')}</div>
    <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  `;

  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;
}

function clearChatHistory() {
  const stream = document.getElementById('chat-messages-stream');
  if (stream) {
    stream.innerHTML = `
      <div class="chat-message msg-assistant">
        <div class="msg-bubble">Chat history cleared. Active context is preserved. How can I assist your reading inquiry?</div>
        <span class="msg-time">Just now</span>
      </div>
    `;
  }
}

// Inline Studio Chat
async function handleStudioChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('studio-chat-input');
  const msg = input?.value?.trim();
  if (!msg) return;

  input.value = '';
  const stream = document.getElementById('studio-chat-stream');
  if (!stream) return;

  stream.innerHTML += `
    <div class="chat-message msg-user">
      <div class="msg-bubble">${escapeHTML(msg)}</div>
    </div>
  `;

  try {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: BookVerseState.currentBook.title,
        author: BookVerseState.currentBook.authors,
        userQuery: msg
      })
    });
    const data = await res.json();
    stream.innerHTML += `
      <div class="chat-message msg-assistant">
        <div class="msg-bubble">${escapeHTML(data.reply).replace(/\n/g, '<br>')}</div>
      </div>
    `;
    stream.scrollTop = stream.scrollHeight;
  } catch (err) {
    stream.innerHTML += `<div class="chat-message msg-assistant"><div class="msg-bubble">Error: ${err.message}</div></div>`;
  }
}

// ==============================================================================
// 10. NEURAL AUDIOBOOK PLAYER & WEB SPEECH SYNTHESIS
// ==============================================================================
function setupAudioPlayer() {
  const seek = document.getElementById('audio-seek-slider');
  if (seek) {
    seek.addEventListener('input', (e) => {
      BookVerseState.audioPlayer.currentTime = (e.target.value / 100) * BookVerseState.audioPlayer.duration;
      updateAudioTimeDisplay();
    });
  }

  const backBtn = document.getElementById('audio-skip-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      BookVerseState.audioPlayer.currentTime = Math.max(0, BookVerseState.audioPlayer.currentTime - 15);
      updateAudioTimeDisplay();
    });
  }

  const fwdBtn = document.getElementById('audio-skip-fwd-btn');
  if (fwdBtn) {
    fwdBtn.addEventListener('click', () => {
      BookVerseState.audioPlayer.currentTime = Math.min(BookVerseState.audioPlayer.duration, BookVerseState.audioPlayer.currentTime + 15);
      updateAudioTimeDisplay();
    });
  }
}

function updateAudiobookPlayerMetadata(book) {
  const titleEl = document.getElementById('audio-book-title');
  const chapEl = document.getElementById('audio-book-chapter');
  if (titleEl) titleEl.innerText = `${book.title}: Essential Synthesis`;
  if (chapEl) chapEl.innerText = `Narrated by BookVerse Neural Voice • Track 1`;
}

function toggleAudioPlayback() {
  const player = BookVerseState.audioPlayer;
  const playBtnIcon = document.getElementById('audio-play-icon');

  if (player.isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function playAudio() {
  const player = BookVerseState.audioPlayer;
  player.isPlaying = true;

  const playBtnIcon = document.getElementById('audio-play-icon');
  if (playBtnIcon) {
    playBtnIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
  }

  // Use Web Speech API if supported for authentic audio synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const narrationText = BookVerseState.currentBook?.summaryData?.quickOverview ||
      BookVerseState.currentBook?.description ||
      `Now narrating ${BookVerseState.currentBook?.title}. A seminal work examining the cognitive and structural foundations of knowledge.`;

    player.utterance = new SpeechSynthesisUtterance(narrationText);
    player.utterance.rate = player.speechRate;
    player.utterance.pitch = 0.95;
    player.utterance.onend = () => pauseAudio();
    window.speechSynthesis.speak(player.utterance);
  }

  // Progress ticker
  clearInterval(player.timerInterval);
  player.timerInterval = setInterval(() => {
    player.currentTime += 1;
    if (player.currentTime >= player.duration) {
      pauseAudio();
    }
    updateAudioTimeDisplay();
  }, 1000);
}

function pauseAudio() {
  const player = BookVerseState.audioPlayer;
  player.isPlaying = false;
  if ('speechSynthesis' in window) window.speechSynthesis.pause();
  clearInterval(player.timerInterval);

  const playBtnIcon = document.getElementById('audio-play-icon');
  if (playBtnIcon) {
    playBtnIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
  }
}

function updateAudioTimeDisplay() {
  const player = BookVerseState.audioPlayer;
  const currEl = document.getElementById('audio-current-time');
  const durEl = document.getElementById('audio-duration');
  const slider = document.getElementById('audio-seek-slider');

  if (currEl) currEl.innerText = formatTime(player.currentTime);
  if (durEl) durEl.innerText = formatTime(player.duration);
  if (slider) slider.value = (player.currentTime / player.duration) * 100;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function changeAudioSpeed(val) {
  BookVerseState.audioPlayer.speechRate = parseFloat(val) || 1.0;
  if (BookVerseState.audioPlayer.utterance) {
    BookVerseState.audioPlayer.utterance.rate = BookVerseState.audioPlayer.speechRate;
  }
}

function setSleepTimer(minutes) {
  clearTimeout(BookVerseState.audioPlayer.sleepTimerId);
  if (minutes === 'off') return;

  const ms = parseInt(minutes, 10) * 60 * 1000;
  BookVerseState.audioPlayer.sleepTimerId = setTimeout(() => {
    pauseAudio();
    alert('Audiobook sleep timer reached. Pausing narration.');
  }, ms);
}

// ==============================================================================
// 11. MULTI-BOOK COMPARISON MATRIX
// ==============================================================================
function quickAddCompare(bookId) {
  const book = findBookById(bookId);
  if (!book) return;

  if (!BookVerseState.compareQueue.some(b => b.id === book.id)) {
    if (BookVerseState.compareQueue.length >= 2) BookVerseState.compareQueue.shift();
    BookVerseState.compareQueue.push(book);
    localStorage.setItem('bv_compare_queue', JSON.stringify(BookVerseState.compareQueue));
    updateCompareQueueUI();
  }

  navigateTo('compare');
}

function addCurrentBookToCompare() {
  if (BookVerseState.currentBook) quickAddCompare(BookVerseState.currentBook.id);
}

function updateCompareQueueUI() {
  const countEl = document.getElementById('compare-queue-count');
  if (countEl) countEl.innerText = BookVerseState.compareQueue.length;
}

function renderComparisonSlots() {
  const queue = BookVerseState.compareQueue;
  const slot1 = document.getElementById('slot-1-content');
  const slot2 = document.getElementById('slot-2-content');

  if (slot1) {
    if (queue[0]) {
      slot1.innerHTML = `
        <div style="display:flex; align-items:center; gap:1rem;">
          <img src="${queue[0].coverImage}" style="width:50px; height:70px; object-fit:cover; border-radius:4px;">
          <div>
            <h4 style="color:#FFF; font-size:1rem;">${escapeHTML(queue[0].title)}</h4>
            <p style="font-size:0.8rem; color:var(--text-muted);">${escapeHTML(queue[0].authors?.join(', ') || queue[0].authors)}</p>
          </div>
        </div>
      `;
    } else {
      slot1.innerHTML = `<p class="slot-empty-text">Select Book 1 from library or catalog</p>`;
    }
  }

  if (slot2) {
    if (queue[1]) {
      slot2.innerHTML = `
        <div style="display:flex; align-items:center; gap:1rem;">
          <img src="${queue[1].coverImage}" style="width:50px; height:70px; object-fit:cover; border-radius:4px;">
          <div>
            <h4 style="color:#FFF; font-size:1rem;">${escapeHTML(queue[1].title)}</h4>
            <p style="font-size:0.8rem; color:var(--text-muted);">${escapeHTML(queue[1].authors?.join(', ') || queue[1].authors)}</p>
          </div>
        </div>
      `;
    } else {
      slot2.innerHTML = `<p class="slot-empty-text">Select Book 2 from library or catalog</p>`;
    }
  }
}

function clearComparison() {
  BookVerseState.compareQueue = [];
  localStorage.setItem('bv_compare_queue', JSON.stringify([]));
  updateCompareQueueUI();
  renderComparisonSlots();
  const resContainer = document.getElementById('compare-results-container');
  if (resContainer) resContainer.style.display = 'none';
}

async function executeComparison() {
  const queue = BookVerseState.compareQueue;
  if (queue.length < 2) {
    alert('Please add at least two books to the comparison tray to perform comparative analysis.');
    return;
  }

  const resContainer = document.getElementById('compare-results-container');
  if (!resContainer) return;

  resContainer.style.display = 'block';
  resContainer.innerHTML = `
    <div class="text-center" style="padding: 3rem;">
      <div class="pulsing-dot" style="margin: 0 auto 1rem auto;"></div>
      <h3>Comparing Intellectual Paradigms...</h3>
      <p class="text-muted">Analyzing "${queue[0].title}" vs "${queue[1].title}"</p>
    </div>
  `;

  try {
    const res = await fetch('/api/books/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ books: queue })
    });

    const data = await res.json();
    const c = data.comparison;

    resContainer.innerHTML = `
      <div style="margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border-gold); border-radius: 16px; padding: 2rem;">
        <h3 class="gold-gradient" style="font-size: 1.8rem; margin-bottom: 0.5rem;">${escapeHTML(c.comparisonTitle)}</h3>
        <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.7; margin-bottom: 2rem;">${escapeHTML(c.executiveSummary)}</p>

        <h4 style="color: var(--gold-light); margin-bottom: 1rem;">Dimensional Thematic Matrix</h4>
        <div style="display:flex; flex-direction:column; gap:1.25rem; margin-bottom: 2rem;">
          ${(c.thematicMatrix || []).map(row => `
            <div style="background: rgba(3,7,18,0.7); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.25rem;">
              <h5 style="color: var(--blue-electric); font-size: 1rem; margin-bottom: 0.6rem;">${escapeHTML(row.dimension)}</h5>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div><strong style="color: #FFF;">${queue[0].title}:</strong> <span style="color:var(--text-muted); font-size: 0.9rem;">${escapeHTML(row.bookAAnalysis)}</span></div>
                <div><strong style="color: #FFF;">${queue[1].title}:</strong> <span style="color:var(--text-muted); font-size: 0.9rem;">${escapeHTML(row.bookBAnalysis)}</span></div>
              </div>
              <div style="font-size: 0.85rem; color: var(--gold-champagne); background: rgba(212,175,55,0.08); padding: 0.5rem 0.75rem; border-radius: 4px;">
                <strong>Epistemic Synthesis:</strong> ${escapeHTML(row.verdictOrSynthesis)}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.5rem;">
          <h4 style="color: var(--gold-light); margin-bottom: 0.5rem;">Recommendation & Reading Order Guide</h4>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem;"><strong>Choose ${queue[0].title} if:</strong> ${escapeHTML(c.recommendationGuide?.chooseBookAIf)}</p>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem;"><strong>Choose ${queue[1].title} if:</strong> ${escapeHTML(c.recommendationGuide?.chooseBookBIf)}</p>
          <p style="color: var(--gold-primary); font-size: 0.95rem;"><strong>Optimal Sequence:</strong> ${escapeHTML(c.recommendationGuide?.bestReadOrder)}</p>
        </div>
      </div>
    `;
  } catch (err) {
    resContainer.innerHTML = `<p class="text-muted">Comparison analysis error: ${err.message}</p>`;
  }
}

// ==============================================================================
// 12. MY PERSONAL LIBRARY
// ==============================================================================
function renderLibraryGrid() {
  const grid = document.getElementById('library-books-grid');
  const empty = document.getElementById('library-empty-state');
  const saved = BookVerseState.library.saved;

  if (!grid) return;

  if (saved.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    grid.innerHTML = saved.map(createBookCardHTML).join('');
  }
}

// ==============================================================================
// 13. SETTINGS & SERVER HEALTH TELEMETRY
// ==============================================================================
async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const statusPill = document.getElementById('system-status-indicator');
    if (statusPill) {
      statusPill.innerHTML = `
        <span class="pulsing-dot"></span>
        <span class="status-label">${data.providers.gemini ? 'Gemini Live' : 'AI Engine Ready'}</span>
      `;
    }
  } catch (e) {
    console.warn('Backend offline or initializing:', e);
  }
}

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.classList.add('active');

  // Load telemetry
  fetch('/api/health')
    .then(r => r.json())
    .then(data => {
      const log = document.getElementById('telemetry-log');
      if (log) log.innerText = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      const log = document.getElementById('telemetry-log');
      if (log) log.innerText = `Server unreachable: ${err.message}`;
    });
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.classList.remove('active');
}

function saveUserSettings() {
  const geminiInput = document.getElementById('user-gemini-key');
  const openaiInput = document.getElementById('user-openai-key');
  const graphicsSelect = document.getElementById('user-graphics-mode');

  BookVerseState.userSettings.geminiKey = geminiInput?.value || '';
  BookVerseState.userSettings.openaiKey = openaiInput?.value || '';
  BookVerseState.userSettings.graphicsMode = graphicsSelect?.value || 'high';

  localStorage.setItem('bv_settings', JSON.stringify(BookVerseState.userSettings));
  closeSettingsModal();
  alert('BookVerse settings saved successfully.');
}
