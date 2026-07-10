/**
 * ==================================================================================
 * STREAMANIME ENGINE CORE ENVIRONMENT CLIENT FRONTEND CORE EXECUTION CONTROLLER
 * ==================================================================================
 */

// Target API Gateway Configuration Parameters Definition
const JIKAN_API_BASE = "https://api.jikan.moe/v4";
const FALLBACK_SAMPLE_MP4 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// Operational Central State Variables Model Definition
let systemState = {
    activeUser: null,
    currentAnimeId: null,
    currentAnimeData: null,
    currentEpisodeIndex: 1,
    heroSlideIndex: 0,
    carouselInterval: null,
    cachedDetails: {}
};

// Main DOM Content Initialization Framework Listener Bootstrapper Hook
document.addEventListener("DOMContentLoaded", () => {
    initLocalDatastores();
    verifyActiveSessionToken();
    registerDomNavigationRouters();
    registerFilterControlsActionHooks();
    registerVideoStreamingCustomEngineControls();
    registerSocialCritiqueSubmissionPipeline();
    registerSearchAutocompleteEventHooks();
    
    // Core Initial Landing Page Collections Fetch Load Distribution Engine
    fetchSpotlightHeroCollection();
    fetchShelfCategorizedGridData("top/anime?filter=bypopularity", "trendingGrid");
    fetchShelfCategorizedGridData("top/anime?filter=airing", "popularGrid");
    fetchShelfCategorizedGridData("seasons/now?limit=12", "latestGrid");
    fetchShelfCategorizedGridData("anime?status=upcoming&order_by=popularity&sort=asc&limit=12", "recentlyAddedGrid");
    
    renderGlobalContinueWatchingShelf();
});

/* ==========================================================================
   LOCALSTORAGE MEMORY CONTROL DATASTORE SYNCHRONIZATION ENGINE
   ========================================================================== */
function initLocalDatastores() {
    if (!localStorage.getItem("streamanime_accounts")) localStorage.setItem("streamanime_accounts", JSON.stringify([]));
    if (!localStorage.getItem("streamanime_comments")) localStorage.setItem("streamanime_comments", JSON.stringify({}));
    if (!localStorage.getItem("streamanime_ratings")) localStorage.setItem("streamanime_ratings", JSON.stringify({}));
    if (!localStorage.getItem("streamanime_user_meta")) localStorage.setItem("streamanime_user_meta", JSON.stringify({}));
}

function verifyActiveSessionToken() {
    const session = sessionStorage.getItem("streamanime_active_session");
    if (session) {
        systemState.activeUser = session;
        updateNavbarAuthenticationInterfaceStates(true);
    } else {
        updateNavbarAuthenticationInterfaceStates(false);
    }
}

/* ==========================================================================
   DOM ROUTING ROUTER ARCHITECTURE SWITCH INTERFACE ENGINE
   ========================================================================== */
function registerDomNavigationRouters() {
    // Top Brand Home Logo Reset Click Handler
    document.getElementById("brandLogo").addEventListener("click", () => {
        switchViewPanelMatrixState("homeView");
        document.querySelectorAll(".nav-item, .drawer-item").forEach(el => el.classList.remove("active"));
        document.querySelector('[data-target="homeView"]').classList.add("active");
    });

    // Standard Desktop Global Nav Selector Navigation Items Links
    document.querySelectorAll(".nav-item, .drawer-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetView = item.getAttribute("data-target");
            
            document.querySelectorAll(".nav-item, .drawer-item").forEach(el => el.classList.remove("active"));
            item.classList.add("active");
            
            if (targetView === "watchlistView") {
                renderStandaloneWatchlistGrid();
            } else if (targetView === "historyView") {
                renderStandaloneHistoryGrid();
            }
            
            switchViewPanelMatrixState(targetView);
            closeMobileDrawerMenuLayer();
        });
    });

    // Mobile Drawer Structural Toggle Triggers Click Listeners
    const burgerBtn = document.getElementById("mobileMenuToggle");
    const closeDrawerBtn = document.getElementById("closeDrawerBtn");
    const overlay = document.getElementById("drawerOverlay");

    burgerBtn.addEventListener("click", () => {
        document.getElementById("mobileDrawer").classList.add("open");
        overlay.classList.add("open");
    });
    closeDrawerBtn.addEventListener("click", closeMobileDrawerMenuLayer);
    overlay.addEventListener("click", closeMobileDrawerMenuLayer);

    // Dynamic View Sub-routing Back Navigation Action Triggers
    document.getElementById("backToHomeFromDetails").addEventListener("click", () => switchViewPanelMatrixState("homeView"));
    document.getElementById("backToDetailsFromPlayer").addEventListener("click", () => {
        stopVideoMediaComponentFeed();
        switchViewPanelMatrixState("detailsView");
    });
    
    // Header Profiler User Context Dropdown Trigger Mechanics Context Menu Popup
    const authTrigger = document.getElementById("authMenuTrigger");
    const profileDropdown = document.getElementById("profileDropdown");
    
    authTrigger.addEventListener("click", (e) => {
        if (systemState.activeUser) {
            e.stopPropagation();
            profileDropdown.classList.toggle("hidden");
        } else {
            launchAccountAuthModalWindow("login");
        }
    });

    document.addEventListener("click", () => profileDropdown.classList.add("hidden"));
    
    document.getElementById("goToProfileBtn").addEventListener("click", (e) => {
        e.preventDefault();
        renderUserDashboardProfileStatistics();
        switchViewPanelMatrixState("profileView");
    });

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("streamanime_active_session");
        systemState.activeUser = null;
        updateNavbarAuthenticationInterfaceStates(false);
        switchViewPanelMatrixState("homeView");
        showToastNotificationAlert("Account session signed out successfully.");
    });
}

