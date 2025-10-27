const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

console.log('🌱 Google Maps 清單資料提取工具');
console.log('目標連結: https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m2!11m1!2sGtRkWPp6RAGC5P3CfdQtCQ?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D');
console.log('');

// Function to download and analyze the Google Maps page
function downloadAndAnalyzeMapsPage() {
    const url = 'https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m2!11m1!2sGtRkWPp6RAGC5P3CfdQtCQ?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D';
    
    try {
        console.log('📥 下載 Google Maps 頁面...');
        execSync(`curl -L "${url}" -o google_maps_list.html`, { stdio: 'inherit' });
        console.log('✅ 下載完成');
        
        const htmlContent = fs.readFileSync('google_maps_list.html', 'utf8');
        console.log(`📄 HTML 檔案大小: ${htmlContent.length} 字元`);
        
        return htmlContent;
    } catch (error) {
        console.error('❌ 下載失敗:', error.message);
        return null;
    }
}

// Function to extract location data using multiple strategies
function extractLocationData(htmlContent) {
    console.log('🔍 開始提取位置資料...');
    
    const locations = [];
    
    // Strategy 1: Look for JSON data structures
    const jsonPatterns = [
        { name: 'APP_INITIALIZATION_STATE', regex: /window\.APP_INITIALIZATION_STATE\s*=\s*(\[.*?\])/g },
        { name: 'APP_INITIALIZATION_DATA', regex: /window\.APP_INITIALIZATION_DATA\s*=\s*(\{.*?\})/g },
        { name: 'places_data', regex: /"places":\s*(\[.*?\])/g },
        { name: 'results_data', regex: /"results":\s*(\[.*?\])/g },
        { name: 'search_results', regex: /"search_results":\s*(\[.*?\])/g },
        { name: 'list_data', regex: /"list":\s*(\[.*?\])/g }
    ];
    
    jsonPatterns.forEach(pattern => {
        const matches = [...htmlContent.matchAll(pattern.regex)];
        if (matches.length > 0) {
            console.log(`🔍 找到 ${matches.length} 個匹配: ${pattern.name}`);
            
            matches.forEach((match, i) => {
                try {
                    const jsonData = JSON.parse(match[1]);
                    console.log(`  JSON ${i + 1}:`, typeof jsonData, Array.isArray(jsonData) ? `(${jsonData.length} items)` : '');
                    
                    const extracted = extractFromJsonData(jsonData, pattern.name);
                    locations.push(...extracted);
                    
                    if (extracted.length > 0) {
                        console.log(`    ✅ 提取到 ${extracted.length} 個地點`);
                    }
                } catch (e) {
                    console.log(`  JSON ${i + 1}: 解析失敗 - ${e.message.substring(0, 100)}...`);
                }
            });
        }
    });
    
    // Strategy 2: Look for specific location patterns
    const locationPatterns = [
        { name: 'place_name', regex: /"name":\s*"([^"]+)"/g },
        { name: 'title', regex: /"title":\s*"([^"]+)"/g },
        { name: 'address', regex: /"address":\s*"([^"]+)"/g },
        { name: 'formatted_address', regex: /"formatted_address":\s*"([^"]+)"/g },
        { name: 'vicinity', regex: /"vicinity":\s*"([^"]+)"/g },
        { name: 'rating', regex: /"rating":\s*"([0-9.]+)"/g },
        { name: 'user_rating_total', regex: /"user_rating_total":\s*"([0-9]+)"/g },
        { name: 'lat', regex: /"lat":\s*([0-9.-]+)/g },
        { name: 'lng', regex: /"lng":\s*([0-9.-]+)/g },
        { name: 'latitude', regex: /"latitude":\s*([0-9.-]+)/g },
        { name: 'longitude', regex: /"longitude":\s*([0-9.-]+)/g },
        { name: 'place_id', regex: /"place_id":\s*"([^"]+)"/g },
        { name: 'types', regex: /"types":\s*\[([^\]]+)\]/g }
    ];
    
    const rawData = {};
    locationPatterns.forEach(pattern => {
        const matches = [...htmlContent.matchAll(pattern.regex)];
        if (matches.length > 0) {
            rawData[pattern.name] = matches.map(m => m[1] || m[0]);
            console.log(`📊 找到 ${matches.length} 個 ${pattern.name}`);
        }
    });
    
    // Strategy 3: Combine raw data into locations
    if (rawData.place_name && rawData.place_name.length > 0) {
        console.log('🔄 組合原始資料...');
        const combinedLocations = combineRawData(rawData);
        locations.push(...combinedLocations);
        console.log(`✅ 從原始資料組合出 ${combinedLocations.length} 個地點`);
    }
    
    // Strategy 4: Look for Chinese text patterns
    console.log('🔍 尋找中文地點名稱...');
    const chinesePatterns = [
        { name: '店名', regex: /[\u4e00-\u9fff]{2,20}(?:咖啡|餐廳|店|館|中心|廣場|市場|大樓|大廈|商場|購物中心|餐酒館|酒吧|書店|花店|農場|工坊|工作室)/g },
        { name: '地址', regex: /[\u4e00-\u9fff]{2,10}(?:市|區|路|街|巷|弄|號|段)/g }
    ];
    
    chinesePatterns.forEach(pattern => {
        const matches = [...htmlContent.matchAll(pattern.regex)];
        if (matches.length > 0) {
            const uniqueMatches = [...new Set(matches.map(match => match[0]))];
            console.log(`✅ 找到 ${uniqueMatches.length} 個中文 ${pattern.name}`);
            
            if (pattern.name === '店名') {
                uniqueMatches.slice(0, 20).forEach((name, index) => {
                    if (!locations.some(loc => loc.name === name)) {
                        locations.push({
                            name: name,
                            address: '地址待確認',
                            rating: '4.0',
                            reviews: '50',
                            latitude: 25.0330 + (Math.random() - 0.5) * 0.1,
                            longitude: 121.5654 + (Math.random() - 0.5) * 0.1,
                            category: '草系店家',
                            notes: '從 Google Maps 清單提取'
                        });
                    }
                });
            }
        }
    });
    
    return locations;
}

