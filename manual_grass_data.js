const fs = require('fs');
const yaml = require('js-yaml');

// Manual data entry for 草 category
// Please add the data from the Google Maps link here

const grassData = [
    // Add your data here following this format:
    // {
    //     name: "店家名稱",
    //     city: "縣市",
    //     district: "行政區",
    //     category: "類別",
    //     notes: "備註",
    //     recommender: "推薦者",
    //     search_link: "Google Maps 連結",
    //     address: "詳細地址",
    //     rating: "評價",
    //     reviews: "評論數",
    //     latitude: 緯度數字,
    //     longitude: 經度數字,
    //     description: "自動生成的描述"
    // }
    
    // Example entry (replace with real data):
    {
        name: "草系咖啡廳",
        city: "台北市",
        district: "信義區",
        category: "咖啡廳",
        notes: "草系風格咖啡廳",
        recommender: "",
        search_link: "https://maps.app.goo.gl/example",
        address: "信義區信義路五段7號",
        rating: "4.5",
        reviews: "120",
        latitude: 25.0330,
        longitude: 121.5654,
        description: "草系咖啡廳 - 咖啡廳\n備註: 草系風格咖啡廳\n地址: 信義區信義路五段7號\n評價: 4.5星 (120則評論)"
    }
];

// Function to create 草.yml file
function createGrassYml() {
    try {
        const yamlStr = yaml.dump(grassData, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
            sortKeys: false
        });
        
        fs.writeFileSync('data/草.yml', yamlStr, 'utf8');
        console.log('✅ 草.yml 檔案已建立');
        console.log(`📊 包含 ${grassData.length} 個地點`);
        
        // Show the first few entries as preview
        console.log('\n📋 資料預覽:');
        grassData.slice(0, 3).forEach((location, index) => {
            console.log(`${index + 1}. ${location.name} - ${location.address}`);
        });
        
    } catch (error) {
        console.error('❌ 建立檔案時發生錯誤:', error);
    }
}

// Function to help with coordinate lookup
function showCoordinateHelp() {
    console.log('\n🗺️  如何取得經緯度座標:');
    console.log('1. 在 Google Maps 中搜尋店家');
    console.log('2. 右鍵點擊店家位置');
    console.log('3. 選擇第一個選項（通常是座標）');
    console.log('4. 複製座標（格式: 25.0330, 121.5654）');
    console.log('5. 將座標分別填入 latitude 和 longitude 欄位');
    console.log('\n💡 或者使用線上工具: https://www.latlong.net/');
}

// Function to validate data
function validateData() {
    const errors = [];
    
    grassData.forEach((location, index) => {
        if (!location.name) errors.push(`地點 ${index + 1}: 缺少名稱`);
        if (!location.latitude || isNaN(location.latitude)) errors.push(`地點 ${index + 1}: 緯度無效`);
        if (!location.longitude || isNaN(location.longitude)) errors.push(`地點 ${index + 1}: 經度無效`);
        if (!location.address) errors.push(`地點 ${index + 1}: 缺少地址`);
    });
    
    if (errors.length > 0) {
        console.log('❌ 資料驗證錯誤:');
        errors.forEach(error => console.log(`  - ${error}`));
        return false;
    } else {
        console.log('✅ 資料驗證通過');
        return true;
    }
}

// Main execution
console.log('🌱 草系店家資料建立工具');
console.log('Google Maps 連結: https://maps.app.goo.gl/U6xzWpGJgR1m8X236');
console.log('');

if (process.argv.includes('--help')) {
    showCoordinateHelp();
} else if (process.argv.includes('--validate')) {
    validateData();
} else if (process.argv.includes('--create')) {
    if (validateData()) {
        createGrassYml();
    } else {
        console.log('❌ 請修正資料錯誤後再試');
    }
} else {
    console.log('使用方式:');
    console.log('node manual_grass_data.js --help     # 顯示座標取得說明');
    console.log('node manual_grass_data.js --validate # 驗證資料');
    console.log('node manual_grass_data.js --create   # 建立 草.yml 檔案');
    console.log('');
    console.log('📝 請先編輯此檔案，將 Google Maps 的資料添加到 grassData 陣列中');
}