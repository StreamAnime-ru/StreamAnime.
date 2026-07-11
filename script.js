/**
 * HaruAnime - High Performance Frameworkless Front-End Engine
 * Built with vanilla JavaScript leveraging the public Jikan (MyAnimeList) API 
 * and LocalStorage for user state tracking, watch histories, and interactions.
 */

// Global Application Engine Configuration State
const AppState = {
    apiBase: 'https://api.jikan.moe/v4',
    currentUser: null,
    activeAnimeData: null,
    activeEpisode: 1,
    historyUpdateInterval: null
};

// Initial Core Setup on Load
document.addEventListener('DOMContentLoaded', () => {
    initMockDatabase();
    checkUserSession();
    registerGlobalNavigation();
    initSearchAutocomplete();
    initFilters();
    initCustomVideoPlayer();
    initInteractions();
    
    // Initial Render of Root View
    routeToView('home-view');
    renderHomepageData();
});

/* ==========================================================================
   1. MOCK DATABASE & ROUTING STATE ENGINE (LOCAL STORAGE)
   ========================================================================== */

function initMockDatabase() {
    if (!localStorage.getItem('haru_users')) localStorage.setItem('haru_users', JSON.stringify([]));
    if (!localStorage.getItem('haru_comments')) localStorage.setItem('haru_comments', JSON.stringify({}));
    if (!localStorage.getItem('haru_watchlist')) localStorage.setItem('haru_watchlist', JSON.stringify({}));
    if (!localStorage.getItem('haru_favorites')) localStorage.setItem('haru_favorites', JSON.stringify({}));
    if (!localStorage.getItem('haru_continue_watching')) localStorage.setItem('haru_continue_watching', JSON.stringify({}));
}

function checkUserSession() {
    const session = sessionStorage.getItem('haru_session');
    if (session) {
        AppState.currentUser = session;
    }
    updateAuthNavZone();
}

function routeToView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');
    
    // Sync Navigation Active Links
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('data-target') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function registerGlobalNavigation() {
    document.querySelectorAll('[data-target]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const viewTarget = trigger.getAttribute('data-target');
            if (viewTarget === 'watchlist-view') {
                renderUserCollections();
            }
            routeToView(viewTarget);
        });
    });

    document.getElementById('nav-logo').addEventListener('click', (e) => {
        e.preventDefault();
        routeToView('home-view');
    });
}

/* ==========================================================================
   2. DATA FETCHING & API AGGREGATION LAYER (JIKAN/CONSUMET MAPPER)
   ========================================================================== */

