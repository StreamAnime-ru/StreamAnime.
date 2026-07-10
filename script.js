// Public instance router mapping metadata queries
const ANIME_API_URL = 'https://api.jikan.moe/v4';

let currentAnimeData = null;
let activeLanguage = 'sub'; // Tracks user language choice ('sub' vs 'dub')

// UI elements
const loadingScreen = document.getElementById('loading-screen');
const trendingGrid = document.getElementById('trending-grid');
const popularGrid = document.getElementById('popular-grid');
const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');
const videoPlayer = document.getElementById('main-video');
const episodeContainer = document.getElementById('episode-list-container');

const btnSub = document.getElementById('btn-sub');
const btnDub = document.getElementById('btn-dub');

document.addEventListener('DOMContentLoaded', () => {
    loadCatalogPage('/top/anime?filter=airing&limit=10', trendingGrid);
    loadCatalogPage('/top/anime?filter=bypopular&limit=10', popularGrid);
    setupLanguageControls();
    
    document.getElementById('back-to-home-btn').addEventListener('click', () => {
        playerView.classList.add('hidden');
        homeView.classList.remove('hidden');
        videoPlayer.pause();
        videoPlayer.src = "";
    });
    
    // Hide loading screen safely
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 300);
    }, 600);
});

// Fetches media items from a public repository
async function loadCatalogPage(endpoint, targetGrid) {
    try {
        const response = await fetch(`${ANIME_API_URL}${endpoint}`);
        const result = await response.json();
        if(result.data) {
            targetGrid.innerHTML = '';
            result.data.forEach(anime => {
                const card = document.createElement('div');
                card.className = 'anime-card';
                card.innerHTML = `
                    <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
                    <h4>${anime.title}</h4>
                `;
                card.addEventListener('click', () => fetchDetailsAndOpen(anime.mal_id));
                targetGrid.appendChild(card);
            });
        }
    } catch (err) {
        console.error("Catalog Loading error: ", err);
    }
}

// Queries data configuration dynamically 
async function fetchDetailsAndOpen(id) {
    try {
        const response = await fetch(`${ANIME_API_URL}/anime/${id}`);
        const result = await response.json();
        if (result.data) {
            currentAnimeData = result.data;
            openVideoDashboard(currentAnimeData);
        }
    } catch (err) {
        alert("Failed to sync structural listing metadata.");
    }
}

// Map parameters to player elements 
function openVideoDashboard(anime) {
    homeView.classList.add('hidden');
    playerView.classList.remove('hidden');

    document.getElementById('player-title').innerText = anime.title;
    document.getElementById('player-rating').innerHTML = `<i class="fas fa-star text-cyan"></i> ${anime.score || 'N/A'}`;
    document.getElementById('player-status').innerText = anime.status;
    document.getElementById('player-description').innerText = anime.synopsis || "No description loaded.";

    generateEpisodesList(anime.episodes || 12);
}

// Switches track definitions safely between SUB and DUB elements
function generateEpisodesList(totalEpisodes) {
    episodeContainer.innerHTML = '';
    
    // Simulating Sub / Dub source switching configurations cleanly
    for(let i = 1; i <= totalEpisodes; i++) {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.innerText = `Episode ${i} (${activeLanguage.toUpperCase()})`;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.episode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Uses open trailer/demo files since copyrighted commercial source arrays are illegal to host directly
            if (currentAnimeData.trailer && currentAnimeData.trailer.youtube_id) {
                // In a production environment with proper distribution licenses, this source URL 
                // would target your licensed streaming server or HLS (.m3u8) cloud stream directory.
                videoPlayer.src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
            } else {
                videoPlayer.src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElevatorMusic.mp4";
            }
            videoPlayer.play();
        });
        episodeContainer.appendChild(btn);
    }
}

function setupLanguageControls() {
    btnSub.addEventListener('click', () => {
        if(activeLanguage === 'sub') return;
        activeLanguage = 'sub';
        btnSub.classList.add('active');
        btnDub.classList.remove('active');
        if(currentAnimeData) generateEpisodesList(currentAnimeData.episodes || 12);
    });

    btnDub.addEventListener('click', () => {
        if(activeLanguage === 'dub') return;
        activeLanguage = 'dub';
        btnDub.classList.add('active');
        btnSub.classList.remove('active');
        if(currentAnimeData) generateEpisodesList(currentAnimeData.episodes || 12);
    });
}
