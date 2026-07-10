// --- Mock Database Configuration ---
const ANIME_DATA = [
    {
        id: 1,
        title: "Chrono Bound: Zero",
        type: "Ongoing Series",
        genres: ["Action", "Sci-Fi", "Drama"],
        rating: 8.9,
        episodes: 24,
        year: 2026,
        studio: "Nexus Animation",
        description: "In a world where timeline distortions fracture daily reality, a brilliant engineer devises a method to stitch history back together, but tracking paradoxical shifts unearths cosmic consequences.",
        image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500",
        isTrending: true,
        isPopular: true
    },
    {
        id: 2,
        title: "Cyber City Edge",
        type: "Ongoing Series",
        genres: ["Sci-Fi", "Action"],
        rating: 8.4,
        episodes: 12,
        year: 2025,
        studio: "Studio Trigger-Pulse",
        description: "Navigating deep neon underbellies, cybernetically augmented mercenaries fight corporate conglomerates controlling humanity's consciousness streams.",
        image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500",
        isTrending: true,
        isPopular: false
    },
    {
        id: 3,
        title: "Whisper of the Forest",
        type: "Movies",
        genres: ["Fantasy", "Slice of Life", "Adventure"],
        rating: 9.1,
        episodes: 1,
        year: 2026,
        studio: "Ghibli-inspired Arc",
        description: "An enchanting feature film exploring local spirits protecting a sacred mountain woodland valley from external urban industrial expansion.",
        image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500",
        isTrending: false,
        isPopular: true
    },
    {
        id: 4,
        title: "Highschool Spike!",
        type: "Ongoing Series",
        genres: ["Sports", "Comedy"],
        rating: 7.9,
        episodes: 25,
        year: 2025,
        studio: "Production I.G. Level",
        description: "An underdog high school volleyball squad rallies through extreme internal rivalries to capture the elusive national tournament crown.",
        image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500",
        isTrending: false,
        isPopular: true
    },
    {
        id: 5,
        title: "Shadow Realm Protocol",
        type: "Ongoing Series",
        genres: ["Horror", "Fantasy", "Action"],
        rating: 8.6,
        episodes: 13,
        year: 2026,
        studio: "Mappa Grid",
        description: "When dimensional seals break open during a midnight eclipse, secretive dark sorcerers deploy forbidden techniques against nocturnal demons.",
        image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500",
        isTrending: true,
        isPopular: true
    },
    {
        id: 6,
        title: "Love, Equations & Coffee",
        type: "Ongoing Series",
        genres: ["Romance", "Comedy", "Slice of Life"],
        rating: 8.2,
        episodes: 12,
        year: 2026,
        studio: "Kyoto Prism",
        description: "Two analytical university prodigies attempting to mathematically map romantic attraction find their metrics thoroughly upended working at a local cafe shop.",
        image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500",
        isTrending: false,
        isPopular: false
    }
];

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance", "Horror", "Sci-Fi", "Slice of Life", "Sports"];

// --- App State Management ---
let currentAnime = null;
let currentEpisode = 1;

// --- Initialize DOM Elements ---
document.addEventListener("DOMContentLoaded", () => {
    buildGenreMenu();
    renderMainGrids(ANIME_DATA);
    setupHero(ANIME_DATA.find(a => a.id === 1));
    setupNavigation();
    setupSearch();
    setupVideoPlayer();
    updateUserLists();

    // Fade out loading screen
    setTimeout(() => {
        const loader = document.getElementById("loading-screen");
        if(loader) loader.style.opacity = "0";
        setTimeout(() => loader?.remove(), 500);
    }, 600);
});

