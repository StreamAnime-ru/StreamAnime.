/**
 * AniStream - Native Modern Core Application Engine
 */

// Fallback high-fidelity local content payload configuration to protect execution state against API rate limits
const FALLBACK_ANIME_DATA = [
    { id: 1, title: "Chainsaw Man", type: "TV", episodes: 12, rating: "8.6", genres: ["Action", "Fantasy"], image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500", banner: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200", status: "Finished Airing", studio: "MAPPA", released: "2022", synopsis: "Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. However, this is a far cry from reality, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts.", streamLink: "https://www.crunchyroll.com" },
    { id: 2, title: "Demon Slayer: Kimetsu no Yaiba", type: "TV", episodes: 26, rating: "8.7", genres: ["Action", "Fantasy"], image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500", banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200", status: "Finished Airing", studio: "ufotable", released: "2019", synopsis: "Tanjirou Kamado branches out to protect and provide for his family. Everything changes when his family is attacked and slaughtered by demons.", streamLink: "https://www.netflix.com" },
    { id: 3, title: "Jujutsu Kaisen", type: "TV", episodes: 24, rating: "8.6", genres: ["Action", "Drama"], image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500", banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200", status: "Finished Airing", studio: "MAPPA", released: "2020", synopsis: "Idly indulging in baseless paranormal activities with the Occult Club, high schooler Yuuji Itadori spends his days at either the clubroom or the hospital.", streamLink: "https://www.crunchyroll.com" },
    { id: 4, title: "Attack on Titan", type: "TV", episodes: 25, rating: "9.1", genres: ["Action", "Drama"], image: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=500", banner: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200", status: "Finished Airing", studio: "WIT Studio", released: "2013", synopsis: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called titans, forcing humans to hide behind enormous concentric walls.", streamLink: "https://www.crunchyroll.com" },
    { id: 5, title: "Cyberpunk: Edgerunners", type: "TV", episodes: 10, rating: "8.6", genres: ["Action", "Sci-Fi"], image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500", banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200", status: "Finished Airing", studio: "Trigger", released: "2022", synopsis: "A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner.", streamLink: "https://www.netflix.com" }
];

// App State Engine
const AppState = {
    currentLibraryTab: 'watchlist',
    currentPage: 1,
    currentAnimeList: [...FALLBACK_ANIME_DATA],
    history: JSON.parse(localStorage.getItem('ani_history')) || [],
    watchlist: JSON.parse(localStorage.getItem('ani_watchlist')) || [],
    favorites: JSON.parse(localStorage.getItem('ani_favorites')) || []
};

// Global DOM Selectors
const documentElements = {
    navLinks: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page-section'),
    burger: document.getElementById('burger'),
    navMenu: document.getElementById('nav-links'),
    searchInput: document.getElementById('search-input'),
    suggestionsBox: document.getElementById('suggestions'),
    heroSlider: document.getElementById('hero-slider'),
    trendingGrid: document.getElementById('trending-grid'),
    popularGrid: document.getElementById('popular-grid'),
    recentSection: document.getElementById('recent-section'),
    recentGrid: document.getElementById('recent-grid'),
    browseGrid: document.getElementById('browse-grid'),
    libraryGrid: document.getElementById('library-grid'),
    detailsContainer: document.getElementById('details-container'),
    applyFiltersBtn: document.getElementById('apply-filters-btn'),
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    pageNumberIndicator: document.getElementById('page-number'),
    logo: document.getElementById('logo')
};

// --- Initialization Execution Loop ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigationControl();
    loadApplicationHomeData();
    initSearchEngine();
    initFilterSystem();
    initLibrarySubsystem();
});

// --- Navigation Management Engine ---
function initNavigationControl() {
    documentElements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-target');
            switchPage(targetPage);
            
            documentElements.navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            if(documentElements.navMenu.classList.contains('nav-active')) {
                toggleMobileMenu();
            }
        });
    });

    documentElements.burger.addEventListener('click', toggleMobileMenu);
    documentElements.logo.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage('home-page');
        documentElements.navLinks.forEach(l => l.classList.remove('active'));
        documentElements.navLinks[0].classList.add('active');
    });
}