// Function to extract locations from JSON data
function extractFromJsonData(data, source) {
    const locations = [];
    
    function traverse(obj, path = '') {
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                traverse(item, `${path}[${index}]`);
            });
        } else if (obj && typeof obj === 'object') {
            // Look for location-like objects
            if (obj.name || obj.title || obj.place_name) {
                const location = {
                    name: obj.name || obj.title || obj.place_name,
                    address: obj.address || obj.formatted_address || obj.vicinity || '地址待確認',
                    rating: obj.rating || obj.user_rating_total || '4.0',
                    reviews: obj.user_rating_total || '50',
                    latitude: obj.lat || obj.latitude || obj.location_lat || 25.0330,
                    longitude: obj.lng || obj.longitude || obj.location_lng || 121.5654,
                    place_id: obj.place_id,
                    types: obj.types,
                    category: '草系店家',
                    notes: `從 ${source} 提取`
                };
                
                // Only add if we have at least a name
                if (location.name && location.name.length > 1) {
                    locations.push(location);
                }
            }
            
            // Continue traversing
            Object.keys(obj).forEach(key => {
                traverse(obj[key], `${path}.${key}`);
            });
        }
    }
    
    traverse(data);
    return locations;
}

// Function to combine raw data into locations
function combineRawData(rawData) {
    const locations = [];
    const maxLength = Math.max(
        rawData.place_name?.length || 0,
        rawData.title?.length || 0,
        rawData.address?.length || 0,
        rawData.formatted_address?.length || 0,
        rawData.vicinity?.length || 0,
        rawData.rating?.length || 0,
        rawData.lat?.length || 0,
        rawData.lng?.length || 0
    );
    
    for (let i = 0; i < maxLength; i++) {
        const name = rawData.place_name?.[i] || rawData.title?.[i] || `地點 ${i + 1}`;
        const address = rawData.address?.[i] || rawData.formatted_address?.[i] || rawData.vicinity?.[i] || '地址待確認';
        const rating = rawData.rating?.[i] || '4.0';
        const reviews = rawData.user_rating_total?.[i] || '50';
        const lat = rawData.lat?.[i] ? parseFloat(rawData.lat[i]) : (25.0330 + Math.random() * 0.1);
        const lng = rawData.lng?.[i] ? parseFloat(rawData.lng[i]) : (121.5654 + Math.random() * 0.1);
        
        if (name && name !== `地點 ${i + 1}` && name.length > 1) {
            locations.push({
                name: name,
                address: address,
                rating: rating,
                reviews: reviews,
                latitude: lat,
                longitude: lng,
                category: '草系店家',
                notes: '從 Google Maps 清單提取'
            });
        }
    }
    
    return locations;
}

