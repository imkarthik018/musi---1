# Musi Home Page Development Plan

This document outlines a detailed plan to enhance the Musi application's home page. The goal is to evolve the current UI into a more dynamic, personalized, and visually engaging experience, drawing inspiration from the Spotify home screen while retaining Musi's unique glassmorphic and futuristic aesthetic.

---

## 1. Project Goal: A "Perfected" Home Page

The primary objective is to transform the home page from a static display of featured content into a personalized dashboard for the user. This involves:

*   **Personalization:** Greet the user and display content relevant to their listening habits.
*   **Visual Hierarchy:** Create a more engaging layout with different types of content sections, not just carousels.
*   **Interactivity:** Ensure every piece of content is playable and interacts seamlessly with the Spotify playback SDK.
*   **Polish:** Refine the styling and animations to deliver a premium user experience.

---

## 2. Inspiration Analysis (`screenshots/spotify.png`)

The Spotify home page provides several key ideas we will adapt:

*   **Personalized Greeting:** The "Good Afternoon" message makes the app feel personal.
*   **Hero Grid:** The top section features a grid of large, prominent items (like playlists or mixes) that are immediately engaging. This is more visually interesting than starting directly with carousels.
*   **Diverse Carousels:** The page includes a variety of carousels based on user data, such as "Made for You," "Recently Played," and "Your Top Shows."

---

## 3. Proposed Home Page Layout

The new home page will be structured in three main sections:

### Section 1: Personalized Greeting & Hero Grid

*   **Greeting:** At the top, a "Good Morning/Afternoon/Evening, [User's Name]" message will be displayed.
*   **Hero Grid:** Below the greeting, a 2x3 grid of "Quick Links" or "Top Picks" will be displayed. These will be larger cards linking to the user's top playlists or Spotify's recommendations.

### Section 2: Dynamic Content Carousels

This section will contain multiple horizontally-scrolling carousels, each with a clear title. We will go beyond the current "Featured Playlists" and "New Releases."

*   **User's Top Tracks:** A carousel of the user's most-played tracks.
*   **Recently Played:** A carousel of the last few tracks the user listened to.
*   **Made for You (Recommendations):** A carousel of recommended tracks based on the user's listening history.
*   **Featured Playlists:** (Keep this) A carousel of Spotify's featured playlists.
*   **New Releases:** (Keep this) A carousel of new album releases.

### Section 3: Seamless Player Integration

All playable items (tracks, playlists, albums) in the hero grid and carousels will have a prominent play button. Clicking this button will:

1.  Instantly start playback via the Spotify Web Playback SDK.
2.  Update the floating "Now Playing" bar with the current track information.
3.  Show the correct play/pause state on the item that was clicked.

---

## 4. Feature Breakdown & Implementation Steps

### Phase 1: Enhance the Spotify API Wrapper (`src/js/spotifyApi.js`)

The first step is to add new functions to our API wrapper to fetch the necessary data for the new UI components.

1.  **Get User's Top Items:**
    *   Create a function `getUserTopItems(type, limit)` where `type` is 'artists' or 'tracks'.
    *   This will call the `GET /v1/me/top/{type}` endpoint.
2.  **Get Recently Played Tracks:**
    *   Create a function `getRecentlyPlayed(limit)`.
    *   This will call the `GET /v1/me/player/recently-played` endpoint.
3.  **Get Recommendations:**
    *   Create a function `getRecommendations(seed_artists, seed_tracks)`.
    *   This will call the `GET /v1/recommendations` endpoint. We can use the user's top artists/tracks as seeds.

### Phase 2: Update UI Logic (`src/js/main.js`)

This is where we'll orchestrate the creation of the new home page.

1.  **Modify `loadAuthenticatedContent()`:**
    *   Fetch the user's profile to get their name for the greeting.
    *   Call the new API functions from Phase 1 to get data for the hero grid and carousels.
    *   Pass this data to new UI generation functions (to be created in Phase 3).
2.  **Implement Greeting Logic:**
    *   Create a simple function to determine the time of day (Morning, Afternoon, Evening).
    *   Dynamically insert the greeting message into the `index.html` DOM.
3.  **Enhance Playback Handling:**
    *   Refine the event listener for play buttons to handle context (e.g., playing a full album/playlist vs. a single track).
    *   When playback starts, ensure the UI updates to show a "pause" icon on the currently playing item.

### Phase 3: Create New UI Components (`src/js/carousel.js` and new files)

We'll need to create functions to generate the HTML for our new components.

1.  **Create `heroGrid.js` (New File):**
    *   Create a function `createHeroGrid(containerId, items)` that generates the HTML for the 2x3 grid of large cards.
    *   Each card will have a background image, a title, and a play button.
2.  **Enhance `carousel.js`:**
    *   Modify `createCarousel()` to be more flexible, handling different types of items (tracks, albums, playlists) and displaying them correctly.
    *   Ensure the play buttons on carousel items have the correct `data-uri` and `data-type` attributes for the playback handler in `main.js`.

### Phase 4: Structure and Styling (`index.html` & `styles.css`)

1.  **Update `index.html`:**
    *   Add new container divs within the `authenticated-content` section to hold the greeting, the hero grid, and the various carousels.
    *   Give them clear IDs (e.g., `greeting-container`, `hero-grid-container`, `top-tracks-carousel`).
2.  **Update `styles.css`:**
    *   Add new CSS rules for the hero grid cards to make them larger and more prominent than the carousel cards.
    *   Add styles for the greeting message.
    *   Refine the hover effects and transitions for all interactive elements to ensure a polished feel.

---

## 5. Success Metrics

The home page enhancement will be considered complete when:

*   The user is greeted by name.
*   The hero grid and all new carousels load correctly with data from the Spotify API.
*   All items on the page are playable.
*   The UI is responsive and looks good on different screen sizes.
*   The overall look and feel are cohesive with the existing Musi design language.
