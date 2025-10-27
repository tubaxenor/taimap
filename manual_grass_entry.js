const fs = require('fs');
const yaml = require('js-yaml');
const readline = require('readline');

console.log('🌱 手動輸入草系店家資料工具');
console.log('請從 Google Maps 連結中複製店家資料並輸入');
console.log('');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to ask a question and return a promise
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Function to get coordinates from user
async function getCoordinates() {
    console.log('\n📍 請輸入座標資訊:');
    console.log('💡 提示: 在 Google Maps 中右鍵點擊地點，選擇「這是什麼？」可看到座標');
    
    const lat = await askQuestion('緯度 (latitude): ');
    const lng = await askQuestion('經度 (longitude): ');
    
    return {
        latitude: parseFloat(lat) || null,
        longitude: parseFloat(lng) || null
    };
}

// Function to get location details
async function getLocationDetails() {
    console.log('\n🏪 請輸入店家資訊:');
    
    const name = await askQuestion('店家名稱: ');
    const address = await askQuestion('地址: ');
    const category = await askQuestion('類別 (咖啡廳/餐廳/植物店/生活用品/農產品): ');
    const rating = await askQuestion('評分 (1-5): ');
    const reviews = await askQuestion('評論數量: ');
    const notes = await askQuestion('備註 (可選): ');
    
    // Extract city and district from address
    let city = '台北市';
    let district = '信義區';
    
    if (address.includes('台北市')) {
        city = '台北市';
        const districtMatch = address.match(/([^市]+區)/);
        if (districtMatch) {
            district = districtMatch[1];
        }
    } else if (address.includes('新北市')) {
        city = '新北市';
        const districtMatch = address.match(/([^市]+區)/);
        if (districtMatch) {
            district = districtMatch[1];
        }
    }
    
    const coords = await getCoordinates();
    
    // Generate description
    const description = `${name} - ${category}\n備註: ${notes || '草系風格店家'}\n地址: ${address}\n評價: ${rating}星 (${reviews}則評論)`;
    
    return {
        name: name || '未命名店家',
        city: city,
        district: district,
        category: category || '草系店家',
        notes: notes || '草系風格店家',
        recommender: '',
        search_link: 'https://www.google.com/maps/@12.9071723,18.7316098,3z/data=!4m2!11m1!2sGtRkWPp6RAGC5P3CfdQtCQ?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D',
        address: address || '地址未提供',
        rating: rating || '4.0',
        reviews: reviews || '50',
        latitude: coords.latitude || 25.0330,
        longitude: coords.longitude || 121.5654,
        description: description
    };
}

// Function to load existing data
function loadExistingData() {
    try {
        if (fs.existsSync('data/草.yml')) {
            const content = fs.readFileSync('data/草.yml', 'utf8');
            return yaml.load(content) || [];
        }
    } catch (error) {
        console.log('⚠️ 無法讀取現有資料，將建立新檔案');
    }
    return [];
}

// Function to save data
function saveData(data) {
    try {
        const yamlStr = yaml.dump(data, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
            sortKeys: false
        });
        
        fs.writeFileSync('data/草.yml', yamlStr, 'utf8');
        console.log('✅ 資料已儲存到 data/草.yml');
        return true;
    } catch (error) {
        console.error('❌ 儲存資料時發生錯誤:', error);
        return false;
    }
}

// Main function
async function main() {
    console.log('🌱 草系店家資料手動輸入工具');
    console.log('================================');
    
    // Load existing data
    let locations = loadExistingData();
    console.log(`📊 目前已有 ${locations.length} 個店家`);
    
    if (locations.length > 0) {
        console.log('\n📋 現有店家:');
        locations.forEach((location, index) => {
            console.log(`${index + 1}. ${location.name} - ${location.address}`);
        });
    }
    
    const addMore = await askQuestion('\n是否要新增店家？(y/n): ');
    
    if (addMore.toLowerCase() === 'y' || addMore.toLowerCase() === 'yes') {
        console.log('\n🔄 開始新增店家...');
        
        let continueAdding = true;
        while (continueAdding) {
            try {
                const newLocation = await getLocationDetails();
                locations.push(newLocation);
                
                console.log(`\n✅ 已新增: ${newLocation.name}`);
                
                const addAnother = await askQuestion('\n是否要新增更多店家？(y/n): ');
                continueAdding = (addAnother.toLowerCase() === 'y' || addAnother.toLowerCase() === 'yes');
                
            } catch (error) {
                console.error('❌ 輸入資料時發生錯誤:', error);
                const retry = await askQuestion('是否要重試？(y/n): ');
                if (retry.toLowerCase() !== 'y' && retry.toLowerCase() !== 'yes') {
                    continueAdding = false;
                }
            }
        }
        
        // Save data
        if (saveData(locations)) {
            console.log(`\n🎉 成功！總共 ${locations.length} 個店家已儲存`);
            
            // Show final list
            console.log('\n📋 最終店家清單:');
            locations.forEach((location, index) => {
                console.log(`${index + 1}. ${location.name} - ${location.address}`);
            });
        }
    }
    
    console.log('\n💡 下一步:');
    console.log('1. 檢查 data/草.yml 檔案');
    console.log('2. 測試網站功能');
    console.log('3. 提交變更到 GitHub');
    
    rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 再見！');
    rl.close();
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { getLocationDetails, loadExistingData, saveData };