async function fetchFromApi(endpoint) {
    try {
        // Enforcing rate-limiting cushion dynamically for Jikan public API stability
        await new Promise(resolve => setTimeout(resolve, 350)); 
        const response = await fetch(`${AppState.apiBase}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("API Layer Interruption:", error);
        return null;
    }
}

async function renderHomepageData() {
    renderContinueWatchingSection();

    // Fetch and Build Hero Banner Dynamic Carousel Content
    const topData = await fetchFromApi('/top/anime?limit=5&filter=airing');
    if (topData && topData.data) {
        buildHeroSlider(topData.data);
    }

    // Populate Async Homepage Content Grid Nodes
    fetchAndPopulateGrid('/top/anime?limit=6&filter=bypopularity', 'trending-grid');
    fetchAndPopulateGrid('/top/anime?limit=6&filter=favorite', 'popular-grid');
    fetchAndPopulateGrid('/seasons/now?limit=6', 'latest-grid');
    
    // Sidebar population lists
    fetchAndPopulateMiniList('/anime?limit=5&order_by=start_date&sort=desc', 'recent-added-list');
}

async function fetchAndPopulateGrid(endpoint, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    const result = await fetchFromApi(endpoint);
    container.innerHTML = '';
    
    if (result && result.data) {
        result.data.forEach(anime => {
            container.appendChild(createAnimeCardNode(anime));
        });
    } else {
        container.innerHTML = `<p class="error-msg">Failed to retrieve data items.</p>`;
    }
}

async function fetchAndPopulateMiniList(endpoint, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    const result = await fetchFromApi(endpoint);
    container.innerHTML = '';
    
    if (result && result.data) {
        result.data.forEach(anime => {
            const item = document.createElement('div');
            item.className = 'mini-item';
            item.addEventListener('click', () => loadAnimeDetailsPage(anime.mal_id));
            item.innerHTML = `
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" data-src="${anime.images.jpg.small_image_url}" class="lazy-load" alt="${anime.title}">
                <div class="mini-item-meta">
                    <h5>${anime.title}</h5>
                    <span>Score: ${anime.score || 'N/A'}</span>
                </div>
            `;
            container.appendChild(item);
        });
        executeLazyLoading();
    }
}

/* ==========================================================================
   3. RENDERING COMPONENT FABRICATION & GENERATION LOGIC
   ========================================================================== */

function createAnimeCardNode(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.addEventListener('click', () => loadAnimeDetailsPage(anime.mal_id));

    card.innerHTML = `
        <div class="card-img-wrapper">
            <span class="score-badge"><i class="fa-solid fa-star"></i> ${anime.score || 'N/A'}</span>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" data-src="${anime.images.jpg.large_image_url}" class="lazy-load" alt="${anime.title}">
        </div>
        <div class="card-info">
            <h4>${anime.title}</h4>
            <p>${anime.type || 'TV'} • ${anime.episodes || '?'} eps</p>
        </div>
    `;
    executeLazyLoading();
    return card;
}

function buildHeroSlider(animeList) {
    const container = document.getElementById('hero-slider-container');
    container.innerHTML = '';
    
    if (animeList.length === 0) return;
    const featured = animeList[0]; // Leverage prominent single node feature system

    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    slide.style.backgroundImage = `url('${featured.images.jpg.large_image_url}')`;
    
    slide.innerHTML = `
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <h2>${featured.title}</h2>
            <p>${featured.synopsis || 'No synopsis outline index updated currently for this content asset block.'}</p>
            <button class="btn-primary" id="hero-action-btn"><i class="fa-solid fa-circle-info"></i> More Details</button>
        </div>
    `;
    container.appendChild(slide);

    document.getElementById('hero-action-btn').addEventListener('click', () => {
        loadAnimeDetailsPage(featured.mal_id);
    });
}

/* ==========================================================================
   4. ADVANCED DISCOVERY CONTROLS, SEARCH AUTOCOMPLETE & FILTERS
   ========================================================================== */

function initFilters() {
    const genreSelect = document.getElementById('filter-genre');
    const popularGenres = [
        { id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }, { id: 4, name: 'Comedy' },
        { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasy' }, { id: 24, name: 'Sci-Fi' }
    ];
    
    const cloudContainer = document.getElementById('genre-cloud-container');
    
    popularGenres.forEach(genre => {
        // Dropdown option builder
        const opt = document.createElement('option');
        opt.value = genre.id;
        opt.textContent = genre.name;
        genreSelect.appendChild(opt);

        // Sidebar generic cloud option builder
        const chip = document.createElement('div');
        chip.className = 'genre-chip';
        chip.textContent = genre.name;
        chip.addEventListener('click', () => {
            genreSelect.value = genre.id;
            triggerFilterSearchPipeline();
        });
        if (cloudContainer) cloudContainer.appendChild(chip);
    });

    document.getElementById('apply-filters-btn').addEventListener('click', triggerFilterSearchPipeline);
}

async function triggerFilterSearchPipeline() {
    const genre = document.getElementById('filter-genre').value;
    const status = document.getElementById('filter-status').value;
    
    let queryParams = '/anime?limit=12';
    if (genre) queryParams += `&genres=${genre}`;
    if (status) queryParams += `&status=${status}`;

    // Re-route dynamically on output mapping
    const trendingGrid = document.getElementById('trending-grid');
    document.querySelector('#trending-grid').parentElement.scrollIntoView({ behavior: 'smooth' });
    fetchAndPopulateGrid(queryParams, 'trending-grid');
}

function initSearchAutocomplete() {
    const searchInput = document.getElementById('global-search');
    const dropdown = document.getElementById('autocomplete-results');
    let debounceTimer;

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();
        if (query.length < 3) {
            dropdown.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            const data = await fetchFromApi(`/anime?q=${encodeURIComponent(query)}&limit=5`);
            if (data && data.data) {
                renderAutocompleteDropdown(data.data);
            }
        }, 400);
    });

    // Outer click containment closure dismissals
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            dropdown.classList.add('hidden');
        }
    });
}

function renderAutocompleteDropdown(results) {
    const dropdown = document.getElementById('autocomplete-results');
    dropdown.innerHTML = '';
    
    if (results.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }

    results.forEach(anime => {
        const row = document.createElement('div');
        row.className = 'autocomplete-item';
        row.innerHTML = `
            <img src="${anime.images.jpg.small_image_url}" alt="">
            <div class="autocomplete-info">
                <h5>${anime.title}</h5>
                <span>Score: ${anime.score || 'N/A'}</span>
            </div>
        `;
        row.addEventListener('click', () => {
            dropdown.classList.add('hidden');
            document.getElementById('global-search').value = '';
            loadAnimeDetailsPage(anime.mal_id);
        });
        dropdown.appendChild(row);
    });

    dropdown.classList.remove('hidden');
}

/* ==========================================================================
   5. DEEP INSIGHTS - ANIME DETAILS MANIFEST ARCHITECTURE
   ========================================================================== */

async function loadAnimeDetailsPage(malId) {
    routeToView('details-view');
    
    // Clear and loading structural states
    document.getElementById('detail-title').textContent = "Syncing details...";
    document.getElementById('detail-episodes-grid').innerHTML = '';
    
    const details = await fetchFromApi(`/anime/${malId}`);
    if (!details || !details.data) return;

    const data = details.data;
    AppState.activeAnimeData = data; // Cache frame global configuration state variables

    // UI Data Mapping
    document.getElementById('detail-title').textContent = data.title;
    document.getElementById('detail-backdrop').style.backgroundImage = `url('${data.images.jpg.large_image_url}')`;
    document.getElementById('detail-cover').src = data.images.jpg.large_image_url;
    document.getElementById('detail-description').textContent = data.synopsis || 'No analytical summary records mapped here.';
    document.getElementById('detail-studio').textContent = data.studios.map(s => s.name).join(', ') || 'Independent Core Team';
    document.getElementById('detail-rating').innerHTML = `<i class="fa-solid fa-star"></i> ${data.score || '0.0'}`;
    document.getElementById('detail-type').textContent = data.type || 'TV';
    document.getElementById('detail-status').textContent = data.status;

    // Map Genre Tag Badges
    const tagZone = document.getElementById('detail-genres');
    tagZone.innerHTML = '';
    data.genres.forEach(g => {
        const token = document.createElement('span');
        token.className = 'meta-badge';
        token.textContent = g.name;
        tagZone.appendChild(token);
    });

    // Inject Responsive Dynamic Synthetic Episode Structure Blocks
    buildEpisodesContainerGrid(data.episodes || 12);
    
    // Update Tracking Controls Subsystem state triggers
    syncInteractionButtonsState();
    renderCommentsSection(malId);

    // Fetch Secondary Content Mapping Items
    fetchAndPopulateMiniList(`/anime/${malId}/recommendations?limit=4`, 'detail-recommendations');
}

function buildEpisodesContainerGrid(count) {
    const grid = document.getElementById('detail-episodes-grid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const epBtn = document.createElement('div');
        epBtn.className = 'ep-btn';
        epBtn.textContent = i;
        epBtn.addEventListener('click', () => startVideoPlaybackEngine(AppState.activeAnimeData, i));
        grid.appendChild(epBtn);
    }

    // Play action dynamic trigger linking
    document.getElementById('detail-play-btn').onclick = () => {
        startVideoPlaybackEngine(AppState.activeAnimeData, 1);
    };
}

/* ==========================================================================
   6. HIGH-PERFORMANCE CUSTOM IMMERSIVE PLAYER SUBSYSTEM
   ========================================================================== */

function startVideoPlaybackEngine(animeData, episodeNum) {
    AppState.activeAnimeData = animeData;
    AppState.activeEpisode = parseInt(episodeNum);
    
    routeToView('player-view');
    
    document.getElementById('player-anime-title').textContent = animeData.title;
    document.getElementById('player-episode-title').textContent = `Episode ${episodeNum}`;
    
    const video = document.getElementById('main-video-element');
    video.play().catch(() => { /* Standard security gesture requirement exception catch */ });
    
    buildPlayerSidebarCollection(animeData.episodes || 12);
    initContinueWatchingPersistence();
}

function initCustomVideoPlayer() {
    const video = document.getElementById('main-video-element');
    const wrapper = document.getElementById('custom-player-wrapper');
    const playBtn = document.getElementById('player-play-btn');
    const progressFill = document.getElementById('player-progress-fill');
    const progressContainer = document.getElementById('player-progress-container');
    const timeDisplay = document.getElementById('player-time');
    const fsBtn = document.getElementById('player-fullscreen-btn');
    const skipBtn = document.getElementById('skip-intro-btn');

    // Controls HUD Trigger Matrix State Logic
    playBtn.addEventListener('click', togglePlayState);
    video.addEventListener('click', togglePlayState);
    
    function togglePlayState() {
        if (video.paused) {
            video.play();
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            video.pause();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }

    video.addEventListener('timeupdate', () => {
        const pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = `${pct}%`;
        
        // Formulate readable playback metrics
        timeDisplay.textContent = `${formatTimeMarkup(video.currentTime)} / ${formatTimeMarkup(video.duration || 0)}`;

        // Intro Skipping Trigger (Display window between 5s and 25s for illustration)
        if (video.currentTime > 5 && video.currentTime < 25) {
            skipBtn.classList.remove('hidden');
        } else {
            skipBtn.classList.add('hidden');
        }
    });

    skipBtn.addEventListener('click', () => {
        video.currentTime = 25; // Skip payload marker jump execution
    });

    progressContainer.addEventListener('click', (e) => {
        const clickCoordX = e.offsetX;
        const totalWidth = progressContainer.offsetWidth;
        video.currentTime = (clickCoordX / totalWidth) * video.duration;
    });

    fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    // Structural Action Deck Stepper Controls Setup
    document.getElementById('player-prev-btn').onclick = () => changeEpisodeStep(-1);
    document.getElementById('player-next-btn').onclick = () => changeEpisodeStep(1);
}

function changeEpisodeStep(offset) {
    const target = AppState.activeEpisode + offset;
    const max = AppState.activeAnimeData.episodes || 12;
    if (target >= 1 && target <= max) {
        startVideoPlaybackEngine(AppState.activeAnimeData, target);
    }
}

function buildPlayerSidebarCollection(count) {
    const sidebar = document.getElementById('player-sidebar-episodes');
    sidebar.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const row = document.createElement('div');
        row.className = `sidebar-ep-row ${i === AppState.activeEpisode ? 'active' : ''}`;
        row.innerHTML = `<strong>Episode ${i}</strong><span style="font-size:11px; color:var(--text-muted); margin-left:auto;">Authorized HD</span>`;
        row.addEventListener('click', () => startVideoPlaybackEngine(AppState.activeAnimeData, i));
        sidebar.appendChild(row);
    }
}

function formatTimeMarkup(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ==========================================================================
   7. USER LOCALSTORAGE DATA REPOSITORY SYSTEM (CONTINUE WATCHING & LOGS)
   ========================================================================== */

function initContinueWatchingPersistence() {
    if (!AppState.currentUser) return;
    clearInterval(AppState.historyUpdateInterval);

    AppState.historyUpdateInterval = setInterval(() => {
        const video = document.getElementById('main-video-element');
        if (!video || video.paused) return;

        const record = {
            id: AppState.activeAnimeData.mal_id,
            title: AppState.activeAnimeData.title,
            image: AppState.activeAnimeData.images.jpg.large_image_url,
            episode: AppState.activeEpisode,
            timestamp: video.currentTime,
            duration: video.duration
        };

        let database = JSON.parse(localStorage.getItem('haru_continue_watching'));
        if (!database[AppState.currentUser]) database[AppState.currentUser] = [];
        
        // Remove structural duplicate items from index mapping
        database[AppState.currentUser] = database[AppState.currentUser].filter(item => item.id !== record.id);
        database[AppState.currentUser].unshift(record); // Prepend to top priority array slots
        
        localStorage.setItem('haru_continue_watching', JSON.stringify(database));
    }, 4000); // Commit execution window frame loops every 4 seconds safely
}

function renderContinueWatchingSection() {
    const section = document.getElementById('continue-watching-section');
    const grid = document.getElementById('continue-watching-grid');
    if (!section || !grid) return;

    if (!AppState.currentUser) {
        section.classList.add('hidden');
        return;
    }

    const database = JSON.parse(localStorage.getItem('haru_continue_watching'));
    const userRecords = database[AppState.currentUser] || [];

    if (userRecords.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    grid.innerHTML = '';

    userRecords.slice(0, 4).forEach(record => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${record.image}" alt="">
                <div class="progress-bar-container" style="position:absolute; bottom:0; left:0; margin:0; border-radius:0; height:4px;">
                    <div class="progress-filled" style="width:${(record.timestamp / (record.duration || 1)) * 100}%"></div>
                </div>
            </div>
            <div class="card-info">
                <h4>${record.title}</h4>
                <p>Resume Ep ${record.episode}</p>
            </div>
        `;
        card.addEventListener('click', async () => {
            const freshData = await fetchFromApi(`/anime/${record.id}`);
            if (freshData && freshData.data) {
                startVideoPlaybackEngine(freshData.data, record.episode);
                // Delay buffer seeking setting directly to align playback initialization
                setTimeout(() => {
                    document.getElementById('main-video-element').currentTime = record.timestamp;
                }, 500);
            }
        });
        grid.appendChild(card);
    });
}