// --- Dynamic Component Builders ---
function buildGenreMenu() {
    const dropdown = document.getElementById("genre-dropdown");
    dropdown.innerHTML = GENRES.map(genre => `<a href="#" class="genre-item" data-genre="${genre}">${genre}</a>`).join('');
    
    dropdown.querySelectorAll('.genre-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedGenre = e.target.dataset.genre;
            const filtered = ANIME_DATA.filter(anime => anime.genres.includes(selectedGenre));
            renderMainGrids(filtered, `Genre: ${selectedGenre}`);
            document.getElementById("popular-section-anchor").scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function setupHero(anime) {
    const hero = document.getElementById("hero-banner");
    if (!anime || !hero) return;
    hero.style.backgroundImage = `url('${anime.image}')`;
    hero.innerHTML = `
        <div class="hero-content">
            <h1 class="hero-title">${anime.title}</h1>
            <div class="hero-meta">
                <span><i class="fas fa-star"></i> ${anime.rating}</span>
                <span>${anime.type}</span>
                <span>${anime.year}</span>
            </div>
            <p class="hero-desc">${anime.description.substring(0, 160)}...</p>
            <button class="btn btn-primary watch-now-btn" data-id="${anime.id}">
                <i class="fas fa-play"></i> Watch Now
            </button>
        </div>
    `;
    hero.querySelector('.watch-now-btn').addEventListener('click', () => launchPlayer(anime.id));
}

function renderMainGrids(data, customTitle = null) {
    const trendingGrid = document.getElementById("trending-grid");
    const popularGrid = document.getElementById("popular-grid");
    const moviesGrid = document.getElementById("movies-grid");

    if(customTitle) {
        document.getElementById("popular-section-anchor").querySelector('.section-title').innerHTML = `<i class="fas fa-filter text-cyan"></i> ${customTitle}`;
    }

    trendingGrid.innerHTML = data.filter(a => a.isTrending).map(a => createCard(a)).join('');
    popularGrid.innerHTML = data.filter(a => a.isPopular || customTitle).map(a => createCard(a)).join('');
    moviesGrid.innerHTML = data.filter(a => a.type === "Movies").map(a => createCard(a)).join('');

    attachCardListeners();
    lazyLoadImages();
}

function createCard(anime) {
    return `
        <div class="anime-card" data-id="${anime.id}">
            <div class="card-img-box">
                <img data-src="${anime.image}" alt="${anime.title}" class="lazy-thumb">
                <span class="card-badge">${anime.episodes > 1 ? `EP ${anime.episodes}` : 'Movie'}</span>
                <span class="card-rating"><i class="fas fa-star"></i> ${anime.rating}</span>
                <div class="card-hover-overlay">
                    <button class="btn btn-primary"><i class="fas fa-play"></i></button>
                    <p>${anime.description.substring(0, 70)}...</p>
                </div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${anime.title}</h3>
                <span class="card-genres">${anime.genres.slice(0, 2).join(' / ')}</span>
            </div>
        </div>
    `;
}

function attachCardListeners() {
    document.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', () => launchPlayer(parseInt(card.dataset.id)));
    });
}

// --- Image Lazy Loading Implementation ---
function lazyLoadImages() {
    const images = document.querySelectorAll('img.lazy-thumb');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        images.forEach(img => obs.observe(img));
    } else {
        images.forEach(img => { img.src = img.dataset.src; img.classList.add('loaded'); });
    }
}

// --- App View Engine & Navigation ---
function setupNavigation() {
    const burger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            if(e.currentTarget.parentElement.classList.contains('dropdown')) return;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            link.classList.add('active');
            
            burger.classList.remove('active');
            navLinks.classList.remove('active');

            switchView('home-view');
            renderMainGrids(ANIME_DATA);
        });
    });

    document.getElementById("nav-logo").addEventListener('click', () => {
        switchView('home-view');
        renderMainGrids(ANIME_DATA);
    });

    document.getElementById("back-to-home-btn").addEventListener('click', () => switchView('home-view'));
}

function switchView(viewId) {
    document.querySelectorAll('.view-page').forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Live Search ---
function setupSearch() {
    const input = document.getElementById("search-input");
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if(query === "") {
            renderMainGrids(ANIME_DATA);
            return;
        }
        const filtered = ANIME_DATA.filter(anime => 
            anime.title.toLowerCase().includes(query) || 
            anime.genres.some(g => g.toLowerCase().includes(query))
        );
        switchView('home-view');
        renderMainGrids(filtered, `Search Results for "${query}"`);
    });
}