function switchViewPanelMatrixState(targetViewId) {
    document.querySelectorAll(".view-panel").forEach(view => view.classList.add("hidden"));
    document.getElementById(targetViewId).classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeMobileDrawerMenuLayer() {
    document.getElementById("mobileDrawer").classList.remove("open");
    document.getElementById("drawerOverlay").classList.remove("open");
}

/* ==========================================================================
   JIKAN API PLATFORM DATA INGESTION & GRID BUILDER ENGINE
   ========================================================================== */
async function fetchShelfCategorizedGridData(endpointQueryUrl, targetContainerElementId) {
    const container = document.getElementById(targetContainerElementId);
    try {
        const response = await fetch(`${JIKAN_API_BASE}/${endpointQueryUrl}`);
        if (!response.ok) throw new Error(`HTTP Error Code Context: ${response.status}`);
        const jsonPayload = await response.json();
        
        renderStandardCardsGridInterface(jsonPayload.data, container);
    } catch (err) {
        console.error(`Ingestion Pipeline Failure on container node: ${targetContainerElementId}`, err);
        container.innerHTML = `<p class="loading-text text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Sync interrupted.</p>`;
    }
}

function renderStandardCardsGridInterface(animeDataArray, targetDomContainer) {
    targetDomContainer.innerHTML = "";
    if (!animeDataArray || animeDataArray.length === 0) {
        targetDomContainer.innerHTML = `<p class="loading-text">No matching library data items located.</p>`;
        return;
    }

    // Limit array parsing execution sequence map loop down inside viewport boundary blocks allocation
    const boundedArray = animeDataArray.slice(0, 12);
    
    boundedArray.forEach(anime => {
        const cardNode = document.createElement("div");
        cardNode.className = "anime-card-component";
        
        const cardTitle = anime.title_english || anime.title;
        const currentScore = anime.score ? anime.score.toFixed(1) : "N/A";
        const totalEpisodesCount = anime.episodes ? `${anime.episodes} Ep` : "Airing";
        const mediaFormatType = anime.type || "TV";

        cardNode.innerHTML = `
            <div class="card-image-wrap">
                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='270' viewBox='0 0 200 270'><rect width='200' height='270' fill='%230f1115'/></svg>" data-src="${anime.images.jpg.image_url}" alt="${cardTitle}" class="card-poster-img lazy-load">
                <span class="card-overlay-badge">${totalEpisodesCount}</span>
                <span class="card-score-badge"><i class="fa-solid fa-star"></i> ${currentScore}</span>
            </div>
            <div class="card-details-box">
                <h3 class="card-main-title" title="${cardTitle}">${cardTitle}</h3>
                <div class="card-subtext-meta">
                    <span>${mediaFormatType}</span>
                    <span>${anime.status === "Currently Airing" ? "Airing" : "Complete"}</span>
                </div>
            </div>
        `;

        cardNode.addEventListener("click", () => executeTransitionToDetailsPage(anime.mal_id));
        targetDomContainer.appendChild(cardNode);
    });

    instantiateLazyLoadIntersectionObserver();
}

/* ==========================================================================
   PERFORMANCE LAZY-LOADING IMAGES OPTIMIZATION SUBSYSTEM
   ========================================================================== */
function instantiateLazyLoadIntersectionObserver() {
    const lazyImages = document.querySelectorAll(".lazy-load");
    
    if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const imageEl = entry.target;
                    imageEl.src = imageEl.getAttribute("data-src");
                    imageEl.classList.remove("lazy-load");
                    imageObserver.unobserve(imageEl);
                }
            });
        });
        lazyImages.forEach(image => imageObserver.observe(image));
    } else {
        // Fallback processing for older specifications layers variables
        lazyImages.forEach(img => img.src = img.getAttribute("data-src"));
    }
}

/* ==========================================================================
   HERO SPOTLIGHT BANNER INTERACTIVE SLIDER MECHANISM
   ========================================================================== */
async function fetchSpotlightHeroCollection() {
    const track = document.getElementById("heroTrack");
    try {
        const response = await fetch(`${JIKAN_API_BASE}/top-anime?type=tv&filter=airing&limit=5`);
        const json = await response.json();
        
        if (json.data && json.data.length > 0) {
            track.innerHTML = "";
            json.data.forEach((anime, idx) => {
                const slide = document.createElement("div");
                slide.className = `hero-slide ${idx === 0 ? "active" : ""}`;
                slide.style.backgroundImage = `url('${anime.images.jpg.large_image_url}')`;
                
                const slideTitle = anime.title_english || anime.title;
                const filterSynopsisText = anime.synopsis ? anime.synopsis : "No contextual analytical library log summary exists at present time.";

                slide.innerHTML = `
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <span class="hero-badge"><i class="fa-solid fa-compact-disc fa-spin"></i> Airing Spotlight Series</span>
                        <h2 class="hero-title">${slideTitle}</h2>
                        <p class="hero-synopsis">${filterSynopsisText}</p>
                        <button class="btn btn-primary btn-md hero-play-btn-node" data-mal-id="${anime.mal_id}">
                            <i class="fa-solid fa-circle-info"></i> Interrogate Catalog Matrix
                        </button>
                    </div>
                `;
                
                slide.querySelector(".hero-play-btn-node").addEventListener("click", (e) => {
                    e.stopPropagation();
                    executeTransitionToDetailsPage(anime.mal_id);
                });

                track.appendChild(slide);
            });
            
            initiateHeroSliderRotationLoop();
        }
    } catch (err) {
        console.error("Spotlight Banner extraction operation halted:", err);
    }
}

function initiateHeroSliderRotationLoop() {
    if (systemState.carouselInterval) clearInterval(systemState.carouselInterval);
    
    systemState.carouselInterval = setInterval(() => {
        const slides = document.querySelectorAll(".hero-slide");
        if (slides.length === 0) return;
        
        slides[systemState.heroSlideIndex].classList.remove("active");
        systemState.heroSlideIndex = (systemState.heroSlideIndex + 1) % slides.length;
        slides[systemState.heroSlideIndex].classList.add("active");
    }, 6500);
}

