/**
 * AniStream - Core Application Script
 * Powered by Jikan REST API (MyAnimeList open-source integration)
 */

const API_BASE = 'https://anime-streaming.p.rapidapi.com';

// Application State Layer
const AppState = {
    watchlist: JSON.parse(localStorage.getItem('ani_watchlist')) || [],
    favorites: JSON.parse(localStorage.getItem('ani_favorites')) || [],
    history: JSON.parse(localStorage.getItem('ani_history')) || [],
    continueWatching: JSON.parse(localStorage.getItem('ani_continue')) || [],
    currentPage: 1,
    currentFilters: {
        genres: '',
        type: '',
        status: '',
        order_by: 'popularity'
    }
};

// --- Initializer Engine ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSearchEngine();
    initBrowseFilters();
    loadHomePageData();
});

// --- Routing & View Manager ---
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, #logo-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target') || 'home-page';
            
            // Toggle active styling
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            if(link.classList.contains('nav-link')) link.classList.add('active');
            
            switchView(target);
            navLinksContainer.classList.remove('mobile-active');
        });
    });

    menuToggle.addEventListener('click', () => {
        navLinksContainer.classList.contains('mobile-active') 
            ? navLinksContainer.classList.remove('mobile-active')
            : navLinksContainer.classList.add('mobile-active');
    });

    // View-all button routing hooks
    document.body.addEventListener('click', (e) => {
        if(e.target.classList.contains('view-more-btn')) {
            const filterCat = e.target.getAttribute('data-category');
            AppState.currentFilters.status = filterCat === 'airing' ? 'airing' : '';
            AppState.currentFilters.type = filterCat === 'movie' ? 'movie' : '';
            AppState.currentFilters.order_by = filterCat === 'bypopularity' ? 'popularity' : 'popularity';
            
            document.getElementById('browse-nav-btn').click();
            applyFiltersAndFetch();
        }
    });
}

function switchView(viewId) {
    document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if(viewId === 'library-page') {
        renderLibrary('watchlist');
    }
}

// --- API Transport Layer (With Error Resiliency & Rate Limiting Support) ---
async function fetchFromApi(endpoint) {
    try {
        // Enforce basic timeout spacing to prevent Jikan HTTP 429 rate limit rules
        await new Promise(resolve => setTimeout(resolve, 350));
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("API Transport Layer Failure:", error);
        return null;
    }
}

// --- View Component Builders ---
function renderSkeleton(containerId, count = 6) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for(let i=0; i<count; i++) {
        const skel = document.createElement('div');
        skel.className = 'skeleton-card';
        container.appendChild(skel);
    }
}

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.addEventListener('click', () => loadAnimeDetails(anime.mal_id));

    // Lazy load architecture using intersection patterns implicitly via standard browser decoding optimized parameters
    card.innerHTML = `
        <div class="card-img-wrapper">
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}" loading="lazy">
            <div class="card-score"><i class="fa-solid fa-star"></i> ${anime.score || 'N/A'}</div>
        </div>
        <div class="card-info">
            <h4 class="card-title">${anime.title}</h4>
            <div class="card-meta">${anime.type || 'TV'} • ${anime.episodes || '?'} eps</div>
        </div>
    `;
    return card;
}

// --- Business Module: Home Page ---
async function loadHomePageData() {
    renderSkeleton('trending-grid');
    renderSkeleton('popular-grid');
    renderSkeleton('movies-grid');
    renderContinueWatching();

    const trendingData = await fetchFromApi('/top/anime?filter=airing&limit=6');
    const popularData = await fetchFromApi('/top/anime?filter=bypopularity&limit=6');
    const movieData = await fetchFromApi('/top/anime?type=movie&limit=6');

    if(trendingData && trendingData.data.length > 0) {
        populateGrid('trending-grid', trendingData.data);
        buildHeroSpotlight(trendingData.data[0]);
    }
    if(popularData) populateGrid('popular-grid', popularData.data);
    if(movieData) populateGrid('movies-grid', movieData.data);
}