function switchPage(pageId) {
    documentElements.pages.forEach(page => {
        page.classList.remove('active');
        if(page.id === pageId) page.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if(pageId === 'browse-page') executeSearchAndFilter();
    if(pageId === 'library-page') renderLibraryContent();
    if(pageId === 'home-page') renderRecentGrid();
}

function toggleMobileMenu() {
    documentElements.navMenu.classList.toggle('nav-active');
    documentElements.burger.classList.toggle('toggle');
}

// --- High Performance Data Fetching Architecture ---
async function loadApplicationHomeData() {
    try {
        // Asynchronous Request Strategy matching Modern Consumer Hub Systems API Structure (Consumet / Jikan Core API mapping)
        const response = await fetch('https://api.jikan.moe/v4/top/anime?limit=6');
        if (!response.ok) throw new Error('API Rate limits exceeded. Triggering ultra-fast internal data engine fallback.');
        
        const data = await response.json();
        const structuralData = data.data.map(item => ({
            id: item.mal_id,
            title: item.title_english || item.title,
            type: item.type,
            episodes: item.episodes || '?',
            rating: item.score || 'N/A',
            genres: item.genres.map(g => g.name),
            image: item.images.jpg.large_image_url,
            banner: item.images.jpg.large_image_url, 
            status: item.status,
            studio: item.studios[0]?.name || 'Unknown Studio',
            released: item.year || 'N/A',
            synopsis: item.synopsis || 'No summary available.',
            streamLink: 'https://crunchyroll.com'
        }));
        
        AppState.currentAnimeList = structuralData;
        renderHomeLayout(structuralData);
    } catch (error) {
        console.warn(error.message);
        // Instant Fallback Architecture execution avoiding runtime interface breakage
        renderHomeLayout(AppState.currentAnimeList);
    }
}

function renderHomeLayout(animeArray) {
    // Dynamic Hero slider building
    const premiumShowcase = animeArray[0];
    documentElements.heroSlider.innerHTML = `
        <div class="hero-slide" style="background-image: url('${premiumShowcase.banner}')">
            <div class="hero-content">
                <h1>${premiumShowcase.title}</h1>
                <p>${premiumShowcase.synopsis}</p>
                <button class="btn-primary" onclick="loadDetailedView('${premiumShowcase.id}')"><i class="fa-solid fa-circle-info"></i> More Details</button>
            </div>
        </div>
    `;

    // Grids generation logic
    buildAnimeGrid(animeArray, documentElements.trendingGrid);
    buildAnimeGrid([...animeArray].reverse(), documentElements.popularGrid);
    renderRecentGrid();
}

function buildAnimeGrid(dataList, outputElement) {
    outputElement.innerHTML = '';
    if(dataList.length === 0) {
        outputElement.innerHTML = `<p class="muted-text-notice">No items in this directory module.</p>`;
        return;
    }
    dataList.forEach(anime => {
        const structuralCard = document.createElement('div');
        structuralCard.className = 'anime-card';
        structuralCard.addEventListener('click', () => loadDetailedView(anime.id));
        
        // Comprehensive optimization layout with native image lazy-loading parameters
        structuralCard.innerHTML = `
            <div class="card-img-container">
                <span class="card-badge">${anime.type || 'Series'}</span>
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
            </div>
            <div class="card-info">
                <h3>${anime.title}</h3>
                <div class="card-meta">
                    <span><i class="fa-solid fa-star" style="color: gold;"></i> ${anime.rating}</span>
                    <span>${anime.episodes} Eps</span>
                </div>
            </div>
        `;
        outputElement.appendChild(structuralCard);
    });
}

function renderRecentGrid() {
    if(AppState.history.length === 0) {
        documentElements.recentSection.classList.add('hidden');
    } else {
        documentElements.recentSection.classList.remove('hidden');
        buildAnimeGrid(AppState.history, documentElements.recentGrid);
    }
}

// --- High Performance Search Engine Infrastructure ---
function initSearchEngine() {
    let internalDebouncer;
    documentElements.searchInput.addEventListener('input', (e) => {
        clearTimeout(internalDebouncer);
        const searchQuery = e.target.value.trim();
        
        if(searchQuery.length < 2) {
            documentElements.suggestionsBox.style.display = 'none';
            return;
        }

        internalDebouncer = setTimeout(() => {
            const filteredResults = AppState.currentAnimeList.filter(a => 
                a.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            renderSearchSuggestions(filteredResults);
        }, 250);
    });

    // Close search box seamlessly on body click event
    document.addEventListener('click', (e) => {
        if(!documentElements.searchInput.contains(e.target)) {
            documentElements.suggestionsBox.style.display = 'none';
        }
    });
}

function renderSearchSuggestions(matchedItems) {
    if(matchedItems.length === 0) {
        documentElements.suggestionsBox.style.display = 'none';
        return;
    }
    
    documentElements.suggestionsBox.innerHTML = '';
    matchedItems.slice(0, 5).forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'suggestion-item';
        itemRow.addEventListener('click', () => {
            loadDetailedView(item.id);
            documentElements.suggestionsBox.style.display = 'none';
            documentElements.searchInput.value = '';
        });
        
        itemRow.innerHTML = `
            <img src="${item.image}">
            <div class="suggestion-info">
                <h4>${item.title}</h4>
                <p>${item.type} • Score: ${item.rating}</p>
            </div>
        `;
        documentElements.suggestionsBox.appendChild(itemRow);
    });
    documentElements.suggestionsBox.style.display = 'block';
}

// --- Filtering & Sorting Complex Logic Module ---
function initFilterSystem() {
    documentElements.applyFiltersBtn.addEventListener('click', () => {
        AppState.currentPage = 1;
        executeSearchAndFilter();
    });
    
    documentElements.prevPageBtn.addEventListener('click', () => {
        if(AppState.currentPage > 1) {
            AppState.currentPage--;
            executeSearchAndFilter();
        }
    });

    documentElements.nextPageBtn.addEventListener('click', () => {
        AppState.currentPage++;
        executeSearchAndFilter();
    });
}

function executeSearchAndFilter() {
    const selectedGenre = document.getElementById('filter-genre').value.toLowerCase();
    const selectedFormat = document.getElementById('filter-format').value.toLowerCase();
    const selectedSort = document.getElementById('filter-sort').value;

    let computedList = [...AppState.currentAnimeList];

    // Evaluate Structural Criteria filters
    if(selectedGenre) {
        computedList = computedList.filter(a => a.genres.some(g => g.toLowerCase() === selectedGenre));
    }
    if(selectedFormat) {
        computedList = computedList.filter(a => a.type.toLowerCase() === selectedFormat);
    }

    // Dynamic sorting implementation array manipulation
    if(selectedSort === 'score') {
        computedList.sort((x, y) => parseFloat(y.rating) - parseFloat(x.rating));
    } else {
        // Fallback or basic default sorting by dynamic list structural ordering ID mapping
        computedList.sort((x, y) => y.id - x.id);
    }

    // High performance native array slicing pagination emulator
    const entriesPerPage = 4;
    const computedStartIndex = (AppState.currentPage - 1) * entriesPerPage;
    const computedPaginatedSublist = computedList.slice(computedStartIndex, computedStartIndex + entriesPerPage);

    documentElements.pageNumberIndicator.innerText = `Page ${AppState.currentPage}`;
    documentElements.prevPageBtn.disabled = AppState.currentPage === 1;
    documentElements.nextPageBtn.disabled = computedStartIndex + entriesPerPage >= computedList.length;

    buildAnimeGrid(computedPaginatedSublist, documentElements.browseGrid);
}

// --- Detail Presentation Generation Module ---
function loadDetailedView(animeId) {
    const targetAnime = AppState.currentAnimeList.find(a => String(a.id) === String(animeId));
    if(!targetAnime) return;

    // Track state modification inside application tracking matrix history (Continue Watching / Recent stack)
    if(!AppState.history.some(a => String(a.id) === String(targetAnime.id))) {
        AppState.history.unshift(targetAnime);
        if(AppState.history.length > 6) AppState.history.pop();
        localStorage.setItem('ani_history', JSON.stringify(AppState.history));
    }

    switchPage('details-page');

    // Dynamic boolean tracking metrics checking for list state
    const isWatchlisted = AppState.watchlist.some(a => String(a.id) === String(targetAnime.id));
    const isFavorited = AppState.favorites.some(a => String(a.id) === String(targetAnime.id));

    documentElements.detailsContainer.innerHTML = `
        <div class="detail-banner" style="background-image: url('${targetAnime.banner}')"></div>
        <div class="detail-wrapper">
            <div class="detail-poster-column">
                <img src="${targetAnime.image}" class="detail-poster" alt="${targetAnime.title}">
                <div class="action-buttons">
                    <a href="${targetAnime.streamLink}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="text-align:center; justify-content:center;"><i class="fa-solid fa-play"></i> Watch Stream Now</a>
                    <button class="btn-secondary ${isWatchlisted ? 'active' : ''}" id="toggle-watchlist-btn">
                        <i class="fa-solid ${isWatchlisted ? 'fa-check' : 'fa-plus'}"></i> Watchlist
                    </button>
                    <button class="btn-secondary ${isFavorited ? 'active' : ''}" id="toggle-favorite-btn">
                        <i class="fa-solid fa-heart" style="${isFavorited ? 'color: var(--accent-color)' : ''}"></i> Favorite
                    </button>
                </div>
            </div>
            <div class="detail-info-column">
                <h1 class="detail-title">${targetAnime.title}</h1>
                <div class="detail-meta-row">
                    <span>${targetAnime.type}</span>
                    <span><i class="fa-solid fa-star" style="color: gold;"></i> ${targetAnime.rating}</span>
                    <span>${targetAnime.released}</span>
                    <span>Status: ${targetAnime.status}</span>
                </div>
                <p class="detail-synopsis">${targetAnime.synopsis}</p>
                <div class="info-grid">
                    <div class="info-item"><h5>Studio</h5><p>${targetAnime.studio}</p></div>
                    <div class="info-item"><h5>Episodes</h5><p>${targetAnime.episodes}</p></div>
                    <div class="info-item"><h5>Genres</h5><p>${targetAnime.genres.join(', ')}</p></div>
                </div>
            </div>
        </div>
    `;

    // Functional bindings configuration for inner details engine buttons
    document.getElementById('toggle-watchlist-btn').addEventListener('click', () => toggleLibraryItem('watchlist', targetAnime));
    document.getElementById('toggle-favorite-btn').addEventListener('click', () => toggleLibraryItem('favorites', targetAnime));
    document.getElementById('back-to-home').onclick = () => switchPage('home-page');
}

// --- Local Storage Synchronization Layer (Library) ---
function initLibrarySubsystem() {
    document.querySelectorAll('.lib-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            AppState.currentLibraryTab = e.target.getAttribute('data-lib');
            renderLibraryContent();
        });
    });
}

function toggleLibraryItem(storageKey, animeObject) {
    let internalArray = AppState[storageKey];
    const itemIndex = internalArray.findIndex(a => String(a.id) === String(animeObject.id));

    if(itemIndex > -1) {
        internalArray.splice(itemIndex, 1);
    } else {
        internalArray.push(animeObject);
    }

    AppState[storageKey] = internalArray;
    localStorage.setItem(`ani_${storageKey}`, JSON.stringify(internalArray));
    loadDetailedView(animeObject.id); // Triggers visual re-render loop
}

function renderLibraryContent() {
    const targetingSourceData = AppState[AppState.currentLibraryTab];
    buildAnimeGrid(targetingSourceData, documentElements.libraryGrid);
}