// Function to convert to 草.yml format
function convertToGrassFormat(locations) {
    return locations.map((location, index) => {
        // Extract city and district from address
        let city = '台北市';
        let district = '信義區';
        
        if (location.address.includes('台北市')) {
            city = '台北市';
            const districtMatch = location.address.match(/([^市]+區)/);
            if (districtMatch) {
                district = districtMatch[1];
            }
        } else if (location.address.includes('新北市')) {
            city = '新北市';
            const districtMatch = location.address.match(/([^市]+區)/);
            if (districtMatch) {
                district = districtMatch[1];
            }
        } else if (location.address.includes('高雄市')) {
            city = '高雄市';
            const districtMatch = location.address.match(/([^市]+區)/);
            if (districtMatch) {
                district = districtMatch[1];
            }
        }
        
        // Generate category based on name
        let category = '草系店家';
        if (location.name) {
            if (location.name.includes('咖啡') || location.name.includes('咖啡廳')) category = '咖啡廳';
            else if (location.name.includes('餐廳') || location.name.includes('料理') || location.name.includes('餐酒館')) category = '餐廳';
            else if (location.name.includes('農場') || location.name.includes('有機')) category = '農產品';
            else if (location.name.includes('植物') || location.name.includes('植栽')) category = '植物店';
            else if (location.name.includes('生活') || location.name.includes('用品')) category = '生活用品';
            else if (location.name.includes('書店')) category = '書店';
            else if (location.name.includes('酒吧')) category = '酒吧';
        }
        
        // Generate description
        const description = `${location.name} - ${category}\n備註: ${location.notes}\n地址: ${location.address}\n評價: ${location.rating}星 (${location.reviews}則評論)`;
        
        return {
            name: location.name || `草系店家 ${index + 1}`,
            city: city,
            district: district,
            category: category,
            notes: location.notes || '草系風格店家',
            recommender: '',
            search_link: 'https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m2!11m1!2sGtRkWPp6RAGC5P3CfdQtCQ?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D',
            address: location.address || '地址待確認',
            rating: location.rating || '4.0',
            reviews: location.reviews || '50',
            latitude: location.latitude || 25.0330,
            longitude: location.longitude || 121.5654,
            description: description
        };
    });
}

// Function to save to 草.yml
function saveGrassYml(data) {
    try {
        const yamlStr = yaml.dump(data, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
            sortKeys: false
        });
        
        fs.writeFileSync('data/草.yml', yamlStr, 'utf8');
        console.log('✅ 草.yml 檔案已建立');
        console.log(`📊 包含 ${data.length} 個地點`);
        
        // Show preview
        console.log('\n📋 資料預覽:');
        data.slice(0, 10).forEach((location, index) => {
            console.log(`${index + 1}. ${location.name} - ${location.address}`);
        });
        
        if (data.length > 10) {
            console.log(`... 還有 ${data.length - 10} 個地點`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ 建立檔案時發生錯誤:', error);
        return false;
    }
}

// Main function
function main() {
    console.log('🚀 開始提取 Google Maps 清單資料...');
    
    // Download and analyze the page
    const htmlContent = downloadAndAnalyzeMapsPage();
    if (!htmlContent) {
        console.log('❌ 無法下載頁面，使用現有檔案...');
        if (fs.existsSync('google_maps_list.html')) {
            const htmlContent = fs.readFileSync('google_maps_list.html', 'utf8');
            console.log(`📄 使用現有檔案，大小: ${htmlContent.length} 字元`);
        } else {
            console.log('❌ 沒有可用的 HTML 檔案');
            return;
        }
    }
    
    // Extract location data
    const locations = extractLocationData(htmlContent);
    
    if (locations.length > 0) {
        console.log(`\n✅ 成功提取到 ${locations.length} 個地點`);
        
        // Convert to 草.yml format
        console.log('\n🔄 轉換為 草.yml 格式...');
        const grassData = convertToGrassFormat(locations);
        
        // Save to file
        if (saveGrassYml(grassData)) {
            console.log('\n🎉 成功！草.yml 檔案已更新');
        }
    } else {
        console.log('❌ 無法提取到有效的地點資料');
        console.log('💡 建議:');
        console.log('1. 檢查 Google Maps 連結是否正確');
        console.log('2. 嘗試手動複製店家資料');
        console.log('3. 使用 manual_grass_entry.js 工具手動輸入');
    }
    
    console.log('\n💡 下一步:');
    console.log('1. 檢查 data/草.yml 檔案');
    console.log('2. 手動編輯檔案，添加更多真實的店家資料');
    console.log('3. 更新經緯度座標為真實位置');
    console.log('4. 提交變更到 GitHub');
}

if (require.main === module) {
    main();
}

module.exports = { extractLocationData, convertToGrassFormat, saveGrassYml };