/* ==========================================================================
   ADVANCED QUERY MATRIX & SEARCH AUTOCOMPLETE SYSTEMS
   ========================================================================== */
function registerFilterControlsActionHooks() {
    const headerToggle = document.getElementById("filterHeaderToggle");
    const bodyContent = document.getElementById("filterBody");
    
    headerToggle.addEventListener("click", () => {
        headerToggle.classList.toggle("collapsed");
        bodyContent.classList.toggle("hidden");
    });

    document.getElementById("applyFiltersBtn").addEventListener("click", () => {
        const genreValue = document.getElementById("filterGenre").value;
        const statusValue = document.getElementById("filterStatus").value;
        const ratingValue = document.getElementById("filterRating").value;
        const typeValue = document.getElementById("filterType").value;

        let queryUrlString = "anime?order_by=score&sort=desc";
        if (genreValue) queryUrlString += `&genres=${genreValue}`;
        if (statusValue) queryUrlString += `&status=${statusValue}`;
        if (ratingValue) queryUrlString += `&rating=${ratingValue}`;
        if (typeValue) queryUrlString += `&type=${typeValue}`;

        document.getElementById("searchResultsSection").classList.remove("hidden");
        document.getElementById("searchResultTitle").innerText = "Advanced Discovered Resource Outputs";
        
        fetchShelfCategorizedGridData(queryUrlString, "searchResultsGrid");
        window.scrollTo({ top: document.getElementById("searchResultsSection").offsetTop - 100, behavior: "smooth" });
    });

    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        document.getElementById("filterGenre").value = "";
        document.getElementById("filterStatus").value = "";
        document.getElementById("filterRating").value = "";
        document.getElementById("filterType").value = "";
    });

    document.getElementById("closeSearchGridBtn").addEventListener("click", () => {
        document.getElementById("searchResultsSection").classList.add("hidden");
        document.getElementById("globalSearch").value = "";
    });
}

function registerSearchAutocompleteEventHooks() {
    const searchInput = document.getElementById("globalSearch");
    const dropdown = document.getElementById("autocompleteDropdown");
    let throttleTimeoutTimer = null;

    searchInput.addEventListener("input", () => {
        clearTimeout(throttleTimeoutTimer);
        const queryTerm = searchInput.value.trim();
        
        if (queryTerm.length < 3) {
            dropdown.classList.add("hidden");
            return;
        }

        throttleTimeoutTimer = setTimeout(async () => {
            try {
                const response = await fetch(`${JIKAN_API_BASE}/anime?q=${encodeURIComponent(queryTerm)}&limit=6`);
                const json = await response.json();
                
                if (json.data && json.data.length > 0) {
                    dropdown.innerHTML = "";
                    dropdown.classList.remove("hidden");
                    
                    json.data.forEach(anime => {
                        const row = document.createElement("div");
                        row.className = "autocomplete-item";
                        const localizedTitle = anime.title_english || anime.title;
                        
                        row.innerHTML = `
                            <img src="${anime.images.jpg.image_url}" class="autocomplete-thumb">
                            <div class="autocomplete-meta-title">${localizedTitle}</div>
                        `;
                        row.addEventListener("click", () => {
                            dropdown.classList.add("hidden");
                            searchInput.value = localizedTitle;
                            executeTransitionToDetailsPage(anime.mal_id);
                        });
                        dropdown.appendChild(row);
                    });
                } else {
                    dropdown.classList.add("hidden");
                }
            } catch (err) {
                console.error("Debounce autocomplete transaction intercepted:", err);
            }
        }, 400);
    });

    // Handle standard submit button text search event logic action blocks
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const finalTerm = searchInput.value.trim();
            if (!finalTerm) return;
            dropdown.classList.add("hidden");
            document.getElementById("searchResultsSection").classList.remove("hidden");
            document.getElementById("searchResultTitle").innerText = `Search Aggregation: "${finalTerm}"`;
            fetchShelfCategorizedGridData(`anime?q=${encodeURIComponent(finalTerm)}`, "searchResultsGrid");
        }
    });

    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });
}

/* ==========================================================================
   ANIME LIBRARY DETAILED OVERVIEW PROCESSING PAGE VIEW ENGINE
   ========================================================================= */
async function executeTransitionToDetailsPage(malId) {
    switchViewPanelMatrixState("detailsView");
    
    // Check local run-time cache memory structures allocation
    if (systemState.cachedDetails[malId]) {
        populateAnimeDetailsViewComponents(systemState.cachedDetails[malId]);
        return;
    }

    try {
        // Multi-stage extraction requests logic flow control parameters
        const detailResponse = await fetch(`${JIKAN_API_BASE}/anime/${malId}`);
        const detailJson = await detailResponse.getReader ? null : await detailResponse.json();
        const animePayload = detailJson.data;

        // Fetch related analytical mapping node components
        const recommendationsResponse = await fetch(`${JIKAN_API_BASE}/anime/${malId}/recommendations`);
        const recommendationsJson = await recommendationsResponse.json();
        
        const finalizedExtendedDataObject = {
            mainDetails: animePayload,
            recommendations: recommendationsJson.data || []
        };

        systemState.cachedDetails[malId] = finalizedExtendedDataObject;
        populateAnimeDetailsViewComponents(finalizedExtendedDataObject);
    } catch (err) {
        console.error("Critical Exception caught while mounting item data profiles:", err);
    }
}

