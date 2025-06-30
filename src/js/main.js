
import { spotifyAuth } from './spotifyAuth.js';
import { spotifyApi } from './spotifyApi.js';
import { createCarousel } from './carousel.js';

let spotifyPlayer = null;
let deviceId = null;
let isPremiumUser = false;

// Global UI elements (declared here to be accessible by SDK callbacks)
let floatingNowPlaying;
let nowPlayingAlbumArt;
let nowPlayingTitle;
let nowPlayingArtist;
let playPauseButton;
let prevButton;
let nextButton;

// Function to update the Now Playing bar UI
const updateNowPlayingUI = (track) => {
    if (track) {
        nowPlayingAlbumArt.src = track.album.images[0]?.url || '';
        nowPlayingTitle.textContent = track.name;
        nowPlayingArtist.textContent = `${track.artists.map(artist => artist.name).join(', ')} • ${track.album.name}`;
        floatingNowPlaying.classList.add('visible');

        const icon = playPauseButton.querySelector('i');
        if (track.paused) {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        } else {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
        }
    } else {
        floatingNowPlaying.classList.remove('visible');
    }
};

// Function to load authenticated content
const loadAuthenticatedContent = async () => {
    console.log('main.js: Loading authenticated content.');
    const preAuthContent = document.getElementById('pre-auth-content');
    const authenticatedContent = document.getElementById('authenticated-content');

    if (preAuthContent) preAuthContent.classList.add('hidden');
    if (authenticatedContent) authenticatedContent.classList.remove('hidden');

    const userProfile = await spotifyApi.getUserProfile();
    if (userProfile && userProfile.product) {
        isPremiumUser = (userProfile.product === 'premium');
        console.log('main.js: User product type:', userProfile.product, ', isPremiumUser:', isPremiumUser);
    }

    if (!isPremiumUser) {
        authenticatedContent.innerHTML = `
            <div class="text-center py-10">
                <h2 class="text-3xl font-bold text-red-400 mb-4">Premium Account Required</h2>
                <p class="text-gray-400 mb-6">Spotify playback and some content features are restricted to Premium users.</p>
                <p class="text-gray-400">Please upgrade your Spotify account to enjoy full functionality.</p>
            </div>
        `;
        // Disable play buttons and SDK initialization for free users
        if (playPauseButton) playPauseButton.style.display = 'none';
        if (prevButton) prevButton.style.display = 'none';
        if (nextButton) nextButton.style.display = 'none';
        return;
    }

    // Fetch and display featured playlists
    const featuredPlaylistsData = await spotifyApi.getFeaturedPlaylists();
    if (featuredPlaylistsData && featuredPlaylistsData.playlists && featuredPlaylistsData.playlists.items) {
        createCarousel('featured-playlists-carousel', 'Featured Playlists', featuredPlaylistsData.playlists.items);
    } else {
        console.warn('main.js: Could not fetch featured playlists.', featuredPlaylistsData);
        // Optionally display a message or fallback content
    }

    // Fetch and display new releases
    const newReleasesData = await spotifyApi.getNewReleases();
    if (newReleasesData && newReleasesData.albums && newReleasesData.albums.items) {
        createCarousel('new-releases-carousel', 'New Releases', newReleasesData.albums.items);
    } else {
        console.warn('main.js: Could not fetch new releases.', newReleasesData);
        // Optionally display a message or fallback content
    }

    // Initialize Spotify Web Playback SDK only for premium users
    window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('main.js: Spotify Web Playback SDK is ready.');
        const token = spotifyAuth.getAccessToken();
        if (!token) {
            console.error('Spotify Web Playback SDK: No access token.');
            return;
        }

        spotifyPlayer = new Spotify.Player({
            name: 'Musi Web Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });

        // Ready
        spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            deviceId = device_id;
            // Transfer playback to this device
            spotifyApi.transferPlayback(deviceId);
        });

        // Not Ready
        spotifyPlayer.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        // Error handling
        spotifyPlayer.addListener('initialization_error', ({ message }) => {
            console.error(message);
        });
        spotifyPlayer.addListener('authentication_error', ({ message }) => {
            console.error(message);
            spotifyAuth.clearTokens(); // Clear tokens if authentication fails
        });
        spotifyPlayer.addListener('account_error', ({ message }) => {
            console.error(message);
        });
        spotifyPlayer.addListener('playback_error', ({ message }) => {
            console.error(message);
        });

        // Playback status updates
        spotifyPlayer.addListener('player_state_changed', state => {
            if (!state) {
                return;
            }
            updateNowPlayingUI(state.track_window.current_track);
        });

        // Connect to the player!
        spotifyPlayer.connect();
    };
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('main.js: DOMContentLoaded fired.');

    // Initialize global UI elements
    floatingNowPlaying = document.getElementById('floating-now-playing');
    nowPlayingAlbumArt = floatingNowPlaying.querySelector('#floating-now-playing img');
    nowPlayingTitle = floatingNowPlaying.querySelector('#floating-now-playing h4');
    nowPlayingArtist = floatingNowPlaying.querySelector('#floating-now-playing p');
    playPauseButton = floatingNowPlaying.querySelector('.fa-play')?.parentElement || floatingNowPlaying.querySelector('.fa-pause')?.parentElement;
    prevButton = floatingNowPlaying.querySelector('.fa-step-backward')?.parentElement;
    nextButton = floatingNowPlaying.querySelector('.fa-step-forward')?.parentElement;

    // Tab switching functionality (existing code)
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    let nowPlayingObserver;
    let currentTab = 'home-content'; // Track current tab

    // Function to set up Intersection Observer for Now Playing card
    function setupNowPlayingObserver() {
        const nowPlayingCard = document.querySelector('#home-content .now-playing-card');
        
        // If we're not on the home page, show the floating bar
        if (currentTab !== 'home-content') {
            showFloatingBar();
            return;
        }

        // If there's no Now Playing card on the page, show the floating bar
        if (!nowPlayingCard) {
            showFloatingBar();
            return;
        }

        // Disconnect previous observer if it exists
        if (nowPlayingObserver) {
            nowPlayingObserver.disconnect();
        }

        // Create new observer
        nowPlayingObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Card is in view, hide floating bar
                        hideFloatingBar();
                    } else {
                        // Card is out of view, show floating bar
                        showFloatingBar();
                    }
                });
            },
            {
                threshold: 0.1, // Trigger when 10% of the card is visible
                rootMargin: '-80px 0px 0px 0px' // Adjust this to control when the floating bar appears
            }
        );

        // Start observing the Now Playing card
        nowPlayingObserver.observe(nowPlayingCard);
    }


    // Function to show the floating Now Playing bar
    function showFloatingBar() {
        if (floatingNowPlaying) {
            floatingNowPlaying.classList.add('visible');
        }
    }


    // Function to hide the floating Now Playing bar
    function hideFloatingBar() {
        if (floatingNowPlaying) {
            floatingNowPlaying.classList.remove('visible');
        }
    }

    // Function to switch tabs
    function switchTab(tabId) {
        // Update current tab
        currentTab = tabId;
        
        // Hide all content sections
        contentSections.forEach(section => {
            section.classList.remove('active');
        });

        // Show the selected content section
        const activeSection = document.getElementById(tabId);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // Update active nav item
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            }
        });

        // Update URL hash
        history.pushState(null, null, `#${tabId}`);
        
        // Set up the observer for the Now Playing card when on home tab
        if (tabId === 'home-content') {
            // Small delay to ensure the content is loaded
            setTimeout(setupNowPlayingObserver, 100);
        } else {
            // On other tabs, always show the floating bar
            showFloatingBar();
        }
    }


    // Add click event listeners to nav items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Check URL hash on page load
    const initialTab = window.location.hash.substring(1);
    if (initialTab) {
        switchTab(initialTab);
    } else {
        // Default to home if no hash
        switchTab('home-content');
    }
    
    // Initial setup for Now Playing observer
    if (currentTab === 'home-content') {
        // Wait for the home content to be loaded
        const checkHomeContent = setInterval(() => {
            const homeContent = document.getElementById('home-content');
            if (homeContent && homeContent.children.length > 0) {
                clearInterval(checkHomeContent);
                setupNowPlayingObserver();
            }
        }, 100);
    }

    // Add hover effect for glass cards
    const glassCards = document.querySelectorAll('.glass-card');
    
    glassCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Add parallax effect to background
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.body.style.setProperty('--mouse-x', x);
        document.body.style.setProperty('--mouse-y', y);
    });

    // Prevent content shift when scrollbar appears/disappears
    function handleResize() {
        document.documentElement.style.setProperty('--scrollbar-width', (window.innerWidth - document.documentElement.clientWidth) + 'px');
    }
    
    // Initial call
    handleResize();
    window.addEventListener('resize', handleResize);

    // Spotify Login Integration
    const spotifyLoginButton = document.getElementById('spotify-login-button');

    console.log('main.js: spotifyLoginButton element:', spotifyLoginButton);

    if (spotifyLoginButton) {
        spotifyLoginButton.addEventListener('click', () => {
            console.log('main.js: Login button clicked.');
            spotifyAuth.login();
        });
    }

    // Play/Pause button event listener
    if (playPauseButton) {
        playPauseButton.addEventListener('click', async () => {
            console.log('main.js: Play/Pause button clicked.');
            if (spotifyPlayer) {
                const state = await spotifyPlayer.getCurrentState();
                if (state.paused) {
                    spotifyPlayer.resume();
                } else {
                    spotifyPlayer.pause();
                }
            }
        });
    }

    // Previous button event listener
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            console.log('main.js: Previous button clicked.');
            if (spotifyPlayer) {
                spotifyPlayer.previousTrack();
            }
        });
    }

    // Next button event listener
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log('main.js: Next button clicked.');
            if (spotifyPlayer) {
                spotifyPlayer.nextTrack();
            }
        });
    }

    // Handle play button clicks from carousels
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.play-button')) {
            const button = e.target.closest('.play-button');
            const uri = button.dataset.uri;
            const type = button.dataset.type;

            console.log(`main.js: Carousel play button clicked for ${type}: ${uri}`);

            if (deviceId && uri) {
                if (type === 'track') {
                    await spotifyApi.playTrack(deviceId, uri);
                } else if (type === 'playlist' || type === 'album') {
                    // For playlists/albums, play the first track
                    // You might want to fetch the tracks first and then play a specific one
                    await spotifyApi.playTrack(deviceId, uri);
                }
            } else {
                console.warn('Device ID or URI not available for playback.');
            }
        }
    });

    // Check authentication status on page load
    if (spotifyAuth.isAuthenticated()) {
        console.log('main.js: User is authenticated with Spotify.');
        loadAuthenticatedContent();
    } else {
        console.log('main.js: User is not authenticated with Spotify.');
        if (preAuthContent) preAuthContent.classList.remove('hidden');
        if (authenticatedContent) authenticatedContent.classList.add('hidden');
    }
});
