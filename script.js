// Public Streaming API and Streaming Embed sources
const ANIME_API = "https://api.consumet.org/anime/gogoanime";
const PLAYER_EMBED = "https://anitaku.to/embedchat?id=";

// Automatically load popular anime list on page startup
document.addEventListener("DOMContentLoaded", () => {
    getPopularAnime();
});

// Fetch trending data from API
async function getPopularAnime() {
    try {
        const response = await fetch(`${ANIME_API}/top-airing`);
        const data = await response.json();
        renderAnimeGrid(data.results);
    } catch (error) {
        console.error("API Error:", error);
        document.getElementById('popularGrid').innerHTML = "<p class='loading-text'>Failed to connect to media servers. Please reload page.</p>";
    }
}

// Build cards into the HTML document
function renderAnimeGrid(animeList) {
    const grid = document.getElementById('popularGrid');
    grid.innerHTML = ""; // Wipe loading text

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.classList.add('anime-card');
        card.innerHTML = `
            <img class="anime-poster" src="${anime.image}" alt="${anime.title}" loading="lazy">
            <div class="anime-info">
                <div class="anime-title" title="${anime.title}">${anime.title}</div>
                <div class="anime-meta">${anime.latestEpisode || 'Episode 1'}</div>
            </div>
        `;
        
        // Listen for a click to initiate streaming player setup
        card.addEventListener('click', () => startStreaming(anime.id, anime.title));
        grid.appendChild(card);
    });
}

// Target streaming IDs and insert live video feeds
async function startStreaming(id, title) {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    const playingTitle = document.getElementById('playingTitle');

    playingTitle.innerText = `Fetching streams for ${title}...`;
    playerSection.style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        // Request deep details/episode layout list for targeted anime
        const response = await fetch(`${ANIME_API}/info/${id}`);
        const data = await response.json();
        
        if (data.episodes && data.episodes.length > 0) {
            // Pick first episode asset variant for direct feed
            const targetedEpisode = data.episodes[0].id;
            
            playingTitle.innerText = `Now Playing: ${title} - Episode 1`;
            videoPlayer.src = `${PLAYER_EMBED}${targetedEpisode}`;
        } else {
            playingTitle.innerText = "No playable video source found for this series.";
        }
    } catch (error) {
        console.error("Streaming error:", error);
        playingTitle.innerText = "Network streaming link error occurred.";
    }
}
