const fs = require('fs');

console.log('🔍 Google Maps HTML 分析工具');
console.log('');

// Function to analyze HTML file for location data
function analyzeHtmlFile(filename) {
    try {
        const htmlContent = fs.readFileSync(filename, 'utf8');
        console.log(`📄 分析檔案: ${filename}`);
        console.log(`📄 HTML 檔案大小: ${htmlContent.length} 字元`);
        
        // Look for various patterns that might contain location names
        const patterns = [
            { name: 'title tags', regex: /<title[^>]*>([^<]+)<\/title>/gi },
            { name: 'h1 tags', regex: /<h1[^>]*>([^<]+)<\/h1>/gi },
            { name: 'h2 tags', regex: /<h2[^>]*>([^<]+)<\/h2>/gi },
            { name: 'h3 tags', regex: /<h3[^>]*>([^<]+)<\/h3>/gi },
            { name: 'span with text', regex: /<span[^>]*>([^<]{10,100})<\/span>/gi },
            { name: 'div with text', regex: /<div[^>]*>([^<]{10,100})<\/div>/gi },
            { name: 'JSON data', regex: /"name":\s*"([^"]+)"/gi },
            { name: 'JSON title', regex: /"title":\s*"([^"]+)"/gi },
            { name: 'JSON address', regex: /"address":\s*"([^"]+)"/gi },
            { name: 'JSON rating', regex: /"rating":\s*"([^"]+)"/gi },
            { name: 'JSON lat', regex: /"lat":\s*([0-9.-]+)/gi },
            { name: 'JSON lng', regex: /"lng":\s*([0-9.-]+)/gi }
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
        console.log('\n🔍 尋找 Google Maps 特定資料結構...');
        
        const googlePatterns = [
            { name: 'APP_INITIALIZATION_STATE', regex: /window\.APP_INITIALIZATION_STATE\s*=\s*(\[.*?\])/g },
            { name: 'APP_INITIALIZATION_DATA', regex: /window\.APP_INITIALIZATION_DATA\s*=\s*(\{.*?\})/g },
            { name: 'places array', regex: /"places":\s*(\[.*?\])/g },
            { name: 'results array', regex: /"results":\s*(\[.*?\])/g },
            { name: 'data array', regex: /"data":\s*(\[.*?\])/g },
            { name: 'place_id', regex: /"place_id":\s*"([^"]+)"/g },
            { name: 'formatted_address', regex: /"formatted_address":\s*"([^"]+)"/g },
            { name: 'vicinity', regex: /"vicinity":\s*"([^"]+)"/g },
            { name: 'types', regex: /"types":\s*\[([^\]]+)\]/g }
        ];
        
        googlePatterns.forEach(pattern => {
            const matches = [...htmlContent.matchAll(pattern.regex)];
            if (matches.length > 0) {
                console.log(`🔍 找到 ${matches.length} 個匹配: ${pattern.name}`);
                
                // Show first few matches
                const preview = matches.slice(0, 3).map(match => {
                    const content = match[1] || match[0];
                    return content.length > 100 ? content.substring(0, 100) + '...' : content;
                });
                
                preview.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item}`);
                });
                
                if (matches.length > 3) {
                    console.log(`  ... 還有 ${matches.length - 3} 個項目`);
                }
            }
        });
        
        // Look for Chinese text that might be location names
        console.log('\n🔍 尋找中文地點名稱...');
        const chinesePatterns = [
            { name: '中文店名', regex: /[\u4e00-\u9fff]{2,10}(?:咖啡|餐廳|店|館|中心|廣場|市場|大樓|大廈|商場|購物中心)/g },
            { name: '中文地址', regex: /[\u4e00-\u9fff]{2,10}(?:市|區|路|街|巷|弄|號)/g },
            { name: '中文描述', regex: /[\u4e00-\u9fff]{5,50}/g }
        ];
        
        chinesePatterns.forEach(pattern => {
            const matches = [...htmlContent.matchAll(pattern.regex)];
            if (matches.length > 0) {
                console.log(`✅ 找到 ${matches.length} 個匹配: ${pattern.name}`);
                
                // Show unique matches
                const uniqueMatches = [...new Set(matches.map(match => match[0]))];
                const preview = uniqueMatches.slice(0, 10);
                
                preview.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item}`);
                });
                
                if (uniqueMatches.length > 10) {
                    console.log(`  ... 還有 ${uniqueMatches.length - 10} 個項目`);
                }
            }
        });
        
        return foundData;
        
    } catch (error) {
        console.error(`❌ 讀取檔案 ${filename} 時發生錯誤:`, error);
        return null;
    }
}

// Function to extract coordinates from HTML
function extractCoordinates(htmlContent) {
    const coordPatterns = [
        { name: 'lat', regex: /"lat":\s*([0-9.-]+)/g },
        { name: 'lng', regex: /"lng":\s*([0-9.-]+)/g },
        { name: 'latitude', regex: /"latitude":\s*([0-9.-]+)/g },
        { name: 'longitude', regex: /"longitude":\s*([0-9.-]+)/g }
    ];
    
    const coords = {};
    coordPatterns.forEach(pattern => {
        const matches = [...htmlContent.matchAll(pattern.regex)];
        if (matches.length > 0) {
            coords[pattern.name] = matches.map(match => parseFloat(match[1]));
            console.log(`📍 找到 ${matches.length} 個 ${pattern.name} 座標`);
        }
    });
    
    return coords;
}

// Main execution
function main() {
    const files = ['google_maps_actual.html', 'google_maps_page.html', 'google_maps_new.html'];
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`\n${'='.repeat(50)}`);
            const foundData = analyzeHtmlFile(file);
            
            if (foundData) {
                console.log(`\n📊 ${file} 分析結果:`);
                Object.keys(foundData).forEach(key => {
                    console.log(`${key}: ${foundData[key].length} 個項目`);
                });
            }
        }
    });
    
    console.log('\n💡 建議:');
    console.log('1. 如果找到有用的資料，可以手動複製到 草.yml 檔案');
    console.log('2. 使用 manual_grass_entry.js 工具手動輸入店家資料');
    console.log('3. 從 Google Maps 連結中直接複製店家資訊');
}

if (require.main === module) {
    main();
}

module.exports = { analyzeHtmlFile, extractCoordinates };