function populateAnimeDetailsViewComponents(aggregatedPackage) {
    const anime = aggregatedPackage.mainDetails;
    systemState.currentAnimeId = anime.mal_id;
    systemState.currentAnimeData = anime;

    // Map UI Nodes elements strings
    const targetTitleText = anime.title_english || anime.title;
    document.getElementById("detailsTitle").innerText = targetTitleText;
    document.getElementById("detailsAltTitle").innerText = anime.title_japanese || "";
    document.getElementById("detailsSynopsis").innerText = anime.synopsis ? anime.synopsis : "No extended script summary is available.";
    document.getElementById("detailsPoster").src = anime.images.jpg.large_image_url;
    document.getElementById("detailsBannerBlur").style.backgroundImage = `url('${anime.images.jpg.large_image_url}')`;
    
    document.getElementById("detailsScore").innerText = anime.score ? anime.score.toFixed(2) : "Unrated";
    document.getElementById("detailsType").innerText = anime.type || "TV";
    document.getElementById("detailsYear").innerText = anime.year || anime.status;
    document.getElementById("detailsStudio").innerText = anime.studios[0] ? anime.studios[0].name : "Unknown Factory";

    // Map genres elements arrays loop blocks configuration parameters definitions
    const genreBox = document.getElementById("detailsGenres");
    genreBox.innerHTML = "";
    anime.genres.forEach(g => {
        const span = document.createElement("span");
        span.className = "genre-tag";
        span.innerText = g.name;
        genreBox.appendChild(span);
    });

    // Synchronize interactive watchlist user states profiles components tags buttons
    updateInteractiveButtonWatchlistDisplayStates();
    
    // Generate simulated structured sample catalog segments buttons counts allocations
    buildSimulatedEpisodesSelectorsListingBox(anime.episodes || 12);
    
    // Render related recommendation lists components
    renderStandardCardsGridInterface(aggregatedPackage.recommendations.map(r => r.entry), document.getElementById("recommendedAnimeGrid"));
    fetchShelfCategorizedGridData(`anime?genres=${anime.genres[0]?.mal_id || 1}&limit=6`, "relatedAnimeGrid");

    // Initialize community interaction reviews timelines feeds blocks array mapping hooks
    synchronizeCommunityCommentsTimelineInterfaceLogs();
    synchronizeRatingModuleSelectionDisplayStates();
}

function buildSimulatedEpisodesSelectorsListingBox(episodeCountCount) {
    const container = document.getElementById("detailsEpisodesList");
    container.innerHTML = "";
    
    const accountLogs = getActiveUserDataStructureLogs();
    const historyLogs = accountLogs.watchHistory || {};
    const animeHistory = historyLogs[systemState.currentAnimeId] || [];

    for (let i = 1; i <= episodeCountCount; i++) {
        const btn = document.createElement("div");
        const isWatched = animeHistory.includes(i);
        btn.className = `episode-node-item ${isWatched ? "watched" : ""}`;
        btn.innerText = i;
        
        btn.addEventListener("click", () => {
            systemState.currentEpisodeIndex = i;
            launchActiveVideoStreamPlayerView();
        });
        container.appendChild(btn);
    }

    // Set primary action index entry point trigger link connection
    document.getElementById("startWatchingBtn").onclick = () => {
        systemState.currentEpisodeIndex = 1;
        launchActiveVideoStreamPlayerView();
    };
}

/* ==========================================================================
   ADVANCED DESIGNED CORE HTML5 DYNAMIC VIDEO THEATRE PLAYER ENGINE
   ========================================================================== */
function launchActiveVideoStreamPlayerView() {
    switchViewPanelMatrixState("playerView");
    
    const titleString = systemState.currentAnimeData.title_english || systemState.currentAnimeData.title;
    document.getElementById("playerHeadingTitle").innerText = `Streaming Segment: ${titleString} — Track Episode ${systemState.currentEpisodeIndex}`;
    
    // Build secondary tracking control selector channels box list
    const navPanelContainer = document.getElementById("playerEpisodesListContainer");
    navPanelContainer.innerHTML = "";
    const totalCount = systemState.currentAnimeData.episodes || 12;
    
    for (let k = 1; k <= totalCount; k++) {
        const btnNode = document.createElement("button");
        btnNode.className = `ep-btn ${k === systemState.currentEpisodeIndex ? "active" : ""}`;
        btnNode.innerText = `Ep ${k}`;
        btnNode.onclick = () => {
            systemState.currentEpisodeIndex = k;
            launchActiveVideoStreamPlayerView();
        };
        navPanelContainer.appendChild(btnNode);
    }

    // Setup media parameters element hooks structures
    const mediaComponent = document.getElementById("mainMediaStreamComponent");
    const fallbackUi = document.getElementById("videoStreamFallbackUi");
    
    // Check if continue watching index markers points exist in data layer logs
    const savedMetadata = getActiveUserDataStructureLogs().continueWatching || {};
    const matchingKey = `${systemState.currentAnimeId}_ep${systemState.currentEpisodeIndex}`;
    
    // Reset component source element parameters configurations arrays pointers
    mediaComponent.src = "";
    fallbackUi.classList.remove("hidden");
    
    document.getElementById("fallbackInitializeBtn").onclick = () => {
        fallbackUi.classList.add("hidden");
        mediaComponent.src = FALLBACK_SAMPLE_MP4;
        mediaComponent.load();
        
        // Check if seek point marker exists
        if (savedMetadata[matchingKey]) {
            mediaComponent.currentTime = savedMetadata[matchingKey].timestamp;
            showToastNotificationAlert(`Resuming play session at ${formatTimeReadoutDisplay(savedMetadata[matchingKey].timestamp)}`);
        }
        
        mediaComponent.play().catch(e => console.log("Autoplay configuration restriction bypassed.", e));
        appendTargetEpisodeToUserPlaybackHistoryLogs(systemState.currentAnimeId, systemState.currentEpisodeIndex);
    };
}

