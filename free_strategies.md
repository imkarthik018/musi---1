


# Strategies for a Free-to-Use Music Web App

This document outlines several strategies and APIs that can be used to build a music web app without requiring users to have a premium subscription, as is the case with the Spotify Web Playback SDK.

### Strategy 1: Use APIs for Royalty-Free & Independent Music

This is the most straightforward and legally sound approach. The music is explicitly cleared for this kind of use.

*   **Free Music Archive (FMA) API:** Provides access to a large library of high-quality, legal audio downloads under Creative Commons licenses.
    *   **Pros:** Clear licensing, direct audio streaming/download links, good for background music or discovery apps.
    *   **Cons:** Catalog consists of independent artists, not mainstream hits.
*   **Jamendo API:** Access to a massive catalog of independent music.
    *   **Pros:** Great for discovering new artists, provides 30-second audio clips for free, and has clear licensing terms.
    *   **Cons:** Not for mainstream music. Full track streaming requires their commercial licensing.

### Strategy 2: Use a Mainstream API with Limitations

These APIs have the music you want, but with restrictions for free users.

*   **Deezer API:** A strong alternative to Spotify.
    *   **Pros:** Has a mainstream catalog. Their SDK allows **30-second audio previews** for all users (free and premium). This is a huge advantage over Spotify's API for a free app.
    *   **Cons:** Full track playback still requires a Deezer Premium account.
*   **SoundCloud API:**
    *   **Pros:** Huge catalog of music, especially from independent and emerging artists.
    *   **Cons:** Their public API has become more restrictive over the years. Direct streaming from their API in a third-party app is technically challenging and may be against their terms of service. It's better for discovery and metadata than for building a full-fledged player.

### Strategy 3: The Hybrid Approach (Metadata + YouTube)

This is a very common and effective workaround to get a mainstream catalog for free.

1.  **Use a Metadata API:** First, you use an API that is great for searching and getting track/album/artist information, but doesn't provide audio.
    *   **Last.fm API:** The gold standard for music metadata. Get top tracks, artist bios, album art, similar artists, etc.
    *   **MusicBrainz API:** An open-source encyclopedia of music data. Incredibly detailed.

2.  **Use YouTube for Playback:** Once you have the track name and artist from the metadata API, you can search for it on YouTube and play it.
    *   **Pros:** You get access to virtually any song for free.
    *   **Cons (IMPORTANT):** You **must** adhere to YouTube's Terms of Service.
        *   You cannot just extract the audio stream. You must use the official **YouTube iFrame Player API** to embed the video player.
        *   Your app cannot play the audio in the background (i.e., when your app is not visible). The player must be visible.
        *   Violating these terms can get your API key revoked.

### Summary Comparison

| API / Strategy          | Mainstream Catalog? | Free Streaming?       | Key Limitation                        |
| :---------------------- | :------------------ | :-------------------- | :------------------------------------ |
| **Free Music Archive**  | No                  | **Yes (Full Tracks)** | Independent artists only              |
| **Jamendo**             | No                  | Yes (30s Previews)    | Independent artists only              |
| **Deezer**              | **Yes**             | Yes (30s Previews)    | Full playback requires Deezer Premium |
| **Last.fm / MusicBrainz**| **Yes**             | No                    | Metadata only, no audio               |
| **Hybrid (Last.fm + YouTube)** | **Yes**             | **Yes (Full Tracks)** | **Must embed visible YouTube player** |

### Recommendation for "Musi"

For your "Musi" app, if you want to keep the mainstream catalog without requiring users to have a premium account, the **Hybrid Approach (Last.fm + YouTube)** is your best bet.

It would involve the following changes:
1.  Remove `spotifyAuth.js` and the login flow.
2.  Replace `spotifyApi.js` with two new modules: `lastFmApi.js` (for searching and getting playlists) and `youtubePlayer.js` (for handling the embedded player).
3.  The UI would fetch data from Last.fm to populate the carousels and search results.
4.  When a user clicks "play," you would use the YouTube iFrame Player API to find and play the corresponding music video in your "Now Playing" section.
