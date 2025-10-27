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
const locationBtn = document.getElementById('location-btn');
const locationStatus = document.getElementById('location-status');

let markers = [];
let currentData = [];
let currentCategory = '台派';
let userLocation = null;

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

// Location functionality
locationBtn.addEventListener('click', getCurrentLocation);

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

// GPS Location Functions
function getCurrentLocation() {
    if (!navigator.geolocation) {
        locationStatus.textContent = '您的瀏覽器不支援 GPS 定位功能';
        return;
    }

    locationBtn.disabled = true;
    locationBtn.textContent = '📍 定位中...';
    locationStatus.textContent = '正在取得您的位置...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            locationStatus.textContent = '位置已取得！正在尋找最近的地點...';
            findNearestLocations();
        },
        (error) => {
            locationBtn.disabled = false;
            locationBtn.textContent = '📍 找到我附近的地點';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    locationStatus.textContent = '位置存取被拒絕，請允許位置權限';
                    break;
                case error.POSITION_UNAVAILABLE:
                    locationStatus.textContent = '位置資訊無法取得';
                    break;
                case error.TIMEOUT:
                    locationStatus.textContent = '定位請求逾時';
                    break;
                default:
                    locationStatus.textContent = '定位時發生未知錯誤';
                    break;
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

function findNearestLocations() {
    if (!userLocation || currentData.length === 0) {
        locationStatus.textContent = '無法計算距離：缺少位置或資料';
        locationBtn.disabled = false;
        locationBtn.textContent = '📍 找到我附近的地點';
        return;
    }

    // Calculate distances for all locations
    const locationsWithDistance = currentData.map(location => {
        if (!location.latitude || !location.longitude) return null;
        
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            location.latitude, location.longitude
        );
        
        return {
            ...location,
            distance: distance
        };
    }).filter(location => location !== null);

    // Sort by distance and get top 5
    const nearestLocations = locationsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

    // Update display
    displayNearestLocations(nearestLocations);
    
    // Update status
    locationStatus.textContent = `找到 ${nearestLocations.length} 個最近的地點`;
    locationBtn.disabled = false;
    locationBtn.textContent = '📍 找到我附近的地點';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

function displayNearestLocations(nearestLocations) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add user location marker
    if (userLocation) {
        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
                className: 'user-location-marker',
                html: '📍',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);
        markers.push(userMarker);
    }

    // Add nearest location markers
    nearestLocations.forEach((location, index) => {
        const marker = L.marker([location.latitude, location.longitude]).addTo(map);
        
        // Add popup with distance
        marker.bindPopup(`
            <div>
                <h3>${location.name}</h3>
                <p><strong>距離:</strong> ${location.distance.toFixed(2)} 公里</p>
                <p><strong>類別:</strong> ${location.category}</p>
                <p><strong>地址:</strong> ${location.address}</p>
                <p><strong>評價:</strong> ${location.rating}星 (${location.reviews}則評論)</p>
            </div>
        `);
        
        marker.on('click', () => showLocationDetails(location));
        markers.push(marker);
    });

    // Update list
    updateNearestLocationList(nearestLocations);
    
    // Update count
    locationCount.textContent = `顯示最近 ${nearestLocations.length} 個地點`;

    // Fit map to show all markers
    if (nearestLocations.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function updateNearestLocationList(nearestLocations) {
    listContainer.innerHTML = '';
    
    nearestLocations.forEach((location, index) => {
        const item = document.createElement('div');
        item.className = 'location-item nearest-location';
        item.innerHTML = `
            <h4>${index + 1}. ${location.name}</h4>
            <p><strong>距離:</strong> ${location.distance.toFixed(2)} 公里</p>
            <p>${location.category} - ${location.city} ${location.district}</p>
            <p>${location.rating}星 (${location.reviews}則評論)</p>
        `;
        item.addEventListener('click', () => {
            showLocationDetails(location);
            map.setView([location.latitude, location.longitude], 15);
        });
        listContainer.appendChild(item);
    });
}

// Load default category
loadCategory('台派');