function registerVideoStreamingCustomEngineControls() {
    const video = document.getElementById("mainMediaStreamComponent");
    const playPauseBtn = document.getElementById("playPauseActionBtn");
    const muteBtn = document.getElementById("muteToggleBtn");
    const volumeSlider = document.getElementById("volumeSliderControl");
    const fullscreenBtn = document.getElementById("fullscreenToggleBtn");
    const seekSlider = document.getElementById("timelineSeekSlider");
    const activeProgress = document.getElementById("timelineActiveProgress");
    const bufferedFill = document.getElementById("timelineBufferedFill");
    const currentTimeText = document.getElementById("currentPlaybackTime");
    const totalTimeText = document.getElementById("totalDurationTime");
    const skipIntroBtn = document.getElementById("skipIntroActionBtn");
    const theatreBtn = document.getElementById("theatreToggleBtn");
    const overlay = document.getElementById("customControlsOverlay");

    // Playback Toggle Engine Controls Interceptor Action Loops
    const triggerTogglePlaybackState = () => {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        } else {
            video.pause();
            playPauseBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
        }
    };

    playPauseBtn.addEventListener("click", triggerTogglePlaybackState);
    document.getElementById("centerActionPrompt").addEventListener("click", triggerTogglePlaybackState);
    
    // Synchronize media component timeline states tracking monitors
    video.addEventListener("timeupdate", () => {
        if (!video.duration) return;
        const percentage = (video.currentTime / video.duration) * 100;
        seekSlider.value = percentage;
        activeProgress.style.width = `${percentage}%`;
        currentTimeText.innerText = formatTimeReadoutDisplay(video.currentTime);
        
        // Smart interactive trigger skip visibility calculations logic parameters blocks
        if (video.currentTime >= 10 && video.currentTime <= 45) {
            skipIntroBtn.classList.remove("hidden");
        } else {
            skipIntroBtn.classList.add("hidden");
        }

        // Periodically capture running session frames to persist into LocalStorage continue watching indices tracking layers
        saveCurrentPlaybackTrackingProgressIndexMarker(video.currentTime);
    });

    video.addEventListener("loadedmetadata", () => {
        totalTimeText.innerText = formatTimeReadoutDisplay(video.duration);
    });

    video.addEventListener("progress", () => {
        if (video.buffered.length > 0 && video.duration) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            const bufferedPercentage = (bufferedEnd / video.duration) * 100;
            bufferedFill.style.width = `${bufferedPercentage}%`;
        }
    });

    // Custom slider interactive seeking control binding operations execution loops
    seekSlider.addEventListener("input", () => {
        const seekTargetTime = (seekSlider.value / 100) * video.duration;
        video.currentTime = seekTargetTime;
        activeProgress.style.width = `${seekSlider.value}%`;
    });

    // Audio tracking operations modules configuration loops links handlers
    volumeSlider.addEventListener("input", () => {
        video.volume = volumeSlider.value;
        if (video.volume === 0) {
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
        } else if (video.volume < 0.5) {
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-low"></i>`;
        } else {
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
        }
    });

    muteBtn.addEventListener("click", () => {
        video.muted = !video.muted;
        if (video.muted) {
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
        } else {
            muteBtn.innerHTML = video.volume < 0.5 ? `<i class="fa-solid fa-volume-low"></i>` : `<i class="fa-solid fa-volume-high"></i>`;
        }
    });

    // Layout configuration view state modification routines operations loops overrides handlers
    theatreBtn.addEventListener("click", () => {
        document.getElementById("theatreBoxContainer").classList.toggle("theatre-mode-active");
    });

    fullscreenBtn.addEventListener("click", () => {
        const box = document.getElementById("theatreBoxContainer");
        if (!document.fullscreenElement) {
            box.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen();
        }
    });

    skipIntroBtn.addEventListener("click", () => {
        video.currentTime += 30;
    });

    // Sequential Next / Previous navigation buttons execution triggers
    document.getElementById("nextEpisodeBtn").onclick = () => {
        const total = systemState.currentAnimeData.episodes || 12;
        if (systemState.currentEpisodeIndex < total) {
            systemState.currentEpisodeIndex++;
            launchActiveVideoStreamPlayerView();
        } else {
            showToastNotificationAlert("Final indexed episode series track reached.");
        }
    };

    document.getElementById("prevEpisodeBtn").onclick = () => {
        if (systemState.currentEpisodeIndex > 1) {
            systemState.currentEpisodeIndex--;
            launchActiveVideoStreamPlayerView();
        } else {
            showToastNotificationAlert("Initial catalog boundary track node achieved.");
        }
    };
}

function stopVideoMediaComponentFeed() {
    const video = document.getElementById("mainMediaStreamComponent");
    video.pause();
    video.src = "";
}

function formatTimeReadoutDisplay(secondsValue) {
    const h = Math.floor(secondsValue / 3600);
    const m = Math.floor((secondsValue % 3600) / 60);
    const s = Math.floor(secondsValue % 60);
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
}

/* ==========================================================================
   USER PROFILE MANAGEMENT & LOCALSTORAGE USER SESSION ENGINE
   ========================================================================== */