/* ==========================================================================
   8. ENGAGEMENT INTERACTION LOGIC (COMMENTS, RATINGS & ACCOUNT DIALOGS)
   ========================================================================== */

function initInteractions() {
    // Structural Watchlist & Fav Event Handlers
    document.getElementById('detail-watchlist-btn').addEventListener('click', () => toggleCollectionMetric('haru_watchlist'));
    document.getElementById('detail-fav-btn').addEventListener('click', () => toggleCollectionMetric('haru_favorites'));

    // Comment Post Logic Trigger Node
    document.getElementById('submit-comment-btn').addEventListener('click', commitCommentToRepository);
}

function toggleCollectionMetric(storageKey) {
    if (!AppState.currentUser) {
        invokeAuthenticationModal();
        return;
    }
    const animeId = AppState.activeAnimeData.mal_id;
    let database = JSON.parse(localStorage.getItem(storageKey));
    if (!database[AppState.currentUser]) database[AppState.currentUser] = [];

    const index = database[AppState.currentUser].findIndex(item => item.id === animeId);
    if (index >= 0) {
        database[AppState.currentUser].splice(index, 1);
    } else {
        database[AppState.currentUser].push({
            id: animeId,
            title: AppState.activeAnimeData.title,
            image: AppState.activeAnimeData.images.jpg.large_image_url,
            score: AppState.activeAnimeData.score
        });
    }

    localStorage.setItem(storageKey, JSON.stringify(database));
    syncInteractionButtonsState();
}

