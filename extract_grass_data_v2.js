const fs = require('fs');
const yaml = require('js-yaml');

// Enhanced script to extract data from Google Maps shared links
console.log('🌱 草系店家資料提取工具 v2');
console.log('');

// Function to analyze HTML file
function analyzeHtmlFile(filename) {
    try {
        const htmlContent = fs.readFileSync(filename, 'utf8');
        console.log(`📄 分析檔案: ${filename}`);
        console.log(`📄 HTML 檔案大小: ${htmlContent.length} 字元`);
        
        // Look for various patterns that might contain location data
        const patterns = [
            { name: 'name', regex: /"name":\s*"([^"]+)"/g },
            { name: 'title', regex: /"title":\s*"([^"]+)"/g },
            { name: 'address', regex: /"address":\s*"([^"]+)"/g },
            { name: 'rating', regex: /"rating":\s*"([^"]+)"/g },
            { name: 'lat', regex: /"lat":\s*([0-9.-]+)/g },
            { name: 'lng', regex: /"lng":\s*([0-9.-]+)/g },
            { name: 'latitude', regex: /"latitude":\s*([0-9.-]+)/g },
            { name: 'longitude', regex: /"longitude":\s*([0-9.-]+)/g },
            { name: 'place_name', regex: /"place_name":\s*"([^"]+)"/g },
            { name: 'formatted_address', regex: /"formatted_address":\s*"([^"]+)"/g },
            { name: 'vicinity', regex: /"vicinity":\s*"([^"]+)"/g },
            { name: 'types', regex: /"types":\s*\[([^\]]+)\]/g }
        ];
        
        const foundData = {};
        
        patterns.forEach(pattern => {
            const matches = [...htmlContent.matchAll(pattern.regex)];
            if (matches.length > 0) {
                foundData[pattern.name] = matches.map(match => match[1] || match[0]);
                console.log(`✅ 找到 ${matches.length} 個匹配: ${pattern.name}`);
            }
        });
        
        // Look for specific Google Maps data structures
        const jsonPatterns = [
            { name: 'APP_INITIALIZATION_STATE', regex: /window\.APP_INITIALIZATION_STATE\s*=\s*(\[.*?\])/g },
            { name: 'APP_INITIALIZATION_DATA', regex: /window\.APP_INITIALIZATION_DATA\s*=\s*(\{.*?\})/g },
            { name: 'places_data', regex: /"places":\s*(\[.*?\])/g },
            { name: 'results_data', regex: /"results":\s*(\[.*?\])/g },
            { name: 'data_array', regex: /"data":\s*(\[.*?\])/g }
        ];
        
        jsonPatterns.forEach(pattern => {
            const matches = [...htmlContent.matchAll(pattern.regex)];
            if (matches.length > 0) {
                console.log(`🔍 找到 JSON 資料: ${pattern.name}`);
                matches.forEach((match, i) => {
                    try {
                        const jsonData = JSON.parse(match[1]);
                        console.log(`  JSON ${i + 1}:`, typeof jsonData, Array.isArray(jsonData) ? `(${jsonData.length} items)` : '');
                        
                        // Try to extract location data from JSON
                        if (Array.isArray(jsonData)) {
                            jsonData.forEach((item, index) => {
                                if (item && typeof item === 'object') {
                                    const locationData = extractLocationFromObject(item);
                                    if (locationData) {
                                        console.log(`    地點 ${index + 1}: ${locationData.name || 'Unknown'}`);
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        console.log(`  JSON ${i + 1}: 解析失敗`);
                    }
                });
            }
        });
        
        return foundData;
        
    } catch (error) {
        console.error(`❌ 讀取檔案 ${filename} 時發生錯誤:`, error);
        return null;
    }
}

// Extract location data from a JSON object
function extractLocationFromObject(obj) {
    const location = {};
    
    // Try different possible field names
    const nameFields = ['name', 'title', 'place_name', 'business_name'];
    const addressFields = ['address', 'formatted_address', 'vicinity', 'location_address'];
    const ratingFields = ['rating', 'user_rating_total', 'score'];
    const latFields = ['lat', 'latitude', 'location_lat'];
    const lngFields = ['lng', 'longitude', 'location_lng'];
    
    nameFields.forEach(field => {
        if (obj[field] && !location.name) location.name = obj[field];
    });
    
    addressFields.forEach(field => {
        if (obj[field] && !location.address) location.address = obj[field];
    });
    
    ratingFields.forEach(field => {
        if (obj[field] && !location.rating) location.rating = obj[field];
    });
    
    latFields.forEach(field => {
        if (obj[field] && !location.latitude) location.latitude = obj[field];
    });
    
    lngFields.forEach(field => {
        if (obj[field] && !location.longitude) location.longitude = obj[field];
    });
    
    return Object.keys(location).length > 0 ? location : null;
}

// Create sample 草 data based on Taiwan locations
function createSampleGrassData() {
    const sampleData = [
        {
            name: "草系咖啡廳",
            city: "台北市",
            district: "信義區",
            category: "咖啡廳",
            notes: "草系風格咖啡廳，使用有機咖啡豆",
            recommender: "",
            search_link: "https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m3!11m2!2sGtRkWPp6RAGC5P3CfdQtCQ!3e3?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D",
            address: "信義區信義路五段7號",
            rating: "4.5",
            reviews: "120",
            latitude: 25.0330,
            longitude: 121.5654,
            description: "草系咖啡廳 - 咖啡廳\n備註: 草系風格咖啡廳，使用有機咖啡豆\n地址: 信義區信義路五段7號\n評價: 4.5星 (120則評論)"
        },
        {
            name: "綠色生活館",
            city: "台北市",
            district: "大安區",
            category: "生活用品",
            notes: "環保生活用品專賣，推廣永續生活",
            recommender: "",
            search_link: "https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m3!11m2!2sGtRkWPp6RAGC5P3CfdQtCQ!3e3?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D",
            address: "大安區敦化南路二段216號",
            rating: "4.2",
            reviews: "85",
            latitude: 25.0260,
            longitude: 121.5430,
            description: "綠色生活館 - 生活用品\n備註: 環保生活用品專賣，推廣永續生活\n地址: 大安區敦化南路二段216號\n評價: 4.2星 (85則評論)"
        },
        {
            name: "自然風餐廳",
            city: "台北市",
            district: "中山區",
            category: "餐廳",
            notes: "有機食材餐廳，提供健康餐點",
            recommender: "",
            search_link: "https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m3!11m2!2sGtRkWPp6RAGC5P3CfdQtCQ!3e3?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D",
            address: "中山區南京東路二段118號",
            rating: "4.7",
            reviews: "156",
            latitude: 25.0520,
            longitude: 121.5280,
            description: "自然風餐廳 - 餐廳\n備註: 有機食材餐廳，提供健康餐點\n地址: 中山區南京東路二段118號\n評價: 4.7星 (156則評論)"
        },
        {
            name: "植栽工作室",
            city: "台北市",
            district: "松山區",
            category: "植物店",
            notes: "專業植栽設計與販售",
            recommender: "",
            search_link: "https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m3!11m2!2sGtRkWPp6RAGC5P3CfdQtCQ!3e3?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D",
            address: "松山區民生東路四段56號",
            rating: "4.8",
            reviews: "92",
            latitude: 25.0580,
            longitude: 121.5550,
            description: "植栽工作室 - 植物店\n備註: 專業植栽設計與販售\n地址: 松山區民生東路四段56號\n評價: 4.8星 (92則評論)"
        },
        {
            name: "有機農場直營店",
            city: "台北市",
            district: "內湖區",
            category: "農產品",
            notes: "直接從農場到餐桌，新鮮有機蔬果",
            recommender: "",
            search_link: "https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m3!11m2!2sGtRkWPp6RAGC5P3CfdQtCQ!3e3?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D",
            address: "內湖區成功路四段188號",
            rating: "4.6",
            reviews: "203",
            latitude: 25.0680,
            longitude: 121.5880,
            description: "有機農場直營店 - 農產品\n備註: 直接從農場到餐桌，新鮮有機蔬果\n地址: 內湖區成功路四段188號\n評價: 4.6星 (203則評論)"
        }
    ];
    
    return sampleData;
}

// Create 草.yml file
function createGrassYml(data) {
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
        data.forEach((location, index) => {
            console.log(`${index + 1}. ${location.name} - ${location.address}`);
        });
        
    } catch (error) {
        console.error('❌ 建立檔案時發生錯誤:', error);
    }
}

// Main execution
function main() {
    console.log('🔍 分析 Google Maps HTML 檔案...');
    
    // Analyze both HTML files
    const files = ['google_maps_page.html', 'google_maps_new.html'];
    let allFoundData = {};
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            const foundData = analyzeHtmlFile(file);
            if (foundData) {
                Object.keys(foundData).forEach(key => {
                    if (!allFoundData[key]) allFoundData[key] = [];
                    allFoundData[key] = allFoundData[key].concat(foundData[key]);
                });
            }
        }
    });
    
    if (Object.keys(allFoundData).length > 0) {
        console.log('\n📊 找到的資料總計:');
        Object.keys(allFoundData).forEach(key => {
            console.log(`${key}: ${allFoundData[key].length} 個項目`);
        });
    } else {
        console.log('❌ 無法從 HTML 檔案中提取到有效資料');
    }
    
    console.log('\n🌱 建立 草.yml 檔案...');
    const sampleData = createSampleGrassData();
    createGrassYml(sampleData);
    
    console.log('\n💡 下一步:');
    console.log('1. 檢查 data/草.yml 檔案');
    console.log('2. 手動編輯檔案，添加真實的店家資料');
    console.log('3. 從 Google Maps 連結中複製真實的店家資訊');
    console.log('4. 更新經緯度座標');
    console.log('5. 測試網站功能');
}

if (require.main === module) {
    main();
}

module.exports = { analyzeHtmlFile, createSampleGrassData, createGrassYml };