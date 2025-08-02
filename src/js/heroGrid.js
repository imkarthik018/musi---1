const createHeroGrid = (containerId, items) => {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Hero grid container with ID '${containerId}' not found.`);
        return;
    }

    let gridHtml = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';

    items.forEach(item => {
        const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : (item.album && item.album.images && item.album.images.length > 0 ? item.album.images[0].url : 'https://via.placeholder.com/150');
        const itemName = item.name || item.title || 'Unknown';
        const itemType = item.type || 'unknown';

        gridHtml += `
            <div class="bg-gray-800 rounded-lg overflow-hidden flex items-center group relative cursor-pointer play-button" data-uri="${item.uri}" data-type="${itemType}">
                <img src="${imageUrl}" alt="${itemName}" class="w-16 h-16 object-cover">
                <h3 class="font-medium text-white ml-4 flex-1 truncate">${itemName}</h3>
                <div class="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="w-10 h-10 bg-musi-accent text-black rounded-full flex items-center justify-center play-button" data-uri="${item.uri}" data-type="${itemType}">
                        <i class="fas fa-play text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    });

    gridHtml += '</div>';
    container.innerHTML = gridHtml;
};

export { createHeroGrid };
