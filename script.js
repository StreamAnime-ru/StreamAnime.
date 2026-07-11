/**
 * AniStream - Core Application Engine
 * High Performance Vanilla JS Single Page Architecture (SPA)
 * Integrates metadata fetch systems via public API arrays alongside localStorage local sync wrappers.
 */

const AppState = {
    apiBase: 'https://api.jikan.moe/v4', // Fully stable open endpoint serving as the AnimeKai mapping translation engine
    activeView: 'home-page',
    explorePageNum: 1,
    exploreLoading: false,
    exploreHasMore: true,
    filterDebounceTimer: null
};

document.addEventListener('DOMContentLoaded', () => {
    initLocalRepository();
    setupSPARouting();
    setupSearchEngine();
    setupDiscoveryFilters();
    setupMobileMenu();
    
    // Default system boot parameters execution
    routeTo('home-page');
    loadHomepagePayload();
});

/* ==========================================================================
   1. LOCAL STORAGE DATABASE LOGIC ENGINE
   ========================================================================== */
function initLocalRepository() {
    if (!localStorage.getItem('anistream_watchlist')) localStorage.setItem('anistream_watchlist', JSON.stringify([]));
    if (!localStorage.getItem('anistream_favorites')) localStorage.setItem('anistream_favorites', JSON.stringify([]));
    if (!localStorage.getItem('anistream_history')) localStorage.setItem('anistream_history', JSON.stringify([]));
}

function getRepoItems(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function toggleRepoItem(key, animeData) {
    let items = getRepoItems(key);
    const index = items.findIndex(x => x.mal_id === animeData.mal_id);
    
    if (index > -1) {
        items.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(items));
        return false; // Removed
    } else {
        items.unshift({
            mal_id: animeData.mal_id,
            title: animeData.title,
            images: { jpg: { large_image_url: animeData.images.jpg.large_image_url } },
            type: animeData.type || 'TV',
            score: animeData.score || 'N/A'
        });
        localStorage.setItem(key, JSON.stringify(items));
        return true; // Added
    }
}

function saveToHistory(animeData) {
    let history = getRepoItems('anistream_history');
    history = history.filter(x => x.mal_id !== animeData.mal_id);
    history.unshift({
        mal_id: animeData.mal_id,
        title: animeData.title,
        images: { jpg: { large_image_url: animeData.images.jpg.large_image_url } },
        type: animeData.type || 'TV',
        score: animeData.score || 'N/A'
    });
    localStorage.setItem('anistream_history', JSON.stringify(history.slice(0, 8)));
}

/* ==========================================================================
   2. API CONNECTOR & METADATA AGGREGATION ENGINE
   ========================================================================== */