function populateGrid(containerId, data) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    data.forEach(anime => {
        container.appendChild(createAnimeCard(anime));
    });
}

function buildHeroSpotlight(anime) {
    const hero = document.getElementById('hero-spotlight');
    const bannerImg = anime.images.jpg.large_image_url;
    
    hero.style.backgroundImage = `url('${bannerImg}')`;
    hero.innerHTML = `
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <h1 class="hero-title">${anime.title}</h1>
            <p class="hero-synopsis">${anime.synopsis || 'No synopsis description available.'}</p>
            <div class="hero-btns">
                <button class="btn btn-primary" onclick="loadAnimeDetails(${anime.mal_id})">
                    <i class="fa-solid fa-circle-info"></i> More Info
                </button>
            </div>
        </div>
    `;
}

// --- Business Module: Search Mechanism (Debounced Input Optimization) ---
function initSearchEngine() {
    const input = document.getElementById('search-input');
    const suggestions = document.getElementById('search-suggestions');
    let debounceTimer;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        
        if(query.length < 3) {
            suggestions.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(async () => {
            const results = await fetchFromApi(`/anime?q=${encodeURIComponent(query)}&limit=5`);
            if(results && results.data.length > 0) {
                suggestions.innerHTML = '';
                results.data.forEach(anime => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    item.addEventListener('click', () => {
                        suggestions.style.display = 'none';
                        input.value = '';
                        loadAnimeDetails(anime.mal_id);
                    });
                    item.innerHTML = `
                        <img src="${anime.images.jpg.small_image_url}" alt="">
                        <div class="suggestion-info">
                            <h4>${anime.title}</h4>
                            <span>${anime.type} • ${anime.score || 'N/A'}</span>
                        </div>
                    `;
                    suggestions.appendChild(item);
                });
                suggestions.style.display = 'block';
            } else {
                suggestions.style.display = 'none';
            }
        }, 500);
    });

    // Close recommendations overlay on outside structural body taps
    document.addEventListener('click', (e) => {
        if(!e.target.closest('.search-container')) {
            suggestions.style.display = 'none';
        }
    });
}

