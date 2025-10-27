const puppeteer = require('puppeteer');
const fs = require('fs');
const yaml = require('js-yaml');

// Web scraping script for Google Maps data extraction
// Note: This requires puppeteer to be installed: npm install puppeteer

async function scrapeGoogleMaps(url) {
    console.log('🚀 開始爬取 Google Maps 資料...');
    console.log('連結:', url);
    
    const browser = await puppeteer.launch({ 
        headless: false, // Set to true for headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log('📱 正在載入頁面...');
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for the map to load
        await page.waitForTimeout(3000);
        
        console.log('🔍 正在尋找地點標記...');
        
        // Try to find and click on markers or list items
        const locations = await page.evaluate(() => {
            const results = [];
            
            // Look for various selectors that might contain location data
            const selectors = [
                '[data-value="Directions"]',
                '.section-result',
                '.section-result-content',
                '.place-result',
                '.search-result',
                '[role="listitem"]'
            ];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                console.log(`Found ${elements.length} elements with selector: ${selector}`);
                
                elements.forEach((element, index) => {
                    try {
                        const name = element.querySelector('h3, .section-result-title, .place-name')?.textContent?.trim();
                        const address = element.querySelector('.section-result-location, .address')?.textContent?.trim();
                        const rating = element.querySelector('.section-star-display, .rating')?.textContent?.trim();
                        
                        if (name) {
                            results.push({
                                name: name,
                                address: address || '',
                                rating: rating || '',
                                index: index
                            });
                        }
                    } catch (error) {
                        console.log('Error processing element:', error);
                    }
                });
            }
            
            return results;
        });
        
        console.log(`📊 找到 ${locations.length} 個地點`);
        
        // Process each location to get more details
        const processedLocations = [];
        
        for (let i = 0; i < Math.min(locations.length, 10); i++) { // Limit to first 10 for testing
            const location = locations[i];
            console.log(`🔍 處理地點 ${i + 1}: ${location.name}`);
            
            try {
                // Try to click on the location to get more details
                const clickableElement = await page.$(`[data-value="Directions"]:nth-child(${i + 1})`);
                if (clickableElement) {
                    await clickableElement.click();
                    await page.waitForTimeout(2000);
                    
                    // Extract detailed information
                    const details = await page.evaluate(() => {
                        const name = document.querySelector('h1, .x3AX1-LfntMc-header-title-title')?.textContent?.trim();
                        const address = document.querySelector('.Io6YTe, .LrzXr')?.textContent?.trim();
                        const rating = document.querySelector('.ceNzKf, .Aq14fc')?.textContent?.trim();
                        const reviews = document.querySelector('.UY7F9, .fontBodyMedium')?.textContent?.trim();
                        
                        return {
                            name: name || '',
                            address: address || '',
                            rating: rating || '',
                            reviews: reviews || ''
                        };
                    });
                    
                    processedLocations.push({
                        ...location,
                        ...details
                    });
                }
            } catch (error) {
                console.log(`❌ 處理地點 ${location.name} 時發生錯誤:`, error.message);
                processedLocations.push(location);
            }
        }
        
        return processedLocations;
        
    } catch (error) {
        console.error('❌ 爬取過程中發生錯誤:', error);
        return [];
    } finally {
        await browser.close();
    }
}

// Convert scraped data to YAML format
function convertToYamlFormat(locations) {
    return locations.map((location, index) => {
        // Generate mock coordinates for Taiwan (you'll need to get real coordinates)
        const mockLat = 25.0330 + (Math.random() - 0.5) * 0.1;
        const mockLng = 121.5654 + (Math.random() - 0.5) * 0.1;
        
        return {
            name: location.name || `地點 ${index + 1}`,
            city: "台北市", // You'll need to extract this from address
            district: "信義區", // You'll need to extract this from address
            category: "草系店家",
            notes: "從 Google Maps 提取",
            recommender: "",
            search_link: "https://maps.app.goo.gl/U6xzWpGJgR1m8X236",
            address: location.address || "",
            rating: location.rating || "0",
            reviews: location.reviews || "0",
            latitude: mockLat,
            longitude: mockLng,
            description: `${location.name} - 草系店家\n備註: 從 Google Maps 提取\n地址: ${location.address}\n評價: ${location.rating}星 (${location.reviews}則評論)`
        };
    });
}

// Main execution
async function main() {
    const url = 'https://maps.app.goo.gl/U6xzWpGJgR1m8X236';
    
    console.log('⚠️  注意: 此腳本需要安裝 puppeteer');
    console.log('執行: npm install puppeteer');
    console.log('');
    
    try {
        const locations = await scrapeGoogleMaps(url);
        console.log(`✅ 成功爬取 ${locations.length} 個地點`);
        
        if (locations.length > 0) {
            const yamlData = convertToYamlFormat(locations);
            const yamlStr = yaml.dump(yamlData, {
                indent: 2,
                lineWidth: 120,
                noRefs: true,
                sortKeys: false
            });
            
            fs.writeFileSync('data/草.yml', yamlStr, 'utf8');
            console.log('✅ 草.yml 檔案已建立');
        } else {
            console.log('❌ 沒有找到任何地點資料');
        }
        
    } catch (error) {
        console.error('❌ 執行失敗:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { scrapeGoogleMaps, convertToYamlFormat };