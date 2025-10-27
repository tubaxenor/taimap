const map = L.map('map').setView([23.973837, 120.982025], 8); // Centered on Taiwan

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const categoryButtons = document.querySelectorAll('#category-switcher button');
const locationDetails = document.getElementById('location-details');
const locationCount = document.getElementById('location-count');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const listContainer = document.getElementById('list-container');

let markers = [];
let currentData = [];
let currentCategory = '台派';

// Category button event listeners
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const category = button.dataset.category;
        currentCategory = category;
        loadCategory(category);
    });
});

// Search functionality
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        displayAllLocations();
        return;
    }
    
    const filteredData = currentData.filter(location => 
        location.name.toLowerCase().includes(searchTerm) ||
        location.category.toLowerCase().includes(searchTerm) ||
        location.address.toLowerCase().includes(searchTerm) ||
        location.city.toLowerCase().includes(searchTerm) ||
        location.district.toLowerCase().includes(searchTerm) ||
        (location.notes && location.notes.toLowerCase().includes(searchTerm))
    );
    
    displayFilteredLocations(filteredData);
}

function displayAllLocations() {
    displayFilteredLocations(currentData);
}

function displayFilteredLocations(data) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Create new markers
    data.forEach(location => {
        if (location.latitude && location.longitude) {
            const marker = L.marker([location.latitude, location.longitude]).addTo(map);
            marker.on('click', () => showLocationDetails(location));
            markers.push(marker);
        }
    });
    
    // Update list
    updateLocationList(data);
    
    // Update count
    locationCount.textContent = `顯示 ${data.length} 個地點`;
}

function updateLocationList(data) {
    listContainer.innerHTML = '';
    
    data.slice(0, 50).forEach(location => { // Limit to first 50 for performance
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <h4>${location.name}</h4>
            <p>${location.category} - ${location.city} ${location.district}</p>
            <p>${location.rating}星 (${location.reviews}則評論)</p>
        `;
        item.addEventListener('click', () => {
            showLocationDetails(location);
            map.setView([location.latitude, location.longitude], 15);
        });
        listContainer.appendChild(item);
    });
    
    if (data.length > 50) {
        const moreItem = document.createElement('div');
        moreItem.className = 'location-item';
        moreItem.innerHTML = `<p style="text-align: center; color: #7f8c8d;">還有 ${data.length - 50} 個地點，請使用搜尋功能縮小範圍</p>`;
        listContainer.appendChild(moreItem);
    }
}

function showLocationDetails(location) {
    locationDetails.querySelector('h2').textContent = location.name;
    locationDetails.querySelector('p').textContent = location.description;
}

async function loadCategory(category) {
    try {
        const response = await fetch(`data/${category}.yml`);
        if (!response.ok) {
            throw new Error(`Failed to load data for category: ${category}`);
        }
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        
        currentData = data;
        
        // Update count
        locationCount.textContent = `載入 ${data.length} 個地點`;
        
        // Display all locations initially
        displayAllLocations();
        
    } catch (error) {
        console.error(error);
        locationDetails.querySelector('h2').textContent = '載入錯誤';
        locationDetails.querySelector('p').textContent = `無法載入 ${category} 類別的資料。`;
        locationCount.textContent = '載入失敗';
    }
}

// Load default category
loadCategory('台派');