// --- Business Module: Detail Workspace & Streaming Tracker ---
async function loadAnimeDetails(malId) {
    switchView('detail-page');
    const container = document.getElementById('detail-container');
    container.innerHTML = '<div class="hero-skeleton" style="height: 500px; border-radius:12px;"></div>';

    const [detailRes, streamRes] = await Promise.all([
        fetchFromApi(`/anime/${malId}`),
        fetchFromApi(`/anime/${malId}/external`)
    ]);

    if(!detailRes) {
        container.innerHTML = `<p class="error-msg">Failed to grab profile telemetry. Check active connection.</p>`;
        return;
    }

    const anime = detailRes.data;
    saveToHistory(anime);

    // Filter validation for clean streaming pathways
    const officialStreams = streamRes?.data?.filter(s => s.name.toLowerCase().match(/(crunchyroll|hulu|netflix|hidive|funimation|prime)/)) || [];

    const isWatchlisted = AppState.watchlist.some(x => x.mal_id === anime.mal_id);
    const isFavorited = AppState.favorites.some(x => x.mal_id === anime.mal_id);

    container.innerHTML = `
        <div class="detail-banner" style="background-image: url('${anime.images.jpg.large_image_url}')">
            <div class="detail-banner-overlay"></div>
        </div>
        <div class="detail-main-info">
            <img class="detail-poster" src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
            <div class="detail-body">
                <h1 class="detail-title">${anime.title}</h1>
                <div class="detail-genres">
                    ${anime.genres.map(g => `<span class="genre-badge">${g.name}</span>`).join('')}
                </div>
                
                <div class="action-row">
                    <button class="action-btn ${isWatchlisted ? 'active' : ''}" id="watchlist-toggle-btn">
                        <i class="fa-solid ${isWatchlisted ? 'fa-check' : 'fa-plus'}"></i> Watchlist
                    </button>
                    <button class="action-btn ${isFavorited ? 'active' : ''}" id="favorite-toggle-btn">
                        <i class="fa-solid fa-heart"></i> Favorite
                    </button>
                    <button class="action-btn" id="simulate-watch-btn">
                        <i class="fa-solid fa-play"></i> Simulate Play
                    </button>
                </div>
            </div>
        </div>

        <div class="detail-grid-info">
            <div class="synopsis-box">
                <h3>Synopsis</h3>
                <p>${anime.synopsis || 'No synopsis detailed yet.'}</p>
                
                <h3 style="margin-top: 30px;">Official Stream Allocations</h3>
                <div class="stream-links-grid" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
                    ${officialStreams.length > 0 ? officialStreams.map(s => `
                        <a href="${s.url}" target="_blank" rel="noopener" class="action-btn" style="background:var(--bg-secondary); border-color:var(--accent-color)">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Watch on ${s.name}
                        </a>
                    `).join('') : '<p style="color:var(--text-muted); font-size:0.9rem;">No direct streaming configurations indexation found via global providers.</p>'}
                </div>
            </div>
            
            <div class="meta-sidebar">
                <h3>Information</h3>
                <div class="meta-item"><strong>Format:</strong> ${anime.type || 'N/A'}</div>
                <div class="meta-item"><strong>Episodes:</strong> ${anime.episodes || 'Unknown'}</div>
                <div class="meta-item"><strong>Status:</strong> ${anime.status || 'N/A'}</div>
                <div class="meta-item"><strong>Aired:</strong> ${anime.aired?.string || 'N/A'}</div>
                <div class="meta-item"><strong>Studios:</strong> ${anime.studios?.map(s => s.name).join(', ') || 'N/A'}</div>
                <div class="meta-item"><strong>Rating:</strong> ${anime.rating || 'N/A'}</div>
                <div class="meta-item"><strong>Global Rank:</strong> Score ${anime.score || 'N/A'} (#${anime.rank || 'Unranked'})</div>
            </div>
        </div>
    `;

    // Hook state dynamic updates
    document.getElementById('watchlist-toggle-btn').addEventListener('click', () => toggleLibraryItem('watchlist', anime));
    document.getElementById('favorite-toggle-btn').addEventListener('click', () => toggleLibraryItem('favorites', anime));
    document.getElementById('simulate-watch-btn').addEventListener('click', () => simulatePlayback(anime));
}

// --- Business Module: Filtering & Advanced Exploration Engine ---
function initBrowseFilters() {
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
        AppState.currentPage = 1;
        applyFiltersAndFetch();
    });

    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if(AppState.currentPage > 1) {
            AppState.currentPage--;
            applyFiltersAndFetch();
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        AppState.currentPage++;
        applyFiltersAndFetch();
    });
}

async function applyFiltersAndFetch() {
    renderSkeleton('browse-grid', 8);
    
    const genre = document.getElementById('filter-genre').value;
    const format = document.getElementById('filter-format').value;
    const status = document.getElementById('filter-status').value;
    const sort = document.getElementById('filter-sort').value;

    let url = `/anime?page=${AppState.currentPage}&order_by=${sort}&sort=desc`;
    if(genre) url += `&genres=${genre}`;
    if(format) url += `&type=${format}`;
    if(status) url += `&status=${status}`;

    const res = await fetchFromApi(url);
    const container = document.getElementById('browse-grid');
    container.innerHTML = '';

    if(res && res.data.length > 0) {
        res.data.forEach(anime => container.appendChild(createAnimeCard(anime)));
        document.getElementById('page-number').innerText = `Page ${AppState.currentPage}`;
        document.getElementById('prev-page-btn').disabled = AppState.currentPage === 1;
        document.getElementById('next-page-btn').disabled = !res.pagination.has_next_page;
    } else {
        container.innerHTML = `<p class="error-msg">No entries discovered fitting structural conditions criteria.</p>`;
    }
}