async function apiRequest(endpoint) {
    try {
        // Safe spacing limit buffer configuration to honor client public rules
        await new Promise(resolve => setTimeout(resolve, 300));
        const res = await fetch(`${AppState.apiBase}${endpoint}`);
        if (!res.ok) throw new Error(`Status error metrics reported: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("API Fetch Exception captured:", err);
        return null;
    }
}

/* ==========================================================================
   3. CARD DESIGN COMPONENT COMPILER (LAZY-LOAD READY)
   ========================================================================== */
function buildAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.addEventListener('click', () => renderDetailsPage(anime.mal_id));
    
    card.innerHTML = `
        <div class="card-poster-wrap">
            <span class="card-rating-tag"><i class="fa-solid fa-star"></i> ${anime.score || 'N/A'}</span>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" 
                 data-src="${anime.images.jpg.large_image_url}" 
                 class="lazy-img" 
                 alt="${anime.title}">
        </div>
        <div class="card-details">
            <h3>${anime.title}</h3>
            <p>${anime.type || 'TV'} • ${anime.episodes || '?'} Eps</p>
        </div>
    `;
    return card;
}

function injectSkeletons(targetGrid, count = 6) {
    const grid = document.getElementById(targetGrid);
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        grid.appendChild(skeleton);
    }
}

function dispatchLazyLoading() {
    const images = document.querySelectorAll('img.lazy-img');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-img');
                    obs.unobserve(img);
                }
            });
        }, { rootMargin: '0px 0px 200px 0px' });
        images.forEach(img => obs.observe(img));
    } else {
        images.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy-img');
        });
    }
}

/* ==========================================================================
   4. SPA VIEW CONTROLLER AND ROUTING GRID MATRIX
   ========================================================================== */
function setupSPARouting() {
    document.querySelectorAll('[data-target]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const destination = trigger.getAttribute('data-target');
            routeTo(destination);
        });
    });

    document.getElementById('logo-btn').addEventListener('click', (e) => {
        e.preventDefault();
        routeTo('home-page');
    });
}

function routeTo(viewId) {
    AppState.activeView = viewId;
    document.querySelectorAll('.view-page').forEach(page => page.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    
    // Update active visual triggers
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-target') === viewId) link.classList.add('active');
        else link.classList.remove('active');
    });

    // Close mobile drop drawers if matching trigger bounds
    document.getElementById('nav-menu').classList.remove('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewId === 'explore-page') {
        resetExplorePipeline();
        loadExploreData();
    } else if (viewId === 'library-page') {
        renderLibraryViews();
    }
}

/* ==========================================================================
   5. HOME MANAGEMENT ACTIONS DATA PARSING PIPELINE
   ========================================================================== */
async function loadHomepagePayload() {
    injectSkeletons('trending-grid');
    injectSkeletons('popular-grid');
    injectSkeletons('airing-grid');

    // Hero Spotlight Core Data Mapping logic
    const topData = await apiRequest('/top/anime?limit=1&filter=bypopularity');
    if (topData && topData.data.length > 0) {
        const hero = topData.data[0];
        const heroContainer = document.getElementById('hero-container');
        heroContainer.style.backgroundImage = `url('${hero.images.jpg.large_image_url}')`;
        heroContainer.innerHTML = `
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h2>${hero.title}</h2>
                <p>${hero.synopsis || 'No outline records provided for this feature component.'}</p>
                <button class="btn btn-primary" id="hero-btn-action"><i class="fa-solid fa-circle-info"></i> View Details</button>
            </div>
        `;
        document.getElementById('hero-btn-action').onclick = () => renderDetailsPage(hero.mal_id);
    }

    populateGrid('/top/anime?limit=6&filter=airing', 'trending-grid');
    populateGrid('/top/anime?limit=6&filter=bypopularity', 'popular-grid');
    populateGrid('/anime?limit=6&status=airing&order_by=popularity', 'airing-grid');
}

async function populateGrid(endpoint, gridId) {
    const data = await apiRequest(endpoint);
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    if (data && data.data) {
        data.data.forEach(anime => grid.appendChild(buildAnimeCard(anime)));
        dispatchLazyLoading();
    } else {
        grid.innerHTML = `<p class="error-msg" style="padding:20px;">Failed to gather stream array assets cleanly.</p>`;
    }
}

/* ==========================================================================
   6. ANIME DETAIL VIEW INTERFACE GENERATION LOGIC
   ========================================================================== */
async function renderDetailsPage(malId) {
    routeTo('details-page');
    
    const response = await apiRequest(`/anime/${malId}`);
    if (!response || !response.data) return;
    
    const anime = response.data;
    saveToHistory(anime); // Store in Recently Viewed local timeline stack

    // Structural DOM Bindings
    document.getElementById('detail-backdrop').style.backgroundImage = `url('${anime.images.jpg.large_image_url}')`;
    document.getElementById('detail-poster').src = anime.images.jpg.large_image_url;
    document.getElementById('detail-title').textContent = anime.title;
    document.getElementById('detail-score').innerHTML = `<i class="fa-solid fa-star"></i> ${anime.score || 'N/A'}`;
    document.getElementById('detail-format').textContent = anime.type || 'TV';
    document.getElementById('detail-status').textContent = anime.status || 'Unknown';
    document.getElementById('detail-synopsis').textContent = anime.synopsis || 'No structural outline descriptors provided.';
    
    document.getElementById('info-studios').textContent = anime.studios.map(s => s.name).join(', ') || 'N/A';
    document.getElementById('info-episodes').textContent = anime.episodes || 'N/A';
    document.getElementById('info-released').textContent = anime.aired.string || 'N/A';
    document.getElementById('info-season').textContent = `${anime.season || ''} ${anime.year || ''}`.trim() || 'N/A';

    // Build Category Chips Tags Array Items
    const genresZone = document.getElementById('detail-genres');
    genresZone.innerHTML = '';
    anime.genres.forEach(g => {
        const chip = document.createElement('span');
        chip.className = 'badge';
        chip.textContent = g.name;
        genresZone.appendChild(chip);
    });

    // Populate Legal Stream Route Gateways
    const streamsContainer = document.getElementById('detail-streams');
    streamsContainer.innerHTML = '';
    
    // Inject legal route mappings dynamically based on fallback links
    const simulatedStreams = [
        { name: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}` },
        { name: 'Netflix', url: `https://www.netflix.com/search?q=${encodeURIComponent(anime.title)}` },
        { name: 'Hulu', url: `https://www.hulu.com/search?q=${encodeURIComponent(anime.title)}` }
    ];

    simulatedStreams.forEach(prov => {
        const linkCard = document.createElement('a');
        linkCard.href = prov.url;
        linkCard.target = '_blank';
        linkCard.className = 'stream-link-card';
        linkCard.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> ${prov.name}`;
        streams
