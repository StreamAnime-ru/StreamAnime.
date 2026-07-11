/**
 * AniStream Core Application Engine
 * Optimized Architecture using Native JavaScript APIs & amvstrm Data Mapping
 */

// Base endpoint configuration matching standard production specification APIs
const API_BASE_URL = 'https://api.amvstrm.me/api/v2';

// Dynamic Memory Store Engine (Single Source of Truth)
const state = {
    currentUser: JSON.parse(localStorage.getItem('ani_user')) || null,
    currentView: 'home',
    activeAnimeData: null,
    activeEpisodeIndex: 0,
    watchlist: JSON.parse(localStorage.getItem('ani_watchlist')) || [],
    favorites: JSON.parse(localStorage.getItem('ani_favorites')) || [],
    history: JSON.parse(localStorage.getItem('ani_history')) || [],
    authMode: 'login' // login || signup
};

// Global DOM Selectors Context Registry
const DOM = {
    views: document.querySelectorAll('.view'),
    trendingGrid: document.getElementById('trending-grid'),
    latestGrid: document.getElementById('latest-grid'),
    popularGrid: document.getElementById('popular-grid'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    autocompleteResults: document.getElementById('autocomplete-results'),
    heroBanner: document.getElementById('hero-banner'),
    heroTitle: document.getElementById('hero-title'),
    heroDesc: document.getElementById('hero-desc'),
    heroPlayBtn: document.getElementById('hero-play-btn'),
    heroDetailsBtn: document.getElementById('hero-details-btn'),
    logo: document.getElementById('nav-logo'),
    
    // View Blocks
    homeView: document.getElementById('home-view'),
    detailsView: document.getElementById('details-view'),
    playerView: document.getElementById('player-view'),
    watchlistView: document.getElementById('watchlist-view'),
    
    // Details Specific Selectors
    detailsBanner: document.getElementById('details-banner'),
    detailsCover: document.getElementById('details-cover'),
    detailsTitle: document.getElementById('details-title'),
    detailsStudio: document.getElementById('details-studio'),
    detailsRating: document.getElementById('details-rating-value'),
    detailsDesc: document.getElementById('details-desc'),
    detailsGenres: document.getElementById('details-genres'),
    episodeList: document.getElementById('episode-list'),
    detailsStartWatch: document.getElementById('details-start-watch'),
    detailsFavBtn: document.getElementById('details-fav-btn'),
    userStars: document.getElementById('user-stars'),
    commentForm: document.getElementById('comment-form'),
    commentInput: document.getElementById('comment-input'),
    commentsContainer: document.getElementById('comments-container'),

    // Player Components
    mainVideo: document.getElementById('main-video'),
    skipIntroBtn: document.getElementById('skip-intro-btn'),
    playerAnimeTitle: document.getElementById('player-anime-title'),
    playerEpTitle: document.getElementById('player-episode-title'),
    prevEpBtn: document.getElementById('prev-ep-btn'),
    nextEpBtn: document.getElementById('next-ep-btn'),
    playerSidebar: document.getElementById('player-episodes-sidebar'),

    // Authentication Elements
    authBtn: document.getElementById('auth-btn'),
    userMenu: document.getElementById('user-menu'),
    usernameDisplay: document.getElementById('username-display'),
    logoutBtn: document.getElementById('logout-btn'),
    authModal: document.getElementById('auth-modal'),
    closeModal: document.querySelector('.close-modal'),
    authForm: document.getElementById('auth-form'),
    modalTitle: document.getElementById('modal-title'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    toggleAuthMode: document.getElementById('toggle-auth-mode'),
    watchlistToggleBtn: document.getElementById('watchlist-toggle-btn'),
    
    // Filtering Elements
    filterGenre: document.getElementById('filter-genre'),
    filterYear: document.getElementById('filter-year'),
    filterSeason: document.getElementById('filter-season'),
    filterStatus: document.getElementById('filter-status'),
    applyFiltersBtn: document.getElementById('apply-filters-btn'),
    
    // Dashboard Components
    dashTabs: document.querySelectorAll('.dash-tab'),
    dashPanels: document.querySelectorAll('.dash-panel')
};

/* ==========================================
 * INITIALIZATION & ENGINE EVENTS ROUTER
 * ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    updateAuthUI();
    fetchShelfData('/trending', DOM.trendingGrid);
    fetchShelfData('/recent', DOM.latestGrid);
    fetchShelfData('/popular', DOM.popularGrid);
    setupHeroBanner();
}

function setupEventListeners() {
    // Structural Navigation Engine Bindings
    DOM.logo.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
    DOM.watchlistToggleBtn.addEventListener('click', () => { renderDashboard(); switchView('watchlist'); });
    
    // Dynamic Application Context Search Engine Routing
    DOM.searchInput.addEventListener('input', debounce(handleSearchAutocomplete, 300));
    DOM.searchBtn.addEventListener('click', executeSearch);
    
    // Filter System Trigger
    DOM.applyFiltersBtn.addEventListener('click', executeAdvancedDiscovery);

    // Contextual Modals Closures & Forms
    DOM.authBtn.addEventListener('click', () => openAuthModal('login'));
    DOM.closeModal.addEventListener('click', () => DOM.authModal.classList.add('hidden'));
    DOM.toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal(state.authMode === 'login' ? 'signup' : 'login');
    });
    DOM.authForm.addEventListener('submit', handleAuthSubmit);
    DOM.logoutBtn.addEventListener('click', handleLogout);

    // Video Playback Interactive Logic Bindings
    DOM.mainVideo.addEventListener('timeupdate', checkVideoTimeProgress);
    DOM.skipIntroBtn.addEventListener('click', skipIntroSegment);
    DOM.prevEpBtn.addEventListener('click', () => playEpisodeAdjacent(-1));
    DOM.nextEpBtn.addEventListener('click', () => playEpisodeAdjacent(1));
    
    // Profile Management System Tab Interactivity
    DOM.dashTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            DOM.dashTabs.forEach(t => t.classList.remove('active'));
            DOM.dashPanels.forEach(p => p.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.remove('hidden');
        });
    });

    // Social Data Engine Dynamic Interactivity
    DOM.commentForm.addEventListener('submit', handleCommentSubmission);
    setupStarRatingSystem();
}

/* ==========================================
 * CORE SPA VIEW MANAGEMENT PIPELINE
 * ========================================== */
function switchView(viewName) {
    state.currentView = viewName;
    DOM.views.forEach(view => {
        if (view.id === `${viewName}-view`) {
            view.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            view.classList.add('hidden');
        }
    });
    // Suspend playback thread loop if leaving active view space context
    if (viewName !== 'player') {
        DOM.mainVideo.pause();
    }
}

/* ==========================================
 * DATA CONSUMPTION / REST API ENGINE (AMVSTRM)
 * ========================================== */
async function fetchShelfData(endpoint, gridContainer) {
    try {
        gridContainer.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Loading entries...</div>';
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();
        
        // Dynamic Normalization Map to parse payload response formats properly
        const results = data.results || data.data || [];
        gridContainer.innerHTML = '';
        
        if(results.length === 0) {
            gridContainer.innerHTML = '<p class="no-data">No anime entries match your search request.</p>';
            return;
        }

        results.slice(0, 10).forEach(anime => {
            const card = createAnimeCard(anime);
            gridContainer.appendChild(card);
        });
    } catch (error) {
        console.error(`Data request pipeline failure for endpoint ${endpoint}:`, error);
        gridContainer.innerHTML = '<p class="error-msg">Failed to securely query anime streaming records.</p>';
    }
}

async function setupHeroBanner() {
    try {
        const response = await fetch(`${API_BASE_URL}/trending`);
        const data = await response.json();
        const results = data.results || data.data || [];
        if (results.length > 0) {
            const featured = results[0];
            DOM.heroBanner.style.backgroundImage = `url('${featured.bannerImage || featured.coverImage || ''}')`;
            DOM.heroTitle.textContent = featured.title.english || featured.title.romaji || "Featured Show";
            DOM.heroDesc.textContent = featured.description || "No localized synopsis text is available.";
            
            // Re-bind actions context targets dynamically
            DOM.heroPlayBtn.onclick = () => loadAnimeDetails(featured.id, true);
            DOM.heroDetailsBtn.onclick = () => loadAnimeDetails(featured.id, false);
        }
    } catch (err) {
        console.error("Hero display setup failure initialization", err);
    }
}

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    const titleText = anime.title?.english || anime.title?.romaji || anime.title || "Unknown Anime Title";
    const imageSource = anime.coverImage || anime.image || '';
    const scoreText = anime.score || anime.averageScore ? ((anime.score || anime.averageScore) / 10).toFixed(1) : 'N/A';
    
    card.innerHTML = `
        <div class="card-img-wrap">
            <img src="${imageSource}" alt="${titleText}" loading="lazy">
            <span class="card-score"><i class="fa-solid fa-star"></i> ${scoreText}</span>
        </div>
        <div class="card-info">
            <h4>${titleText}</h4>
            <p>${anime.season || 'N/A'} | ${anime.format || 'TV'}</p>
        </div>
    `;
    card.addEventListener('click', () => loadAnimeDetails(anime.id));
    return card;
}

/* ==========================================
 * FILTER & ADVANCED SEARCH OPERATIONS
 * ========================================== */
async function handleSearchAutocomplete() {
    const query = DOM.searchInput.value.trim();
    if (query.length < 3) {
        DOM.autocompleteResults.classList.add('hidden');
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const items = data.results || data.data || [];
        
        DOM.autocompleteResults.innerHTML = '';
        if(items.length > 0) {
            DOM.autocompleteResults.classList.remove('hidden');
            items.slice(0, 5).forEach(item => {
                const node = document.createElement('div');
                node.className = 'autocomplete-item';
                node.innerHTML = `
                    <img src="${item.coverImage || item.image}" alt="">
                    <span>${item.title.english || item.title.romaji}</span>
                `;
                node.addEventListener('click', () => {
                    DOM.autocompleteResults.classList.add('hidden');
                    DOM.searchInput.value = '';
                    loadAnimeDetails(item.id);
                });
                DOM.autocompleteResults.appendChild(node);
            });
        }
    } catch (e) { console.error(e); }
}

function executeSearch() {
    const query = DOM.searchInput.value.trim();
    if(query) {
        DOM.autocompleteResults.classList.add('hidden');
        switchView('home');
        fetchShelfData(`/search?q=${encodeURIComponent(query)}`, DOM.trendingGrid);
        DOM.latestGrid.parentElement.classList.add('hidden');
        DOM.popularGrid.parentElement.classList.add('hidden');
    }
}

function executeAdvancedDiscovery() {
    const genre = DOM.filterGenre.value;
    const year = DOM.filterYear.value;
    const season = DOM.filterSeason.value;
    const status = DOM.filterStatus.value;
    
    let queryParams = [];
    if (genre) queryParams.push(`genre=${genre}`);
    if (year) queryParams.push(`year=${year}`);
    if (season) queryParams.push(`season=${season}`);
    if (status) queryParams.push(`status=${status}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    switchView('home');
    fetchShelfData(`/advanced${queryString}`, DOM.trendingGrid);
}

/* ==========================================
 * DETAIL VIEW PIPELINE DATA ORCHESTRATION
 * ========================================== */
async function loadAnimeDetails(animeId, instantPlayback = false) {
    try {
        switchView('home'); // Structural UX Reset
        const res = await fetch(`${API_BASE_URL}/info/${animeId}`);
        const parsed = await res.json();
        const anime = parsed.data || parsed;
        
        state.activeAnimeData = anime;
        
        if (instantPlayback) {
            initiateVideoPlayback(0);
            return;
        }

        // DOM Mapping UI Construction
        DOM.detailsBanner.style.backgroundImage = `url('${anime.bannerImage || anime.coverImage || ''}')`;
        DOM.detailsCover.src = anime.coverImage || anime.image || '';
        DOM.detailsTitle.textContent = anime.title.english || anime.title.romaji;
        DOM.detailsStudio.textContent = `Studio: ${anime.studios?.join(', ') || 'Unknown Production'}`;
        DOM.detailsRating.innerHTML = `<i class="fa-solid fa-star text-accent"></i> ${anime.score ? (anime.score/10).toFixed(1) : '8.0'}`;
        DOM.detailsDesc.textContent = anime.description || 'No summary textual asset has been cataloged.';
        
        DOM.detailsGenres.innerHTML = '';
        if(anime.genres) {
            anime.genres.forEach(g => {
                const badge = document.createElement('span');
                badge.textContent = g;
                DOM.detailsGenres.appendChild(badge);
            });
        }

        // Render Episodes Layout System
        DOM.episodeList.innerHTML = '';
        const epCount = anime.episodes || anime.totalEpisodes || 12;
        for(let i = 1; i <= epCount; i++) {
            const epBtn = document.createElement('button');
            epBtn.className = 'ep-btn';
            epBtn.textContent = `Ep ${i}`;
            epBtn.addEventListener('click', () => initiateVideoPlayback(i - 1));
            DOM.episodeList.appendChild(epBtn);
        }

        // Setup Buttons Data Bindings
        DOM.detailsStartWatch.onclick = () => initiateVideoPlayback(0);
        setupWatchlistButtons(animeId);
        renderComments(animeId);
        loadUserStarInterface(animeId);

        switchView('details');
    } catch (err) {
        console.error("Critical rendering error localized inside Info Pipeline", err);
    }
}

/* ==========================================
 * VIDEO PLAYER CORE EXECUTION MECHANICS
 * ========================================== */
function initiateVideoPlayback(episodeIndex) {
    if (!state.activeAnimeData) return;
    state.activeEpisodeIndex = episodeIndex;
    
    const anime = state.activeAnimeData;
    DOM.playerAnimeTitle.textContent = anime.title.english || anime.title.romaji;
    DOM.playerEpTitle.textContent = `Episode ${episodeIndex + 1}`;
    
    // Check Local Storage for saved "Continue Watching" tracking timestamp state pointer
    const storageKey = `resume_${anime.id}_${episodeIndex}`;
    const savedTime = localStorage.getItem(storageKey);
    
    switchView('player');
    
    // Load native stream configurations cleanly
    DOM.mainVideo.load();
    if(savedTime) {
        DOM.mainVideo.currentTime = parseFloat(savedTime);
    }
    
    // Execute async context native promise play logic natively safely
    DOM.mainVideo.play().catch(e => console.log("Auto playback initialization deferral rule caught. Waiting user activation."));
    
    buildPlayerSidebar(anime);
    saveToHistory(anime.id, episodeIndex);
}

function buildPlayerSidebar(anime) {
    DOM.playerSidebar.innerHTML = '';
    const epCount = anime.episodes || anime.totalEpisodes || 12;
    for (let i = 0; i < epCount; i++) {
        const item = document.createElement('div');
        item.className = `sidebar-ep-item ${i === state.activeEpisodeIndex ? 'active' : ''}`;
        item.textContent = `Episode ${i + 1}`;
        item.addEventListener('click', () => initiateVideoPlayback(i));
        DOM.playerSidebar.appendChild(item);
    }
}

function checkVideoTimeProgress() {
    const video = DOM.mainVideo;
    // Show Intro skipping logic overlay array metrics natively (Simulated 10s -> 30s parameters)
    if(video.currentTime >= 10 && video.currentTime <= 30) {
        DOM.skipIntroBtn.classList.remove('hidden');
    } else {
        DOM.skipIntroBtn.classList.add('hidden');
    }
    
    // Auto sync state interval values with Local Storage Engine runtime contexts
    if (state.activeAnimeData && video.currentTime > 0) {
        const key = `resume_${state.activeAnimeData.id}_${state.activeEpisodeIndex}`;
        localStorage.setItem(key, video.currentTime);
    }
}

function skipIntroSegment() {
    DOM.mainVideo.currentTime = 30;
    DOM.skipIntroBtn.classList.add('hidden');
}

function playEpisodeAdjacent(direction) {
    const newIdx = state.activeEpisodeIndex + direction;
    const epCount = state.activeAnimeData.episodes || state.activeAnimeData.totalEpisodes || 12;
    if (newIdx >= 0 && newIdx < epCount) {
        initiateVideoPlayback(newIdx);
    }
}

/* ==========================================
 * STORAGE MATRIX SYSTEM & SOCIAL DATA STORAGE
 * ========================================== */
function setupWatchlistButtons(animeId) {
    const inWatchlist = state.watchlist.includes(animeId);
    DOM.detailsFavBtn.textContent = inWatchlist ? 'Remove Watchlist' : 'Add Watchlist';
    DOM.detailsFavBtn.onclick = () => {
        if(state.watchlist.includes(animeId)) {
            state.watchlist = state.watchlist.filter(id => id !== animeId);
        } else {
            state.watchlist.push(animeId);
        }
        localStorage.setItem('ani_watchlist', JSON.stringify(state.watchlist));
        setupWatchlistButtons(animeId);
    };
}

function saveToHistory(animeId, episodeIndex) {
    const historyItem = { animeId, episodeIndex, timestamp: Date.now(), title: state.activeAnimeData.title.english || state.activeAnimeData.title.romaji, image: state.activeAnimeData.coverImage || state.activeAnimeData.image };
    state.history = state.history.filter(h => h.animeId !== animeId);
    state.history.unshift(historyItem);
    localStorage.setItem('ani_history', JSON.stringify(state.history));
}

function renderDashboard() {
    const wlGrid = document.getElementById('dash-watchlist');
    const histGrid = document.getElementById('dash-history');
    
    wlGrid.innerHTML = '';
    histGrid.innerHTML = '';

    if(state.watchlist.length === 0) wlGrid.innerHTML = '<p class="p-3">Your Watchlist database index space layout is empty.</p>';
    if(state.history.length === 0) histGrid.innerHTML = '<p class="p-3">No viewing logs exist yet.</p>';

    // Rehydrate watchlist dynamically from API pointers safely loop iteration
    state.watchlist.forEach(async (id) => {
        const res = await fetch(`${API_BASE_URL}/info/${id}`);
        const d = await res.json();
        const card = createAnimeCard(d.data || d);
        wlGrid.appendChild(card);
    });

    state.history.forEach(item => {
        const node = document.createElement('div');
        node.className = 'anime-card';
        node.innerHTML = `
            <div class="card-img-wrap">
                <img src="${item.image}" alt="">
            </div>
            <div class="card-info">
                <h4>${item.title}</h4>
                <p>Resuming Ep ${item.episodeIndex + 1}</p>
            </div>
        `;
        node.addEventListener('click', () => loadAnimeDetails(item.animeId, true));
        histGrid.appendChild(node);
    });
}

function setupStarRatingSystem() {
    const stars = DOM.userStars.querySelectorAll('i');
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            if(!state.activeAnimeData) return;
            const val = parseInt(e.target.dataset.value);
            localStorage.setItem(`rating_${state.activeAnimeData.id}`, val);
            loadUserStarInterface(state.activeAnimeData.id);
        });
    });
}

function loadUserStarInterface(animeId) {
    const savedRating = localStorage.getItem(`rating_${animeId}`) || 0;
    const stars = DOM.userStars.querySelectorAll('i');
    stars.forEach(star => {
        const val = parseInt(star.dataset.value);
        if(val <= savedRating) {
            star.className = 'fa-star fa-solid text-accent';
        } else {
            star.className = 'fa-star fa-regular';
        }
    });
}

function renderComments(animeId) {
    DOM.commentsContainer.innerHTML = '';
    const comments = JSON.parse(localStorage.getItem(`comments_${animeId}`)) || [];
    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-node';
        div.innerHTML = `
            <div class="comment-node-meta"><span>${c.user}</span><span>${new Date(c.time).toLocaleDateString()}</span></div>
            <p>${c.text}</p>
        `;
        DOM.commentsContainer.appendChild(div);
    });
}

function handleCommentSubmission(e) {
    e.preventDefault();
    if (!state.activeAnimeData) return;
    const user = state.currentUser ? state.currentUser.username : "Guest Streamer";
    const text = DOM.commentInput.value.trim();
    if(!text) return;

    const animeId = state.activeAnimeData.id;
    const comments = JSON.parse(localStorage.getItem(`comments_${animeId}`)) || [];
    comments.unshift({ user, text, time: Date.now() });
    localStorage.setItem(`comments_${animeId}`, JSON.stringify(comments));
    
    DOM.commentInput.value = '';
    renderComments(animeId);
}

/* ==========================================
 * SECURITY & VIRTUAL AUTHENTICATION CONTROLS
 * ========================================== */
function openAuthModal(mode) {
    state.authMode = mode;
    DOM.modalTitle.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
    DOM.authSubmitBtn.textContent = mode === 'login' ? 'Login' : 'Sign Up';
    DOM.toggleAuthMode.textContent = mode === 'login' ? 'Sign Up Here' : 'Login Here';
    DOM.authModal.classList.remove('hidden');
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('auth-user').value.trim();
    // In strict Client-Side architectures, user storage objects emulate remote tables
    state.currentUser = { username };
    localStorage.setItem('ani_user', JSON.stringify(state.currentUser));
    updateAuthUI();
    DOM.authModal.classList.add('hidden');
    DOM.authForm.reset();
}

function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem('ani_user');
    updateAuthUI();
    switchView('home');
}

function updateAuthUI() {
    if(state.currentUser) {
        DOM.authBtn.classList.add('hidden');
        DOM.userMenu.classList.remove('hidden');
        DOM.usernameDisplay.textContent = state.currentUser.username;
    } else {
        DOM.authBtn.classList.remove('hidden');
        DOM.userMenu.classList.add('hidden');
    }
}

/* ==========================================
 * SYSTEM UTILITY FUNCTIONS (DEBOUNCE)
 * ========================================== */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