// --- Local Storage Synchronization Core ---
function toggleLibraryItem(key, anime) {
    const list = AppState[key];
    const index = list.findIndex(x => x.mal_id === anime.mal_id);
    const btnId = key === 'watchlist' ? 'watchlist-toggle-btn' : 'favorite-toggle-btn';
    const btn = document.getElementById(btnId);

    if(index > -1) {
        list.splice(index, 1);
        if(key === 'watchlist') btn.innerHTML = '<i class="fa-solid fa-plus"></i> Watchlist';
        btn.classList.remove('active');
    } else {
        list.push({
            mal_id: anime.mal_id,
            title: anime.title,
            images: { jpg: { image_url: anime.images.jpg.image_url } },
            type: anime.type,
            episodes: anime.episodes,
            score: anime.score
        });
        if(key === 'watchlist') btn.innerHTML = '<i class="fa-solid fa-check"></i> Watchlist';
        btn.classList.add('active');
    }
    localStorage.setItem(`ani_${key}`, JSON.stringify(list));
}

function saveToHistory(anime) {
    let hist = AppState.history.filter(x => x.mal_id !== anime.mal_id);
    hist.unshift({
        mal_id: anime.mal_id,
        title: anime.title,
        images: { jpg: { image_url: anime.images.jpg.image_url } },
        type: anime.type,
        episodes: anime.episodes,
        score: anime.score
    });
    if(hist.length > 12) hist.pop(); // Max cap sizing bound bound limits
    AppState.history = hist;
    localStorage.setItem('ani_history', JSON.stringify(hist));
}

function simulatePlayback(anime) {
    let cont = AppState.continueWatching.filter(x => x.mal_id !== anime.mal_id);
    const mockProgress = Math.floor(Math.random() * 85) + 10; // Generate dynamic structural metrics display
    
    cont.unshift({
        mal_id: anime.mal_id,
        title: anime.title,
        image: anime.images.jpg.image_url,
        progress: mockProgress
    });
    
    AppState.continueWatching = cont;
    localStorage.setItem('ani_continue', JSON.stringify(cont));
    alert(`Playback simulated for "${anime.title}". Session metric updated under Continue Watching Dashboard!`);
    renderContinueWatching();
}

// --- Custom Dashboard Render Modules ---
function renderContinueWatching() {
    const container = document.getElementById('continue-watching-grid');
    const wrapper = document.getElementById('continue-watching-section');
    
    if(AppState.continueWatching.length === 0) {
        wrapper.classList.add('hidden');
        return;
    }
    
    wrapper.classList.remove('hidden');
    container.innerHTML = '';
    
    AppState.continueWatching.slice(0, 4).forEach(item => {
        const card = document.createElement('div');
        card.className = 'continue-card';
        card.addEventListener('click', () => loadAnimeDetails(item.mal_id));
        card.innerHTML = `
            <img src="${item.image}" alt="">
            <div class="continue-info">
                <div class="continue-title">${item.title}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${item.progress}%"></div>
                </div>
                <span style="font-size:0.75rem; margin-top:5px; color:var(--accent-color)">${item.progress}% Complete</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function initLibraryTabs() {
    document.querySelectorAll('.lib-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderLibrary(tab.getAttribute('data-lib'));
        });
    });
}

function renderLibrary(type) {
    initLibraryTabs();
    const container = document.getElementById('library-grid');
    container.innerHTML = '';
    const list = AppState[type];

    if(!list || list.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-muted)">Your records list configuration is empty.</p>`;
        return;
    }

    list.forEach(anime => {
        // Adjust interface signatures slightly to structural schema parameters mapping logic match bounds
        const trackingObj = {
            mal_id: anime.mal_id,
            title: anime.title,
            images: { jpg: { image_url: anime.images.jpg.image_url } },
            type: anime.type,
            episodes: anime.episodes,
            score: anime.score
        };
        container.appendChild(createAnimeCard(trackingObj));
    });
}
