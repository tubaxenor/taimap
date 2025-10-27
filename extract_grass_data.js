const fs = require('fs');
const yaml = require('js-yaml');

// Enhanced script to extract data from Google Maps shared links
// This script will try multiple approaches to extract location data

console.log('🌱 草系店家資料提取工具');
console.log('Google Maps 連結: https://maps.app.goo.gl/U6xzWpGJgR1m8X236');
console.log('');

// Read the downloaded HTML file
function analyzeHtmlFile() {
    try {
        const htmlContent = fs.readFileSync('google_maps_page.html', 'utf8');
        console.log(`📄 HTML 檔案大小: ${htmlContent.length} 字元`);
        
        // Look for various patterns that might contain location data
        const patterns = [
            /"name":\s*"([^"]+)"/g,
            /"title":\s*"([^"]+)"/g,
            /"address":\s*"([^"]+)"/g,
            /"rating":\s*"([^"]+)"/g,
            /"lat":\s*([0-9.-]+)/g,
            /"lng":\s*([0-9.-]+)/g,
            /"latitude":\s*([0-9.-]+)/g,
            /"longitude":\s*([0-9.-]+)/g,
            /<title>([^<]+)<\/title>/g,
            /<h1[^>]*>([^<]+)<\/h1>/g,
            /<h2[^>]*>([^<]+)<\/h2>/g,
            /<h3[^>]*>([^<]+)<\/h3>/g
        ];
        
        const foundData = {};
        
        patterns.forEach((pattern, index) => {
            const matches = [...htmlContent.matchAll(pattern)];
            if (matches.length > 0) {
                const key = `pattern_${index}`;
                foundData[key] = matches.map(match => match[1] || match[0]);
                console.log(`✅ 找到 ${matches.length} 個匹配: ${key}`);
            }
        });
        
        // Look for specific Google Maps data structures
        const jsonPatterns = [
            /window\.APP_INITIALIZATION_STATE\s*=\s*(\[.*?\])/g,
            /window\.APP_INITIALIZATION_DATA\s*=\s*(\{.*?\})/g,
            /"data":\s*(\[.*?\])/g,
            /"places":\s*(\[.*?\])/g
        ];
        
        jsonPatterns.forEach((pattern, index) => {
            const matches = [...htmlContent.matchAll(pattern)];
            if (matches.length > 0) {
                console.log(`🔍 找到 JSON 資料: pattern_${index}`);
                matches.forEach((match, i) => {
                    try {
                        const jsonData = JSON.parse(match[1]);
                        console.log(`  JSON ${i + 1}:`, typeof jsonData, Array.isArray(jsonData) ? `(${jsonData.length} items)` : '');
                    } catch (e) {
                        console.log(`  JSON ${i + 1}: 解析失敗`);
                    }
                });
            }
        });
        
        return foundData;
        
    } catch (error) {
        console.error('❌ 讀取 HTML 檔案時發生錯誤:', error);
        return null;
    }
}

// Create sample 草 data based on common patterns
function createSampleGrassData() {
    // This is a sample dataset for 草 category
    // You can replace this with actual data from the Google Maps link
    const sampleData = [
        {
            name: "草系咖啡廳",
            city: "台北市",
            district: "信義區",
            category: "咖啡廳",
            notes: "草系風格咖啡廳",
            recommender: "",
            search_link: "https://maps.app.goo.gl/U6xzWpGJgR1m8X236",
            address: "信義區信義路五段7號",
            rating: "4.5",
            reviews: "120",
            latitude: 25.0330,
            longitude: 121.5654,
            description: "草系咖啡廳 - 咖啡廳\n備註: 草系風格咖啡廳\n地址: 信義區信義路五段7號\n評價: 4.5星 (120則評論)"
        },
        {
            name: "綠色生活館",
            city: "台北市",
            district: "大安區",
            category: "生活用品",
            notes: "環保生活用品專賣",
            recommender: "",
            search_link: "https://maps.app.goo.gl/U6xzWpGJgR1m8X236",
            address: "大安區敦化南路二段216號",
            rating: "4.2",
            reviews: "85",
            latitude: 25.0260,
            longitude: 121.5430,
            description: "綠色生活館 - 生活用品\n備註: 環保生活用品專賣\n地址: 大安區敦化南路二段216號\n評價: 4.2星 (85則評論)"
        },
        {
            name: "自然風餐廳",
            city: "台北市",
            district: "中山區",
            category: "餐廳",
            notes: "有機食材餐廳",
            recommender: "",
            search_link: "https://maps.app.goo.gl/U6xzWpGJgR1m8X236",
            address: "中山區南京東路二段118號",
            rating: "4.7",
            reviews: "156",
            latitude: 25.0520,
            longitude: 121.5280,
            description: "自然風餐廳 - 餐廳\n備註: 有機食材餐廳\n地址: 中山區南京東路二段118號\n評價: 4.7星 (156則評論)"
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
    const foundData = analyzeHtmlFile();
    
    if (foundData && Object.keys(foundData).length > 0) {
        console.log('\n📊 找到的資料:');
        Object.keys(foundData).forEach(key => {
            console.log(`${key}: ${foundData[key].length} 個項目`);
        });
    } else {
        console.log('❌ 無法從 HTML 檔案中提取到有效資料');
    }
    
    console.log('\n🌱 建立範例 草.yml 檔案...');
    const sampleData = createSampleGrassData();
    createGrassYml(sampleData);
    
    console.log('\n💡 下一步:');
    console.log('1. 檢查 data/草.yml 檔案');
    console.log('2. 手動編輯檔案，添加真實的店家資料');
    console.log('3. 從 Google Maps 連結中複製真實的店家資訊');
    console.log('4. 更新經緯度座標');
}

if (require.main === module) {
    main();
}

module.exports = { analyzeHtmlFile, createSampleGrassData, createGrassYml };