function syncInteractionButtonsState() {
    if (!AppState.currentUser || !AppState.activeAnimeData) return;
    const animeId = AppState.activeAnimeData.mal_id;

    const wl = JSON.parse(localStorage.getItem('haru_watchlist'))[AppState.currentUser] || [];
    const fav = JSON.parse(localStorage.getItem('haru_favorites'))[AppState.currentUser] || [];

    document.getElementById('detail-watchlist-btn').innerHTML = wl.some(i => i.id === animeId) 
        ? `<i class="fa-solid fa-check"></i> Added to Watchlist` 
        : `<i class="fa-solid fa-plus"></i> Add to Watchlist`;

    document.getElementById('detail-fav-btn').style.color = fav.some(i => i.id === animeId) ? 'var(--accent)' : 'inherit';
}

function renderCommentsSection(animeId) {
    const wrapper = document.getElementById('comments-wrapper');
    const counter = document.getElementById('comment-count');
    wrapper.innerHTML = '';

    const database = JSON.parse(localStorage.getItem('haru_comments'));
    const contextComments = database[animeId] || [];

    counter.textContent = contextComments.length;

    if (contextComments.length === 0) {
        wrapper.innerHTML = `<p style="font-size:13px; color:var(--text-muted)">No regulatory comments posted yet. Be the first!</p>`;
        return;
    }

    contextComments.forEach(comment => {
        const node = document.createElement('div');
        node.className = 'comment-card';
        node.innerHTML = `
            <div class="comment-hdr">
                <strong>${comment.user}</strong>
                <span>${comment.date}</span>
            </div>
            <p style="font-size:14px; color:var(--text-light);">${comment.text}</p>
        `;
        wrapper.appendChild(node);
    });
}

