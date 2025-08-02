
import { spotifyAuth } from './spotifyAuth.js';
import { spotifyApi } from './spotifyApi.js';
import { createCarousel } from './carousel.js';
import { createHeroGrid } from './heroGrid.js';

// --- Global State ---
let spotifyPlayer = null;
let deviceId = null;

// --- SDK Ready Promise ---
// This promise will resolve when the Spotify SDK is ready.
const sdkReady = new Promise(resolve => {
    document.addEventListener('spotifySdkReady', () => {
        console.log('Spotify SDK is ready (main.js listener).');
        resolve();
    });
});

// --- Main Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('main.js: DOMContentLoaded fired.');

    const spotifyLoginButton = document.getElementById('spotify-login-button');
    const preAuthContent = document.getElementById('pre-auth-content');
    const authenticatedContent = document.getElementById('authenticated-content');

    if (spotifyAuth.isAuthenticated()) {
        console.log('main.js: User is authenticated.');
        preAuthContent.classList.add('hidden');
        authenticatedContent.classList.remove('hidden');
        initializeApp();
    } else {
        console.log('main.js: User is not authenticated.');
        preAuthContent.classList.remove('hidden');
        authenticatedContent.classList.add('hidden');
        spotifyLoginButton.addEventListener('click', () => {
            console.log('main.js: Login button clicked.');
            spotifyAuth.login();
        });
    }
});

// --- Application Initialization (for authenticated users) ---
async function initializeApp() {
    // 1. Wait for the SDK to be ready
    await sdkReady;

    // 2. Initialize the Spotify Player
    initializeSpotifyPlayer();

    // 3. Load dynamic content
    await loadDynamicContent();

    // 4. Set up all UI event listeners
    initializeUIEventListeners();
}

// --- Spotify Player Initialization ---
function initializeSpotifyPlayer() {
    const token = spotifyAuth.getAccessToken();
    if (!token) {
        console.error('No access token for Spotify Player.');
        return;
    }

    spotifyPlayer = new Spotify.Player({
        name: 'Musi Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    addPlayerListeners();
    spotifyPlayer.connect();
}

function addPlayerListeners() {
    spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Player is ready with Device ID', device_id);
        deviceId = device_id;
        spotifyApi.transferPlayback(deviceId);
    });

    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    spotifyPlayer.addListener('player_state_changed', (state) => {
        if (state) {
            updateNowPlayingUI(state.track_window.current_track, state.paused);
        }
    });

    spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication Error:', message);
        spotifyAuth.clearTokens();
    });

    // Add other error listeners as needed...
}

function updateNowPlayingUI(track, isPaused) {
    const floatingBar = document.getElementById('floating-now-playing');
    if (!track) {
        floatingBar.classList.remove('visible');
        return;
    }

    floatingBar.querySelector('img').src = track.album.images[0]?.url || '';
    floatingBar.querySelector('h4').textContent = track.name;
    floatingBar.querySelector('p').textContent = `${track.artists.map(a => a.name).join(', ')} • ${track.album.name}`;
    
    const playPauseIcon = floatingBar.querySelector('#play-pause-button i');
    playPauseIcon.classList.toggle('fa-play', isPaused);
    playPauseIcon.classList.toggle('fa-pause', !isPaused);

    floatingBar.classList.add('visible');
}

// --- UI Event Listeners ---
function initializeUIEventListeners() {
    // Player Controls
    document.getElementById('play-pause-button').addEventListener('click', () => spotifyPlayer?.togglePlay());
    document.getElementById('prev-button').addEventListener('click', () => spotifyPlayer?.previousTrack());
    document.getElementById('next-button').addEventListener('click', () => spotifyPlayer?.nextTrack());

    // Content Playback (Carousels & Hero Grid)
    document.getElementById('authenticated-content').addEventListener('click', (e) => {
        const playButton = e.target.closest('.play-button');
        if (playButton && deviceId) {
            const uri = playButton.dataset.uri;
            const type = playButton.dataset.type;
            console.log(`Playing ${type}: ${uri}`);
            spotifyApi.startPlayback(deviceId, uri);
        }
    });

    // Tab Switching
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            contentSections.forEach(s => s.classList.remove('active'));
            document.getElementById(tabId)?.classList.add('active');
            navItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-tab') === tabId));
            history.pushState(null, null, `#${tabId}`);
        });
    });

    // Set initial tab
    const initialTab = window.location.hash.substring(1) || 'home-content';
    document.querySelector(`.nav-item[data-tab="${initialTab}"]`)?.click();
}

// --- Dynamic Content Loading ---
async function loadDynamicContent() {
    try {
        console.log('Loading dynamic content...');
        
        // Load featured playlists
        const featuredPlaylists = await spotifyApi.getFeaturedPlaylists(6, 0);
        if (featuredPlaylists && featuredPlaylists.playlists) {
            createCarousel('featured-playlists-carousel', 'Featured Playlists', featuredPlaylists.playlists.items);
        }
        
        // Load new releases
        const newReleases = await spotifyApi.getNewReleases(6, 0);
        if (newReleases && newReleases.albums) {
            createCarousel('new-releases-carousel', 'New Releases', newReleases.albums.items);
        }
        
        // Load user's top tracks
        const topTracks = await spotifyApi.getUserTopItems('tracks', 6, 0);
        if (topTracks && topTracks.items) {
            createHeroGrid('hero-grid-container', topTracks.items);
        }
        
        console.log('Dynamic content loaded successfully');
    } catch (error) {
        console.error('Error loading dynamic content:', error);
    }
}

// --- Utility Functions ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};