function launchAccountAuthModalWindow(initialFormMode) {
    const overlay = document.getElementById("authModalWindowOverlay");
    overlay.classList.remove("hidden");
    
    const tabLogin = document.getElementById("tabToggleLoginMode");
    const tabSignup = document.getElementById("tabToggleSignupMode");
    const formLogin = document.getElementById("loginFormSubsystem");
    const formSignup = document.getElementById("signupFormSubsystem");

    const setMode = (mode) => {
        if (mode === "login") {
            tabLogin.classList.add("active");
            tabSignup.classList.remove("active");
            formLogin.classList.remove("hidden");
            formSignup.classList.add("hidden");
            document.getElementById("authModalTitleHeader").innerText = "Sign In Security Layer";
        } else {
            tabLogin.classList.remove("active");
            tabSignup.classList.add("active");
            formLogin.classList.add("hidden");
            formSignup.classList.remove("hidden");
            document.getElementById("authModalTitleHeader").innerText = "Account Configuration Setup";
        }
    };

    tabLogin.onclick = () => setMode("login");
    tabSignup.onclick = () => setMode("signup");
    setMode(initialFormMode);

    document.getElementById("closeAuthModalBtn").onclick = () => overlay.classList.add("hidden");
    
    // Core Login Handler Interceptor
    formLogin.onsubmit = (e) => {
        e.preventDefault();
        const user = document.getElementById("loginUsernameInput").value.trim();
        const pass = document.getElementById("loginPasswordInput").value;
        
        const accounts = JSON.parse(localStorage.getItem("streamanime_accounts"));
        const matched = accounts.find(a => a.username.toLowerCase() === user.toLowerCase() && a.password === pass);
        
        if (matched) {
            sessionStorage.setItem("streamanime_active_session", matched.username);
            systemState.activeUser = matched.username;
            updateNavbarAuthenticationInterfaceStates(true);
            overlay.classList.add("hidden");
            showToastNotificationAlert(`Welcome back, ${matched.username}! Operational privileges certified.`);
            renderGlobalContinueWatchingShelf();
        } else {
            alert("Security Handshake Refused: Invalid credential pairing profile.");
        }
    };

    // Core Signup Registration Handler Interceptor
    formSignup.onsubmit = (e) => {
        e.preventDefault();
        const user = document.getElementById("signupUsernameInput").value.trim();
        const pass = document.getElementById("signupPasswordInput").value;
        
        const accounts = JSON.parse(localStorage.getItem("streamanime_accounts"));
        if (accounts.some(a => a.username.toLowerCase() === user.toLowerCase())) {
            alert("Registration Exception: Designation string currently allocated to an active user node.");
            return;
        }

        accounts.push({ username: user, password: pass });
        localStorage.setItem("streamanime_accounts", JSON.stringify(accounts));
        
        // Instantiate specific isolated activity profile fields indexes
        const metaStore = JSON.parse(localStorage.getItem("streamanime_user_meta"));
        metaStore[user] = { watchlist: [], favorites: [], watchHistory: {}, continueWatching: {} };
        localStorage.setItem("streamanime_user_meta", JSON.stringify(metaStore));

        sessionStorage.setItem("streamanime_active_session", user);
        systemState.activeUser = user;
        updateNavbarAuthenticationInterfaceStates(true);
        overlay.classList.add("hidden");
        showToastNotificationAlert(`Account profile initialized. Membership status validated for ${user}.`);
    };
}

function updateNavbarAuthenticationInterfaceStates(isAuthenticated) {
    const container = document.getElementById("userAvatarContainer");
    const loginBtn = document.getElementById("loginTriggerBtn");
    
    if (isAuthenticated) {
        loginBtn.classList.add("hidden");
        container.classList.remove("hidden");
        document.getElementById("headerUsername").innerText = systemState.activeUser;
    } else {
        loginBtn.classList.remove("hidden");
        container.classList.add("hidden");
    }
}

function getActiveUserDataStructureLogs() {
    if (!systemState.activeUser) return { watchlist: [], favorites: [], watchHistory: {}, continueWatching: {} };
    const metaStore = JSON.parse(localStorage.getItem("streamanime_user_meta"));
    if (!metaStore[systemState.activeUser]) {
        metaStore[systemState.activeUser] = { watchlist: [], favorites: [], watchHistory: {}, continueWatching: {} };
        localStorage.setItem("streamanime_user_meta", JSON.stringify(metaStore));
    }
    return metaStore[systemState.activeUser];
}

function commitUserDataStructureChangesToDisk(updatedProfileObject) {
    if (!systemState.activeUser) return;
    const metaStore = JSON.parse(localStorage.getItem("streamanime_user_meta"));
    metaStore[systemState.activeUser] = updatedProfileObject;
    localStorage.setItem("streamanime_user_meta", JSON.stringify(metaStore));
}

/* ==========================================================================
   USER CORE INTERACTION LOGIC PIPELINES SYSTEM
   ========================================================================== */
function updateInteractiveButtonWatchlistDisplayStates() {
    if (!systemState.currentAnimeId) return;
    const profile = getActiveUserDataStructureLogs();
    
    const isSavedWatchlist = profile.watchlist.some(item => item.mal_id === systemState.currentAnimeId);
    const isFavorited = profile.favorites.some(item => item.mal_id === systemState.currentAnimeId);

    const watchlistBtn = document.getElementById("toggleWatchlistBtn");
    const favoriteBtn = document.getElementById("toggleFavoriteBtn");

    if (isSavedWatchlist) {
        watchlistBtn.className = "btn btn-primary btn-md";
        watchlistBtn.innerHTML = `<i class="fa-solid fa-check"></i> Monitored in Watchlist`;
    } else {
        watchlistBtn.className = "btn btn-secondary btn-md";
        watchlistBtn.innerHTML = `<i class="fa-solid fa-bookmark"></i> Add to Watchlist`;
    }

    if (isFavorited) {
        favoriteBtn.className = "btn btn-accent btn-md";
        favoriteBtn.innerHTML = `<i class="fa-solid fa-heart-crack"></i> Remove Favorite`;
    } else {
        favoriteBtn.className = "btn btn-secondary btn-md";
        favoriteBtn.innerHTML = `<i class="fa-solid fa-heart"></i> Add to Favorites`;
    }

    // Set interactive hooks trigger actions events loops parameters
    watchlistBtn.onclick = () => {
        if (!systemState.activeUser) { launchAccountAuthModalWindow("login"); return; }
        const currentProfile = getActiveUserDataStructureLogs();
        const index = currentProfile.watchlist.findIndex(x => x.mal_id === systemState.currentAnimeId);
        
        if (index > -1) {
            currentProfile.watchlist.splice(index, 1);
            showToastNotificationAlert("Item purged from personal system watchlist.");
        } else {
            currentProfile.watchlist.push({
                mal_id: systemState.currentAnimeData.mal_id,
                title: systemState.currentAnimeData.title,
                title_english: systemState.currentAnimeData.title_english,
                images: systemState.currentAnimeData.images,
                score: systemState.currentAnimeData.score,
                type: systemState.currentAnimeData.type,
                episodes: systemState.currentAnimeData.episodes
            });
            showToastNotificationAlert("Title aggregated to personal watchlist directory queue.");
        }
        commitUserDataStructureChangesToDisk(currentProfile);
        updateInteractiveButtonWatchlistDisplayStates();
    };

    favoriteBtn.onclick = () => {
        if (!systemState.activeUser) { launchAccountAuthModalWindow("login"); return; }
        const currentProfile = getActiveUserDataStructureLogs();
        const index = currentProfile.favorites.findIndex(x => x.mal_id === systemState.currentAnimeId);
        
        if (index > -1) {
            currentProfile.favorites.splice(index, 1);
            showToastNotificationAlert("Series link removed from catalog favorites configuration list.");
        } else {
            currentProfile.favorites.push({
                mal_id: systemState.currentAnimeData.mal_id,
                title: systemState.currentAnimeData.title,
                title_english: systemState.currentAnimeData.title_english,
                images: systemState.currentAnimeData.images,
                score: systemState.currentAnimeData.score,
                type: systemState.currentAnimeData.type,
                episodes: systemState.currentAnimeData.episodes
            });
            showToastNotificationAlert("Aggregated content block parameters into profile favorites matrix array.");
        }
        commitUserDataStructureChangesToDisk(currentProfile);
        updateInteractiveButtonWatchlistDisplayStates();
    };
}