function commitCommentToRepository() {
    if (!AppState.currentUser) {
        invokeAuthenticationModal();
        return;
    }
    const txtInput = document.getElementById('comment-input');
    const commentStr = txtInput.value.trim();
    if (!commentStr) return;

    const animeId = AppState.activeAnimeData.mal_id;
    let database = JSON.parse(localStorage.getItem('haru_comments'));
    if (!database[animeId]) database[animeId] = [];

    database[animeId].unshift({
        user: AppState.currentUser,
        text: commentStr,
        date: new Date().toLocaleDateString()
    });

    localStorage.setItem('haru_comments', JSON.stringify(database));
    txtInput.value = '';
    renderCommentsSection(animeId);
}

function renderUserCollections() {
    if (!AppState.currentUser) {
        routeToView('home-view');
        invokeAuthenticationModal();
        return;
    }

    document.getElementById('profile-username-display').textContent = AppState.currentUser;

    populateUserGridFromStorage('haru_watchlist', 'user-watchlist-grid');
    populateUserGridFromStorage('haru_favorites', 'user-favorites-grid');
}

function populateUserGridFromStorage(storageKey, targetGridId) {
    const grid = document.getElementById(targetGridId);
    grid.innerHTML = '';
    const data = JSON.parse(localStorage.getItem(storageKey))[AppState.currentUser] || [];

    if (data.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted);">No entries added to this structural stack index shelf yet.</p>`;
        return;
    }

    data.forEach(item => {
        // Map polymorphic structural object fields matching card expected structures
        const simulatedAnime = {
            mal_id: item.id,
            title: item.title,
            images: { jpg: { large_image_url: item.image } },
            score: item.score
        };
        grid.appendChild(createAnimeCardNode(simulatedAnime));
    });
}