// --- Favorites & Continue Watching Engine (Local Storage) ---
function updateUserLists() {
    const favs = JSON.parse(localStorage.getItem('anime_favorites')) || [];
    const continues = JSON.parse(localStorage.getItem('anime_continue')) || [];

    // Render Favorites Section
    const favSection = document.getElementById("favorites-section");
    const favGrid = document.getElementById("favorites-grid");
    if(favs.length > 0) {
        favSection.classList.remove('hidden');
        favGrid.innerHTML = ANIME_DATA.filter(a => favs.includes(a.id)).map(a => createCard(a)).join('');
    } else { favSection.classList.add('hidden'); }

    // Render Continue Section
    const contSection = document.getElementById("continue-watching-section");
    const contGrid = document.getElementById("continue-watching-grid");
    if(continues.length > 0) {
        contSection.classList.remove('hidden');
        contGrid.innerHTML = continues.map(c => {
            const anime = ANIME_DATA.find(a => a.id === c.id);
            if(!anime) return '';
            return `
                <div class="anime-card" data-id="${anime.id}">
                    <div class="card-img-box">
                        <img src="${anime.image}" alt="${anime.title}" class="loaded">
                        <span class="card-badge">Ep ${c.episode}</span>
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${anime.title}</h3>
                        <span class="card-genres" style="color: var(--accent-cyan)">Resuming...</span>
                    </div>
                </div>
            `;
        }).join('');
    } else { contSection.classList.add('hidden'); }

    attachCardListeners();
}

function saveContinueWatching(id, episode) {
    let list = JSON.parse(localStorage.getItem('anime_continue')) || [];
    list = list.filter(item => item.id !== id);
    list.unshift({ id, episode });
    if(list.length > 4) list.pop(); // Keep only last 4 records
    localStorage.setItem('anime_continue', JSON.stringify(list));
    updateUserLists();
}

// --- Player Setup & Streaming Implementation ---
function launchPlayer(animeId) {
    const anime = ANIME_DATA.find(a => a.id === animeId);
    if (!anime) return;
    currentAnime = anime;
    switchView('player-view');

    // UI Field Updates
    document.getElementById("player-title").innerText = anime.title;
    document.getElementById("player-rating").innerHTML = `<i class="fas fa-star text-cyan"></i> ${anime.rating}`;
    document.getElementById("player-year").innerText = anime.year;
    document.getElementById("player-studio").innerText = anime.studio;
    document.getElementById("player-description").innerText = anime.description;
    document.getElementById("player-genres").innerHTML = anime.genres.map(g => `<span class="genre-tag">${g}</span>`).join('');

    // Handle Favorite State Toggle UI
    const favs = JSON.parse(localStorage.getItem('anime_favorites')) || [];
    const favBtn = document.getElementById("favorite-toggle-btn");
    if(favs.includes(anime.id)) {
        favBtn.classList.add('active');
        favBtn.innerHTML = `<i class="fas fa-heart"></i> Favorited`;
    } else {
        favBtn.classList.remove('active');
        favBtn.innerHTML = `<i class="far fa-heart"></i> Add to Favorites`;
    }

    // Build Episode UI Sidebar Elements
    const epContainer = document.getElementById("episode-list-container");
    epContainer.innerHTML = "";
    const continues = JSON.parse(localStorage.getItem('anime_continue')) || [];
    const savedEp = continues.find(c => c.id === anime.id)?.episode || 1;
    
    for(let i = 1; i <= anime.episodes; i++) {
        const epItem = document.createElement('div');
        epItem.className = `ep-item ${i === savedEp ? 'active' : ''}`;
        epItem.innerHTML = `<span>Episode ${i}</span><span class="text-muted">Sub/Dub</span>`;
        epItem.addEventListener('click', () => changeEpisode(i));
        epContainer.appendChild(epItem);
    }

    // Related Grid Builder logic
    const relatedGrid = document.getElementById("related-grid");
    const relatedData = ANIME_DATA.filter(a => a.id !== anime.id && a.genres.some(g => anime.genres.includes(g)));
    relatedGrid.innerHTML = relatedData.slice(0, 4).map(a => createCard(a)).join('');
    
    changeEpisode(savedEp);
}

function changeEpisode(epNum) {
    currentEpisode = epNum;
    const items = document.querySelectorAll('.ep-item');
    items.forEach((item, idx) => {
        if(idx === epNum - 1) item.classList.add('active');
        else item.classList.remove('active');
    });

    const video = document.getElementById("main-video");
    video.currentTime = 0;
    video.play().catch(() => {}); // catch blocks handle autoplay policy block scenarios cleanly
    saveContinueWatching(currentAnime.id, epNum);
}