function appendTargetEpisodeToUserPlaybackHistoryLogs(malId, episodeIndex) {
    if (!systemState.activeUser) return;
    const profile = getActiveUserDataStructureLogs();
    if (!profile.watchHistory[malId]) profile.watchHistory[malId] = [];
    if (!profile.watchHistory[malId].includes(episodeIndex)) {
        profile.watchHistory[malId].push(episodeIndex);
    }
    commitUserDataStructureChangesToDisk(profile);
}

function saveCurrentPlaybackTrackingProgressIndexMarker(runningTimestampSeconds) {
    if (!systemState.activeUser || !systemState.currentAnimeId) return;
    const profile = getActiveUserDataStructureLogs();
    const storageKey = `${systemState.currentAnimeId}_ep${systemState.currentEpisodeIndex}`;
    
    profile.continueWatching[storageKey] = {
        mal_id: systemState.currentAnimeId,
        animeData: {
            title: systemState.currentAnimeData.title,
            title_english: systemState.currentAnimeData.title_english,
            images: systemState.currentAnimeData.images,
            type: systemState.currentAnimeData.type,
            episodes: systemState.currentAnimeData.episodes,
            score: systemState.currentAnimeData.score
        },
        episodeIndex: systemState.currentEpisodeIndex,
        timestamp: runningTimestampSeconds,
        updatedAt: Date.now()
    };
    
    commitUserDataStructureChangesToDisk(profile);
}

/* ==========================================================================
   DYNAMIC COMPONENT DATA RENDER SHELVES GENERATION IMPLEMENTATION
   ========================================================================== */
function renderGlobalContinueWatchingShelf() {
    const shelf = document.getElementById("continueWatchingShelf");
    const grid = document.getElementById("continueWatchingGrid");
    
    if (!systemState.activeUser) { shelf.classList.add("hidden"); return; }
    
    const profile = getActiveUserDataStructureLogs();
    const records = Object.values(profile.continueWatching || {}).sort((a,b) => b.updatedAt - a.updatedAt);
    
    if (records.length === 0) { shelf.classList.add("hidden"); return; }
    
    shelf.classList.remove("hidden");
    grid.innerHTML = "";
    
    records.slice(0, 4).forEach(item => {
        const card = document.createElement("div");
        card.className = "anime-card-component";
        const cleanTitle = item.animeData.title_english || item.animeData.title;
        
        card.innerHTML = `
            <div class="card-image-wrap">
                <img src="${item.animeData.images.jpg.image_url}" class="card-poster-img">
                <span class="card-overlay-badge">Resume Ep ${item.episodeIndex}</span>
            </div>
            <div class="card-details-box">
                <h3 class="card-main-title">${cleanTitle}</h3>
                <div class="card-subtext-meta">
                    <span>${item.animeData.type}</span>
                    <span class="text-accent"><i class="fa-solid fa-rotate-left"></i> Track Segment</span>
                </div>
            </div>
        `;
        card.onclick = () => {
            systemState.currentAnimeId = item.mal_id;
            systemState.currentAnimeData = item.animeData;
            systemState.currentAnimeData.mal_id = item.mal_id; // Inject missing pointer logic reference parameters definitions
            systemState.currentEpisodeIndex = item.episodeIndex;
            launchActiveVideoStreamPlayerView();
        };
        grid.appendChild(card);
    });
}

function renderStandaloneWatchlistGrid() {
    const grid = document.getElementById("standaloneWatchlistGrid");
    const profile = getActiveUserDataStructureLogs();
    renderStandardCardsGridInterface(profile.watchlist, grid);
}

function renderStandaloneHistoryGrid() {
    const grid = document.getElementById("standaloneHistoryGrid");
    const profile = getActiveUserDataStructureLogs();
    const items = Object.keys(profile.watchHistory || {}).map(id => systemState.cachedDetails[id]?.mainDetails).filter(Boolean);
    renderStandardCardsGridInterface(items, grid);
    
    document.getElementById("clearHistoryBtn").onclick = () => {
        if(!systemState.activeUser) return;
        const p = getActiveUserDataStructureLogs();
        p.watchHistory = {};
        p.continueWatching = {};
        commitUserDataStructureChangesToDisk(p);
        renderStandaloneHistoryGrid();
        renderGlobalContinueWatchingShelf();
        showToastNotificationAlert("Activity trajectory logs reset complete.");
    };
}

