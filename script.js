/**
 * AniStream Core Native Engineering Script
 * Single Page Application Processing Thread Architecture
 */

const CONFIG = {
    API_URL: 'https://api.amvstrm.me/api/v2',
    SampleStream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
};

const appState = {
    user: JSON.parse(localStorage.getItem('as_user')) || null,
    view: 'home',
    activeMedia: null,
    activeEpIndex: 0,
    watchlist: JSON.parse(localStorage.getItem('as_watchlist')) || [],
    history: JSON.parse(localStorage.getItem('as_history')) || [],
    authMode: 'login'
};

const DOM = {
    views: document.querySelectorAll('.app-view'),
    gridTrending: document.getElementById('grid-trending'),
    gridRecent: document.getElementById('grid-recent'),
    gridPopular: document.getElementById('grid-popular'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    autocomplete: document.getElementById('autocomplete-dropdown'),
    heroDisplay: document.getElementById('hero-display'),
    heroTitle: document.getElementById('hero-title'),
    heroSynopsis: document.getElementById('hero-synopsis'),
    heroPlay: document.getElementById('hero-btn-play'),
    heroInfo: document.getElementById('hero-btn-info'),
    logo: document.getElementById('nav-logo'),
    watchlistToggle: document.getElementById('nav-watchlist-btn'),
    authWrapper: document.getElementById('auth-ui-wrapper'),
    
    // Media View Fields
    detailsBackdrop: document.getElementById('details-backdrop-bg'),
    detailsPoster: document.getElementById('details-poster-img'),
    detailsTitle: document.getElementById('details-meta-title'),
    detailsStudio: document.getElementById('details-meta-studio'),
    detailsScore: document.getElementById('details-average-score'),
    detailsSynopsis: document.getElementById('details-synopsis-text'),
    detailsBadges: document.getElementById('details-genres-badges'),
    gridEpisodes: document.getElementById('grid-episodes-index'),
    btnPlayFirst: document.getElementById('btn-details-play-first'),
    btnWatchlistToggle: document.getElementById('btn-details-watchlist-toggle'),
    interactiveStars: document.getElementById('interactive-star-row'),
    discussionForm: document.getElementById('discussion-input-form'),
    discussionTextarea: document.getElementById('discussion-textarea'),
    discussionContainer: document.getElementById('discussion-comments-render-target'),

    // Cinematic Streaming Parameters
    videoElement: document.getElementById('native-html5-video'),
    btnSkipIntro: document.getElementById('btn-overlay-skip-intro'),
    playerTitleAnime: document.getElementById('player-title-anime'),
    playerTitleEp: document.getElementById('player-title-episode'),
    btnPlayerPrev: document.getElementById('btn-player-prev'),
    btnPlayerNext: document.getElementById('btn-player-next'),
    sidebarEpStack: document.getElementById('sidebar-episodes-stack'),

    // Authentication Engine System
    authOverlay: document.getElementById('modal-auth-overlay'),
    authForm: document.getElementById('modal-native-form'),
    authHeading: document.getElementById('auth-modal-heading-text'),
    authSubmitBtn: document.getElementById('form-submit-action-btn'),
    authModeToggle: document.getElementById('link-auth-mode-toggle'),
    authClose: document.querySelector('.auth-modal-close-trigger'),

    // Dashboard Hub Elements
    tabTriggers: document.querySelectorAll('.tab-trigger'),
    panelWatchlist: document.getElementById('panel-watchlist'),
    panelHistory: document.getElementById('panel-history'),

    // Filter Processing Parameters
    filterGenre: document.getElementById('filter-genre'),
    filterYear: document.getElementById('filter-year'),
    filterSeason: document.getElementById('filter-season'),
    btnExecuteFilters: document.getElementById('btn-execute-filters')
};

/* ==========================================
 * SUBSYSTEM ENGINE INITIALIZATION ROUTER
 * ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    initAppCore();
    registerEventHandlers();
});

function initAppCore() {
    synchronizeUserInterface();
    renderContentShelf('/trending', DOM.gridTrending);
    renderContentShelf('/recent', DOM.gridRecent);
    renderContentShelf('/popular', DOM.gridPopular);
    loadShowcaseBanner();
}

function registerEventHandlers() {
    DOM.logo.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    DOM.watchlistToggle.addEventListener('click', () => { populateWorkspaceDashboard(); navigateTo('watchlist'); });
    
    DOM.searchInput.addEventListener('input', debounce(processAutocompleteTask, 250));
    DOM.searchBtn.addEventListener('click', runSearchPipeline);
    DOM.btnExecuteFilters.addEventListener('click', runAdvancedDiscoveryFilter);

    DOM.authWrapper.addEventListener('click', (e) => {
        if(e.target.id === 'auth-modal-trigger') triggerAuthModalDisplay('login');
        if(e.target.id === 'auth-logout-action') executeProfileSignout();
    });
    DOM.authClose.addEventListener('click', () => DOM.authOverlay.classList.add('hidden'));
    DOM.authModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        triggerAuthModalDisplay(appState.authMode === 'login' ? 'signup' : 'login');
    });
    DOM.authForm.addEventListener('submit', captureProfileAuthorization);

    DOM.videoElement.addEventListener('timeupdate', trackVideoProgressRuntime);
    DOM.btnSkipIntro.addEventListener('click', () => { DOM.videoElement.currentTime = 30; });
    DOM.btnPlayerPrev.addEventListener('click', () => shiftPlaybackIndex(-1));
    DOM.btnPlayerNext.addEventListener('click', () => shiftPlaybackIndex(1));

    DOM.tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            DOM.tabTriggers.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.dashboard-panel-view').forEach(p => p.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.panelTarget).classList.remove('hidden');
        });
    });

    DOM.discussionForm.addEventListener('submit', processCommentSubmission);
    setupInteractiveRatingEngine();
}

/* ==========================================
 * SPA VIEWPORT CONTROL PIPELINE
 * ========================================== */
function navigateTo(viewId) {
    appState.view = viewId;
    DOM.views.forEach(v => {
        if (v.id === `view-${viewId}`) {
            v.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            v.classList.add('hidden');
        }
    });
    if (viewId !== 'player') DOM.videoElement.pause();
}

/* ==========================================
 * NETWORKING & API INTEGRATION DESYNC ENGINE
 * ========================================== */
async function renderContentShelf(endpoint, targetGrid) {
    try {
        targetGrid.innerHTML = '<div class="spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>';
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`);
        const parsed = await response.json();
        const nodes = parsed.results || parsed.data || [];
        targetGrid.innerHTML = '';

        if(nodes.length === 0) {
            targetGrid.innerHTML = '<p class="empty-notice">No catalog records discovered.</p>';
            return;
        }

        nodes.slice(0, 10).forEach(item => {
            targetGrid.appendChild(generateMediaCardNode(item));
        });
    } catch (err) {
        console.error(err);
        targetGrid.innerHTML = '<p class="error-notice">Network syncing transaction failure.</p>';
    }
}

async function loadShowcaseBanner() {
    try {
        const res = await fetch(`${CONFIG.API_URL}/trending`);
        const json = await res.json();
        const collection = json.results || json.data || [];
        if (collection.length > 0) {
            const primaryShow = collection[0];
            DOM.heroDisplay.style.backgroundImage = `url('${primaryShow.bannerImage || primaryShow.coverImage || ''}')`;
            DOM.heroTitle.textContent = primaryShow.title.english || primaryShow.title.romaji;
            DOM.heroSynopsis.textContent = primaryShow.description || "Synopsis summary text unavailable.";
            DOM.heroPlay.onclick = () => pullMediaProfile(primaryShow.id, true);
            DOM.heroInfo.onclick = () => pullMediaProfile(primaryShow.id, false);
        }
    } catch (err) { console.error(err); }
}

function generateMediaCardNode(data) {
    const node = document.createElement('div');
    node.className = 'media-card-node';
    const title = data.title?.english || data.title?.romaji || data.title || "Catalog Record";
    const img = data.coverImage || data.image || '';
    const score = data.score || data.averageScore ? ((data.score || data.averageScore) / 10).toFixed(1) : '7.8';
    
    node.innerHTML = `
        <div class="node-img-container">
            <img src="${img}" alt="${title}" loading="lazy">
            <span class="node-floating-badge"><i class="fa-solid fa-star"></i> ${score}</span>
        </div>
        <div class="node-metadata-padding">
            <h4>${title}</h4>
            <p>${data.season || 'Broadcast'} | ${data.format || 'TV Series'}</p>
        </div>
    `;
    node.addEventListener('click', () => pullMediaProfile(data.id));
    return node;
}

/* ==========================================
 * FILTER & RUNTIME SEARCH MATRIX PROCEDURES
 * ========================================== */
async function processAutocompleteTask() {
    const rawVal = DOM.searchInput.value.trim();
    if (rawVal.length < 3) {
        DOM.autocomplete.classList.add('hidden');
        return;
    }
    try {
        const res = await fetch(`${CONFIG.API_URL}/search?q=${encodeURIComponent(rawVal)}`);
        const parsed = await res.json();
        const records = parsed.results || parsed.data || [];
        DOM.autocomplete.innerHTML = '';
        
        if (records.length > 0) {
            DOM.autocomplete.classList.remove('hidden');
            records.slice(0, 5).forEach(rec => {
                const row = document.createElement('div');
                row.className = 'autocomplete-row-item';
                row.innerHTML = `
                    <img src="${rec.coverImage || rec.image}" alt="">
                    <span>${rec.title.english || rec.title.romaji}</span>
                `;
                row.addEventListener('click', () => {
                    DOM.autocomplete.classList.add('hidden');
                    DOM.searchInput.value = '';
                    pullMediaProfile(rec.id);
                });
                DOM.autocomplete.appendChild(row);
            });
        }
    } catch(e) { console.error(e); }
}

function runSearchPipeline() {
    const target = DOM.searchInput.value.trim();
    if (target) {
        DOM.autocomplete.classList.add('hidden');
        navigateTo('home');
        renderContentShelf(`/search?q=${encodeURIComponent(target)}`, DOM.gridTrending);
        DOM.gridRecent.parentElement.classList.add('hidden');
        DOM.gridPopular.parentElement.classList.add('hidden');
    }
}

function runAdvancedDiscoveryFilter() {
    let queries = [];
    if(DOM.filterGenre.value) queries.push(`genre=${DOM.filterGenre.value}`);
    if(DOM.filterYear.value) queries.push(`year=${DOM.filterYear.value}`);
    if(DOM.filterSeason.value) queries.push(`season=${DOM.filterSeason.value}`);
    
    const queryStr = queries.length > 0 ? `?${queries.join('&')}` : '';
    navigateTo('home');
    renderContentShelf(`/advanced${queryStr}`, DOM.gridTrending);
}

/* ==========================================
 * PROFILE METADATA RENDER ENGINE INFRASTRUCTURE
 * ========================================== */
async function pullMediaProfile(id, autoPlayFlag = false) {
    try {
        navigateTo('home');
        const res = await fetch(`${CONFIG.API_URL}/info/${id}`);
        const block = await res.json();
        const payload = block.data || block;
        
        appState.activeMedia = payload;
        if(autoPlayFlag) {
            executeCinemaPipeline(0);
            return;
        }

        DOM.detailsBackdrop.style.backgroundImage = `url('${payload.bannerImage || payload.coverImage || ''}')`;
        DOM.detailsPoster.src = payload.coverImage || payload.image || '';
        DOM.detailsTitle.textContent = payload.title.english || payload.title.romaji;
        DOM.detailsStudio.textContent = `Studio Production: ${payload.studios?.join(', ') || 'Independent Core'}`;
        DOM.detailsScore.innerHTML = `<i class="fa-solid fa-star text-accent"></i> ${payload.score ? (payload.score/10).toFixed(1) : '7.5'}`;
        DOM.detailsSynopsis.textContent = payload.description || 'No digital manifest logs exist for this record.';
        
        DOM.detailsBadges.innerHTML = '';
        if(payload.genres) {
            payload.genres.forEach(g => {
                const b = document.createElement('span');
                b.textContent = g;
                DOM.detailsBadges.appendChild(b);
            });
        }

        DOM.gridEpisodes.innerHTML = '';
        const limit = payload.episodes || payload.totalEpisodes || 12;
        for (let i = 1; i <= limit; i++) {
            const btn = document.createElement('button');
            btn.className = 'matrix-ep-trigger';
            btn.textContent = `Episode ${i}`;
            btn.addEventListener('click', () => executeCinemaPipeline(i - 1));
            DOM.gridEpisodes.appendChild(btn);
        }

        DOM.btnPlayFirst.onclick = () => executeCinemaPipeline(0);
        refreshWatchlistBtnState(id);
        hydrateDiscussionComments(id);
        syncInteractiveStarRating(id);
        navigateTo('details');
    } catch(err) { console.error(err); }
}

/* ==========================================
 * CINEMATIC THEATER VIEW STREAM CONTROLLER
 * ========================================== */
function executeCinemaPipeline(index) {
    if(!appState.activeMedia) return;
    appState.activeEpIndex = index;
    const media = appState.activeMedia;
    
    DOM.playerTitleAnime.textContent = media.title.english || media.title.romaji;
    DOM.playerTitleEp.textContent = `Broadcast Episode ${index + 1}`;
    
    const trackingKey = `stream_resume_${media.id}_${index}`;
    const stamp = localStorage.getItem(trackingKey);
    
    navigateTo('player');
    DOM.videoElement.load();
    
    if(stamp) DOM.videoElement.currentTime = parseFloat(stamp);
    DOM.videoElement.play().catch(() => console.log('Playback lifecycle suspended. Wait user event pointer.'));
    
    generatePlaylistSidebar(media);
    writeHistoryLog(media.id, index);
}

function generatePlaylistSidebar(media) {
    DOM.sidebarEpStack.innerHTML = '';
    const cap = media.episodes || media.totalEpisodes || 12;
    for(let i = 0; i < cap; i++) {
        const row = document.createElement('div');
        row.className = `playlist-stack-row ${i === appState.activeEpIndex ? 'active' : ''}`;
        row.textContent = `Episode ${i + 1} Broadcast`;
        row.addEventListener('click', () => executeCinemaPipeline(i));
        DOM.sidebarEpStack.appendChild(row);
    }
}

function trackVideoProgressRuntime() {
    const video = DOM.videoElement;
    if(video.currentTime >= 12 && video.currentTime <= 28) {
        DOM.btnSkipIntro.classList.remove('hidden');
    } else {
        DOM.btnSkipIntro.classList.add('hidden');
    }
    if(appState.activeMedia && video.currentTime > 0) {
        localStorage.setItem(`stream_resume_${appState.activeMedia.id}_${appState.activeEpIndex}`, video.currentTime);
    }
}

function shiftPlaybackIndex(offset) {
    const targetIdx = appState.activeEpIndex + offset;
    const max = appState.activeMedia.episodes || appState.activeMedia.totalEpisodes || 12;
    if (targetIdx >= 0 && targetIdx < max) executeCinemaPipeline(targetIdx);
}

/* ==========================================
 * LOCAL STORAGE STORAGE PERSISTENCE SYSTEMS
 * ========================================== */
function refreshWatchlistBtnState(id) {
    const exists = appState.watchlist.includes(id);
    DOM.btnWatchlistToggle.textContent = exists ? 'Drop Watchlist' : 'Add to Watchlist';
    DOM.btnWatchlistToggle.onclick = () => {
        if(appState.watchlist.includes(id)) {
            appState.watchlist = appState.watchlist.filter(i => i !== id);
        } else {
            appState.watchlist.push(id);
        }
        localStorage.setItem('as_watchlist', JSON.stringify(appState.watchlist));
        refreshWatchlistBtnState(id);
    };
}

function writeHistoryLog(animeId, index) {
    const record = { animeId, index, date: Date.now(), title: appState.activeMedia.title.english || appState.activeMedia.title.romaji, img: appState.activeMedia.coverImage || appState.activeMedia.image };
    appState.history = appState.history.filter(h => h.animeId !== animeId);
    appState.history.unshift(record);
    localStorage.setItem('as_history', JSON.stringify(appState.history));
}

function populateWorkspaceDashboard() {
    DOM.panelWatchlist.innerHTML = '';
    DOM.panelHistory.innerHTML = '';

    if(appState.watchlist.length === 0) DOM.panelWatchlist.innerHTML = '<p class="notice">Tracked library is vacant.</p>';
    if(appState.history.length === 0) DOM.panelHistory.innerHTML = '<p class="notice">No history telemetry files registered.</p>';

    appState.watchlist.forEach(async (id) => {
        const response = await fetch(`${CONFIG.API_URL}/info/${id}`);
        const parsed = await response.json();
        DOM.panelWatchlist.appendChild(generateMediaCardNode(parsed.data || parsed));
    });

    appState.history.forEach(h => {
        const node = document.createElement('div');
        node.className = 'media-card-node';
        node.innerHTML = `
            <div class="node-img-container">
                <img src="${h.img}" alt="">
            </div>
            <div class="node-metadata-padding">
                <h4>${h.title}</h4>
                <p>Resume: Episode ${h.index + 1}</p>
            </div>
        `;
        node.addEventListener('click', () => pullMediaProfile(h.animeId, true));
        DOM.panelHistory.appendChild(node);
    });
}

function setupInteractiveRatingEngine() {
    DOM.interactiveStars.querySelectorAll('i').forEach(star => {
        star.addEventListener('click', (e) => {
            if(!appState.activeMedia) return;
            localStorage.setItem(`stars_rating_${appState.activeMedia.id}`, e.target.dataset.scoreIndex);
            syncInteractiveStarRating(appState.activeMedia.id);
        });
    });
}

function syncInteractiveStarRating(id) {
    const scoreVal = localStorage.getItem(`stars_rating_${id}`) || 0;
    DOM.interactiveStars.querySelectorAll('i').forEach(s => {
        s.className = parseInt(s.dataset.scoreIndex) <= scoreVal ? 'fa-star fa-solid text-accent' : 'fa-star fa-regular';
    });
}

function hydrateDiscussionComments(id) {
    DOM.discussionContainer.innerHTML = '';
    const items = JSON.parse(localStorage.getItem(`comments_pool_${id}`)) || [];
    items.forEach(c => {
        const node = document.createElement('div');
        node.className = 'comment-card-node';
        node.innerHTML = `
            <div class="comment-card-header"><strong>${c.author}</strong><span>${new Date(c.date).toLocaleDateString()}</span></div>
            <p>${c.message}</p>
        `;
        DOM.discussionContainer.appendChild(node);
    });
}

function processCommentSubmission(e) {
    e.preventDefault();
    if(!appState.activeMedia) return;
    const author = appState.user ? appState.user.username : 'Anonymous User';
    const msg = DOM.discussionTextarea.value.trim();
    if(!msg) return;

    const id = appState.activeMedia.id;
    const array = JSON.parse(localStorage.getItem(`comments_pool_${id}`)) || [];
    array.unshift({ author, message: msg, date: Date.now() });
    localStorage.setItem(`comments_pool_${id}`, JSON.stringify(array));
    DOM.discussionTextarea.value = '';
    hydrateDiscussionComments(id);
}

/* ==========================================
 * PLATFORM ACCESS / VIRTUAL ID CONTROLS
 * ========================================== */
function triggerAuthModalDisplay(mode) {
    appState.authMode = mode;
    DOM.authHeading.textContent = mode === 'login' ? 'Sign In' : 'Create Credentials';
    DOM.authSubmitBtn.textContent = mode === 'login' ? 'Validate Login' : 'Register Account';
    DOM.authModeToggle.textContent = mode === 'login' ? 'Register Profile Here' : 'Login Here';
    DOM.authOverlay.classList.remove('hidden');
}

function captureProfileAuthorization(e) {
    e.preventDefault();
    const handle = document.getElementById('form-username-field').value.trim();
    appState.user = { username: handle };
    localStorage.setItem('as_user', JSON.stringify(appState.user));
    synchronizeUserInterface();
    DOM.authOverlay.classList.add('hidden');
    DOM.authForm.reset();
}

function executeProfileSignout() {
    appState.user = null;
    localStorage.removeItem('as_user');
    synchronizeUserInterface();
    navigateTo('home');
}

function synchronizeUserInterface() {
    if (appState.user) {
        DOM.authWrapper.innerHTML = `
            <div class="user-profile-badge">
                <span style="margin-right:12px; font-weight:600;">${appState.user.username}</span>
                <button id="auth-logout-action" class="btn secondary-btn" style="padding:6px 14px;">Logout</button>
            </div>
        `;
    } else {
        DOM.authWrapper.innerHTML = `<button id="auth-modal-trigger" class="btn primary-btn">Login</button>`;
    }
}

function debounce(fn, offsetDelay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), offsetDelay);
    };
}