// --- Custom Video Player Control Engine ---
function setupVideoPlayer() {
    const video = document.getElementById("main-video");
    const wrapper = document.getElementById("video-wrapper");
    const playPauseBtn = document.getElementById("play-pause");
    const skipBackBtn = document.getElementById("skip-back");
    const skipForwardBtn = document.getElementById("skip-forward");
    const volIcon = document.getElementById("volume-icon");
    const volSlider = document.getElementById("volume-slider");
    const timeDisplay = document.querySelector(".video-time");
    const speedSelect = document.getElementById("playback-speed");
    const pipBtn = document.getElementById("pip-btn");
    const fullBtn = document.getElementById("fullscreen-btn");
    const progArea = document.querySelector(".progress-area");
    const progBar = document.querySelector(".progress-bar");

    // Play/Pause Action handling
    const togglePlay = () => {
        if(video.paused) {
            video.play();
            playPauseBtn.innerHTML = `<i class="fas fa-pause"></i>`;
        } else {
            video.pause();
            playPauseBtn.innerHTML = `<i class="fas fa-play"></i>`;
        }
    };
    playPauseBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);

    // Skip Buttons
    skipBackBtn.addEventListener('click', () => video.currentTime -= 10);
    skipForwardBtn.addEventListener('click', () => video.currentTime += 10);

    // Volume updates Engine
    volSlider.addEventListener('input', (e) => {
        video.value = e.target.value;
        video.volume = video.value;
        if(video.volume === 0) volIcon.innerHTML = `<i class="fas fa-volume-mute"></i>`;
        else if(video.volume < 0.5) volIcon.innerHTML = `<i class="fas fa-volume-down"></i>`;
        else volIcon.innerHTML = `<i class="fas fa-volume-up"></i>`;
    });

    volIcon.addEventListener('click', () => {
        if(video.volume > 0) {
            video.volume = 0; volSlider.value = 0;
            volIcon.innerHTML = `<i class="fas fa-volume-mute"></i>`;
        } else {
            video.volume = 1; volSlider.value = 1;
            volIcon.innerHTML = `<i class="fas fa-volume-up"></i>`;
        }
    });

    // Timing Format Processing utilities
    const formatTime = time => {
        let min = Math.floor(time / 60);
        let sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    video.addEventListener('timeupdate', (e) => {
        const { currentTime, duration } = e.target;
        if(isNaN(duration)) return;
        const progressPercent = (currentTime / duration) * 100;
        progBar.style.width = `${progressPercent}%`;
        timeDisplay.innerText = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    });

    // Custom Progress Bar seeking algorithm mapping
    progArea.addEventListener('click', (e) => {
        const coordWidth = progArea.clientWidth;
        const clickOffsetX = e.offsetX;
        video.currentTime = (clickOffsetX / coordWidth) * video.duration;
    });

    // Speed Selector configuration
    speedSelect.addEventListener('change', (e) => video.playbackRate = parseFloat(e.target.value));

    // Pic In Pic execution structure
    if (!document.pictureInPictureEnabled) pipBtn.style.display = 'none';
    pipBtn.addEventListener('click', () => video.requestPictureInPicture());

    // Fullscreen mechanics setup logic
    fullBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(() => {});
            fullBtn.innerHTML = `<i class="fas fa-compress"></i>`;
        } else {
            document.exitFullscreen();
            fullBtn.innerHTML = `<i class="fas fa-expand"></i>`;
        }
    });

    // Auto next sequence tracker matching bounds
    video.addEventListener('ended', () => {
        if (currentAnime && currentEpisode < currentAnime.episodes) {
            changeEpisode(currentEpisode + 1);
        }
    });

    // Global Interactive Keybind Listener assignments mapping logic specifications
    document.addEventListener('keydown', (e) => {
        const activeView = document.getElementById("player-view").classList.contains('hidden');
        if(activeView || document.activeElement.tagName === "INPUT") return;

        if(e.code === "Space") { e.preventDefault(); togglePlay(); }
        else if(e.code === "ArrowRight") video.currentTime += 5;
        else if(e.code === "ArrowLeft") video.currentTime -= 5;
        else if(e.code === "KeyF") { e.preventDefault(); fullBtn.click(); }
    });

    // Local Storage Favorite Toggle Switch mapping operations logic block configurations execution
    document.getElementById("favorite-toggle-btn").addEventListener('click', (e) => {
        let favs = JSON.parse(localStorage.getItem('anime_favorites')) || [];
        if(favs.includes(currentAnime.id)) {
            favs = favs.filter(id => id !== currentAnime.id);
            e.target.classList.remove('active');
            e.target.innerHTML = `<i class="far fa-heart"></i> Add to Favorites`;
        } else {
            favs.push(currentAnime.id);
            e.target.classList.add('active');
            e.target.innerHTML = `<i class="fas fa-heart"></i> Favorited`;
        }
        localStorage.setItem('anime_favorites', JSON.stringify(favs));
        updateUserLists();
    });
}
const JIKAN_API_BASE = 'https://api.jikan.moe/v4';

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const trendingGrid = document.getElementById('trending-grid');
const popularGrid = document.getElementById('popular-grid');
const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');
const videoPlayerContainer = document.getElementById('video-player-container');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeData('/top/anime?filter=airing&limit=6', trendingGrid);
    fetchAnimeData('/top/anime?filter=bypopular&limit=6', popularGrid);
    fetchAnimeData('/top/anime?type=movie&limit=6', moviesGrid);
    setupSearch();
    hideLoading();
});

