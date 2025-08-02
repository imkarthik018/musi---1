
import { spotifyAuth } from './spotifyAuth.js';

const BASE_URL = 'https://api.spotify.com/v1';

const spotifyApi = {
    _fetch: async (endpoint, method = 'GET', body = null) => {
        const accessToken = spotifyAuth.getAccessToken();
        if (!accessToken) {
            console.error('No access token available. User not authenticated.');
            // Optionally, redirect to login or show an error
            return null;
        }

        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

        const options = {
            method,
            headers,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, options);
            if (response.status === 401) {
                // Token expired or invalid, try refreshing
                const newAccessToken = await spotifyAuth.refreshAccessToken();
                if (newAccessToken) {
                    headers['Authorization'] = `Bearer ${newAccessToken}`;
                    const refreshedResponse = await fetch(`${BASE_URL}${endpoint}`, options);
                    if (!refreshedResponse.ok) {
                        throw new Error(`Spotify API error after refresh: ${refreshedResponse.status}`);
                    }
                    return refreshedResponse.json();
                } else {
                    console.error('Failed to refresh token.');
                    spotifyAuth.clearTokens();
                    return null;
                }
            }

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error(`Error fetching from Spotify API: ${endpoint}`, error);
            return null;
        }
    },

    getUserProfile: async () => {
        return spotifyApi._fetch('/me');
    },

    getFeaturedPlaylists: async (limit = 6, offset = 0) => {
        return spotifyApi._fetch(`/browse/featured-playlists?limit=${limit}&offset=${offset}`);
    },

    getNewReleases: async (limit = 6, offset = 0) => {
        return spotifyApi._fetch(`/browse/new-releases?limit=${limit}&offset=${offset}`);
    },

    getUserTopItems: async (type = 'tracks', limit = 6, offset = 0) => {
        return spotifyApi._fetch(`/me/top/${type}?limit=${limit}&offset=${offset}`);
    },

    getRecentlyPlayed: async (limit = 6) => {
        return spotifyApi._fetch(`/me/player/recently-played?limit=${limit}`);
    },

    getRecommendations: async (seed_artists, seed_tracks, limit = 6) => {
        const seedParams = new URLSearchParams({
            seed_artists: seed_artists.join(','),
            seed_tracks: seed_tracks.join(','),
            limit: limit
        });
        return spotifyApi._fetch(`/recommendations?${seedParams.toString()}`);
    },

    getUserPlaylists: async (limit = 6, offset = 0) => {
        return spotifyApi._fetch(`/me/playlists?limit=${limit}&offset=${offset}`);
    },

    getPlaylistTracks: async (playlistId) => {
        return spotifyApi._fetch(`/playlists/${playlistId}/tracks`);
    },

    search: async (query, type = 'track,artist,album,playlist', limit = 10, offset = 0) => {
        return spotifyApi._fetch(`/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&offset=${offset}`);
    },

    // Playback control functions (requires 'streaming' scope and Web Playback SDK)
    startPlayback: async (deviceId, uri) => {
        const body = {};
        if (uri.includes(':track:')) {
            // For a single track, we send it in the `uris` array
            body.uris = [uri];
        } else {
            // For an album or playlist, we send it as a `context_uri`
            body.context_uri = uri;
        }
        return spotifyApi._fetch(`/me/player/play?device_id=${deviceId}`, 'PUT', body);
    },

    pausePlayback: async (deviceId) => {
        return spotifyApi._fetch(`/me/player/pause?device_id=${deviceId}`, 'PUT');
    },

    resumePlayback: async (deviceId) => {
        return spotifyApi._fetch(`/me/player/play?device_id=${deviceId}`, 'PUT');
    },

    skipToNext: async (deviceId) => {
        return spotifyApi._fetch(`/me/player/next?device_id=${deviceId}`, 'POST');
    },

    skipToPrevious: async (deviceId) => {
        return spotifyApi._fetch(`/me/player/previous?device_id=${deviceId}`, 'POST');
    },

    setVolume: async (deviceId, volumePercent) => {
        return spotifyApi._fetch(`/me/player/volume?device_id=${deviceId}&volume_percent=${volumePercent}`, 'PUT');
    },

    getPlaybackState: async () => {
        return spotifyApi._fetch('/me/player');
    },

    transferPlayback: async (deviceId, play = true) => {
        return spotifyApi._fetch('/me/player', 'PUT', {
            device_ids: [deviceId],
            play: play,
        });
    }
};

export { spotifyApi };
