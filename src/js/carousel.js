
const createCarousel = (containerId, title, items) => {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Carousel container with ID '${containerId}' not found.`);
        return;
    }

    let carouselHtml = `
        <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-grip-horizontal text-musi-accent mr-2"></i>
                ${title}
            </h2>
            <div class="flex overflow-x-scroll space-x-4 pb-4 custom-scrollbar">
    `;

    items.forEach(item => {
        const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : 'https://via.placeholder.com/150';
        const itemName = item.name || item.title || 'Unknown';
        const itemArtist = item.artists && item.artists.length > 0 ? item.artists[0].name : (item.owner ? item.owner.display_name : '');
        const itemType = item.type || 'unknown';

        carouselHtml += `
            <div class="flex-none w-40 group">
                <div class="relative mb-3 rounded-xl overflow-hidden aspect-square shadow-lg">
                    <img src="${imageUrl}" alt="${itemName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <button class="absolute bottom-2 right-2 w-10 h-10 bg-musi-accent text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 play-button" data-uri="${item.uri}" data-type="${itemType}">
                        <i class="fas fa-play text-sm"></i>
                    </button>
                </div>
                <h3 class="font-medium text-white truncate">${itemName}</h3>
                <p class="text-sm text-gray-400 truncate">${itemArtist}</p>
            </div>
        `;
    });

    carouselHtml += `
            </div>
        </div>
    `;

    container.innerHTML = carouselHtml;

    // Add event listeners for play buttons
    container.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const uri = e.currentTarget.dataset.uri;
            const type = e.currentTarget.dataset.type;
            console.log(`Play button clicked for ${type}: ${uri}`);
            // This will be handled by the Spotify Web Playback SDK in main.js
            // For now, just log it.
        });
    });
};

export { createCarousel };
