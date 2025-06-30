const CLIENT_ID = '5061bee8e0a84d35a3aef36dc488de31'; // Replace with your Spotify Client ID
const REDIRECT_URI = 'http://127.0.0.1:5500/callback.html'; // Replace with your redirect URI

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'code';
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'user-library-modify',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'app-remote-control',
    'streaming',
    'user-top-read',
    'user-read-recently-played'
];

const spotifyAuth = {
    login: () => {
        const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join('%20')}`;
        window.location.href = authUrl;
    },

    handleCallback: async () => {
        console.log('spotifyAuth.js: handleCallback called.');
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log('spotifyAuth.js: Authorization code received:', code);

        if (code) {
            try {
                console.log('spotifyAuth.js: Attempting to exchange code for tokens...');
                const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + '998328ae269d440fb18b6e276819e2dc')
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: REDIRECT_URI
                    })
                });

                if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    throw new Error(`HTTP error! status: ${tokenResponse.status}, response: ${errorText}`);
                }

                const data = await tokenResponse.json();
                console.log('spotifyAuth.js: Tokens received:', data);
                spotifyAuth.saveTokens(data.access_token, data.refresh_token, data.expires_in);
                console.log('spotifyAuth.js: Tokens saved. Redirecting to home page...');
                window.location.href = '/'; // Redirect to home page
            } catch (error) {
                console.error('spotifyAuth.js: Error exchanging code for tokens:', error);
                // Optionally, redirect to an error page or show a message
                window.location.href = '/?error=auth_failed';
            }
        } else {
            console.error('spotifyAuth.js: No authorization code found in URL.');
            window.location.href = '/?error=no_code';
        }
    },

    saveTokens: (accessToken, refreshToken, expiresIn) => {
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_refresh_token', refreshToken);
        localStorage.setItem('spotify_token_expires_at', Date.now() + expiresIn * 1000);
        console.log('spotifyAuth.js: Tokens successfully stored in localStorage.');
    },

    getAccessToken: () => {
        const accessToken = localStorage.getItem('spotify_access_token');
        const expiresAt = localStorage.getItem('spotify_token_expires_at');

        if (!accessToken || !expiresAt) {
            console.log('spotifyAuth.js: No access token or expiry found in localStorage.');
            return null;
        }

        if (Date.now() < expiresAt) {
            console.log('spotifyAuth.js: Access token is valid.');
            return accessToken;
        }

        console.log('spotifyAuth.js: Access token expired. Attempting to refresh...');
        return spotifyAuth.refreshAccessToken();
    },

    getRefreshToken: () => {
        return localStorage.getItem('spotify_refresh_token');
    },

    refreshAccessToken: async () => {
        console.log('spotifyAuth.js: refreshAccessToken called.');
        const refreshToken = spotifyAuth.getRefreshToken();
        if (!refreshToken) {
            console.error('spotifyAuth.js: No refresh token available.');
            spotifyAuth.clearTokens();
            return null;
        }

        try {
            const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + '998328ae269d440fb18b6e276819e2dc')
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                })
            });

            if (!refreshResponse.ok) {
                const errorText = await refreshResponse.text();
                throw new Error(`HTTP error! status: ${refreshResponse.status}, response: ${errorText}`);
            }

            const data = await refreshResponse.json();
            console.log('spotifyAuth.js: Refreshed tokens received:', data);
            spotifyAuth.saveTokens(data.access_token, data.refresh_token || refreshToken, data.expires_in);
            return data.access_token;
        } catch (error) {
            console.error('spotifyAuth.js: Error refreshing access token:', error);
            spotifyAuth.clearTokens();
            return null;
        }
    },

    clearTokens: () => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expires_at');
        console.log('spotifyAuth.js: All tokens cleared from localStorage.');
        // Optionally, redirect to login page
        window.location.href = '/';
    },

    isAuthenticated: () => {
        const token = spotifyAuth.getAccessToken();
        console.log('spotifyAuth.js: isAuthenticated check. Token:', token ? 'Exists' : 'Does not exist');
        return !!token;
    }
};

export { spotifyAuth };