/* ==========================================================================
   9. SYSTEM ACCOUNT DIALOGS & PERFORMANCE (LAZY-LOADING CORE)
   ========================================================================== */

function invokeAuthenticationModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('hidden');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabLogin = document.getElementById('tab-login-btn');
    const tabSignup = document.getElementById('tab-signup-btn');

    tabLogin.onclick = () => {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    };

    tabSignup.onclick = () => {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    };

    document.getElementById('close-auth-btn').onclick = () => modal.classList.add('hidden');

    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const user = document.getElementById('login-user').value.trim();
        sessionStorage.setItem('haru_session', user);
        AppState.currentUser = user;
        updateAuthNavZone();
        modal.classList.add('hidden');
        renderHomepageData();
    };

    signupForm.onsubmit = (e) => {
        e.preventDefault();
        const user = document.getElementById('signup-user').value.trim();
        sessionStorage.setItem('haru_session', user);
        AppState.currentUser = user;
        updateAuthNavZone();
        modal.classList.add('hidden');
        renderHomepageData();
    };
}

function updateAuthNavZone() {
    const zone = document.getElementById('auth-nav-zone');
    if (AppState.currentUser) {
        zone.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <span style="font-size:14px; font-weight:600; color:var(--accent); cursor:pointer;" id="nav-profile-trigger"><i class="fa-solid fa-user-shield"></i> ${AppState.currentUser}</span>
                <button class="btn-secondary" id="logout-btn" style="padding:6px 12px; font-size:12px;">Sign Out</button>
            </div>
        `;
        document.getElementById('logout-btn').onclick = () => {
            sessionStorage.removeItem('haru_session');
            AppState.currentUser = null;
            clearInterval(AppState.historyUpdateInterval);
            updateAuthNavZone();
            routeToView('home-view');
            renderHomepageData();
        };
        document.getElementById('nav-profile-trigger').onclick = () => {
            renderUserCollections();
            routeToView('watchlist-view');
        };
    } else {
        zone.innerHTML = `<button class="btn-primary" id="nav-login-call-btn"><i class="fa-solid fa-user-astronaut"></i> Guest Access</button>`;
        document.getElementById('nav-login-call-btn').onclick = invokeAuthenticationModal;
    }
}

function executeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.classList.remove('lazy-load');
                    imageObserver.unobserve(image);
                }
            });
        }, { rootMargin: '0px 0px 200px 0px' });
        
        document.querySelectorAll('img.lazy-load').forEach(img => imageObserver.observe(img));
    } else {
        // Safe structural fallback framework approach logic parameters
        document.querySelectorAll('img.lazy-load').forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy-load');
        });
    }
}