function renderUserDashboardProfileStatistics() {
    const p = getActiveUserDataStructureLogs();
    document.getElementById("profileCardUsernameText").innerText = systemState.activeUser || "Anonymous Guest Profile";
    document.getElementById("profileWatchlistCount").innerText = p.watchlist.length;
    document.getElementById("profileFavoritesCount").innerText = p.favorites.length;
    
    renderStandardCardsGridInterface(p.watchlist, document.getElementById("profileWatchlistGrid"));
    renderStandardCardsGridInterface(p.favorites, document.getElementById("profileFavoritesGrid"));
}

/* ==========================================================================
   COMMUNITY FEEDBACK INTERACTION RATING & CRITIQUE COMMENTS SYSTEM
   ========================================================================== */
function registerSocialCritiqueSubmissionPipeline() {
    document.getElementById("submitCommentBtn").addEventListener("click", () => {
        if (!systemState.activeUser) { launchAccountAuthModalWindow("login"); return; }
        const text = document.getElementById("commentInputField").value.trim();
        if (!text) return;

        const db = JSON.parse(localStorage.getItem("streamanime_comments"));
        if (!db[systemState.activeUser]) db[systemState.activeUser] = {};
        if (!db[systemState.activeUser][systemState.currentAnimeId]) db[systemState.activeUser][systemState.currentAnimeId] = [];
        
        db[systemState.activeUser][systemState.currentAnimeId].push({
            comment: text,
            timestamp: Date.now()
        });
        
        localStorage.setItem("streamanime_comments", JSON.stringify(db));
        document.getElementById("commentInputField").value = "";
        synchronizeCommunityCommentsTimelineInterfaceLogs();
        showToastNotificationAlert("Comment successfully appended to resource node thread.");
    });

    // Star interaction dynamic events mapping definitions parameters
    const stars = document.querySelectorAll("#userStarRatingSelector i");
    stars.forEach(star => {
        star.addEventListener("mouseover", () => {
            const score = parseInt(star.getAttribute("data-score"));
            highlightStarsDisplayInterface(score);
        });
        star.addEventListener("mouseout", () => {
            synchronizeRatingModuleSelectionDisplayStates();
        });
        star.addEventListener("click", () => {
            if (!systemState.activeUser) { launchAccountAuthModalWindow("login"); return; }
            const score = parseInt(star.getAttribute("data-score"));
            
            const ratingDb = JSON.parse(localStorage.getItem("streamanime_ratings"));
            if (!ratingDb[systemState.activeUser]) ratingDb[systemState.activeUser] = {};
            ratingDb[systemState.activeUser][systemState.currentAnimeId] = score;
            
            localStorage.setItem("streamanime_ratings", JSON.stringify(ratingDb));
            synchronizeRatingModuleSelectionDisplayStates();
            showToastNotificationAlert(`Performance classification parameter registered at ${score}/5 stars.`);
        });
    });
}

function highlightStarsDisplayInterface(scoreValue) {
    const stars = document.querySelectorAll("#userStarRatingSelector i");
    stars.forEach((s, idx) => {
        if (idx < scoreValue) {
            s.className = "fa-star fa-solid";
        } else {
            s.className = "fa-star fa-regular";
        }
    });
}

function synchronizeRatingModuleSelectionDisplayStates() {
    if (!systemState.currentAnimeId) return;
    const label = document.getElementById("currentRatingStatusLabel");
    
    if (!systemState.activeUser) {
        highlightStarsDisplayInterface(0);
        label.innerText = "Log in to rate asset node.";
        return;
    }

    const ratingDb = JSON.parse(localStorage.getItem("streamanime_ratings"));
    const userRatings = ratingDb[systemState.activeUser] || {};
    const score = userRatings[systemState.currentAnimeId] || 0;
    
    highlightStarsDisplayInterface(score);
    label.innerText = score > 0 ? `Registered Score: ${score}/5 Stars` : "Unrated Element";
}

function synchronizeCommunityCommentsTimelineInterfaceLogs() {
    const timeline = document.getElementById("commentsDisplayTimeline");
    timeline.innerHTML = "";
    
    if (!systemState.currentAnimeId) return;

    const db = JSON.parse(localStorage.getItem("streamanime_comments"));
    let consolidatedCommentsArray = [];

    // Parse loop array storage models indices blocks configurations parameters definitions
    Object.keys(db).forEach(user => {
        if (db[user][systemState.currentAnimeId]) {
            db[user][systemState.currentAnimeId].forEach(c => {
                consolidatedCommentsArray.push({
                    username: user,
                    comment: c.comment,
                    timestamp: c.timestamp
                });
            });
        }
    });

    // Sort chronologically reverse order parameters matrix logs
    consolidatedCommentsArray.sort((a,b) => b.timestamp - a.timestamp);

    if (consolidatedCommentsArray.length === 0) {
        timeline.innerHTML = `<p class="loading-text" style="font-size:0.8rem; padding:10px 0;">No critique evaluation postings logged for this asset entry node.</p>`;
        return;
    }

    consolidatedCommentsArray.forEach(item => {
        const commentCard = document.createElement("div");
        commentCard.className = "comment-card-node";
        const localizedDate = new Date(item.timestamp).toLocaleDateString(undefined, {hour: '2-digit', minute:'2-digit'});
        
        commentCard.innerHTML = `
            <div class="comment-meta-row">
                <span>@${item.username}</span>
                <span>${localizedDate}</span>
            </div>
            <p class="comment-text-body">${item.comment}</p>
        `;
        timeline.appendChild(commentCard);
    });
}

/* ==========================================================================
   GLOBAL SYSTEM ALERTS MANAGER (TOAST MODULE SYSTEM)
   ========================================================================== */
function showToastNotificationAlert(messageContentTextString) {
    const toast = document.getElementById("toastNotification");
    toast.innerText = messageContentTextString;
    toast.classList.remove("hidden");
    
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 4500);
}