// Fetch function to build cards based on template grid layouts
async function fetchAnimeData(endpoint, gridElement) {
    try {
        const response = await fetch(`${JIKAN_API_BASE}${endpoint}`);
        const result = await response.json();
        if (result.data) {
            renderGrid(result.data, gridElement);
        }
    } catch (error) {
        console.error("Error fetching data from Jikan API:", error);
    }
}

// Grid Renderer
function renderGrid(animeList, gridElement) {
    gridElement.innerHTML = '';
    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card'; // Matches standard styles
        card.innerHTML = `
            <div class="card-img-wrap" style="position:relative; cursor:pointer;">
                <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}" style="width:100%; border-radius:8px;">
                <span class="card-rating" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.8); padding:2px 6px; border-radius:4px; color:#00f0ff;">
                    ★ ${anime.score || 'N/A'}
                </span>
            </div>
            <h4 style="margin-top:8px; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${anime.title}</h4>
        `;
        card.addEventListener('click', () => loadAnimeToPlayer(anime));
        gridElement.appendChild(card);
    });
}

// Load Selected Content to Player Template
function loadAnimeToPlayer(anime) {
    homeView.classList.add('hidden');
    playerView.classList.remove('hidden');
    
    document.getElementById('player-title').innerText = anime.title;
    document.getElementById('player-rating').innerHTML = `<i class="fas fa-star text-cyan"></i> ${anime.score || 'N/A'}`;
    document.getElementById('player-year').innerText = anime.year || 'N/A';
    document.getElementById('player-description').innerText = anime.synopsis || 'No description available.';
    document.getElementById('player-studio').innerText = anime.studios?.[0]?.name || 'Unknown Studio';
    
    // Setup genres
    const genreContainer = document.getElementById('player-genres');
    genreContainer.innerHTML = '';
    anime.genres.forEach(g => {
        const span = document.createElement('span');
        span.className = 'genre-tag';
        span.innerText = g.name;
        genreContainer.appendChild(span);
    });

    // Handle Video Window (embed official trailers when available)
    if (anime.trailer && anime.trailer.embed_url) {
        videoPlayerContainer.innerHTML = `<iframe src="${anime.trailer.embed_url}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
    } else {
        videoPlayerContainer.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100%; background:#111; flex-direction:column;">
                <i class="fas fa-exclamation-circle" style="size: 24px; margin-bottom:10px;"></i>
                <p>Official stream source unavailable.</p>
            </div>`;
    }
}

// Navigation Back Control
document.getElementById('back-to-home-btn').addEventListener('click', () => {
    playerView.classList.add('hidden');
    homeView.classList.remove('hidden');
    videoPlayerContainer.innerHTML = ''; // Stop video playback
});

// Simple Search Interface Hook
function setupSearch() {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            fetchAnimeData(`/anime?q=${encodeURIComponent(searchInput.value)}&limit=12`, trendingGrid);
            document.querySelector('#trending-grid').previousElementSibling.innerHTML = `<i class="fas fa-search"></i> Search Results`;
        }
    });
}

function hideLoading() {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 300);
    }, 500);
}