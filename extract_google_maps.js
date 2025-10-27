const fs = require('fs');
const yaml = require('js-yaml');

// This script helps extract data from Google Maps links
// For the 草 category, we'll need to manually input the data or use web scraping

console.log('Google Maps Data Extractor for 草 category');
console.log('Link: https://maps.app.goo.gl/U6xzWpGJgR1m8X236');

// Sample data structure for 草 category
// You'll need to manually input the data from the Google Maps link
const sampleGrassData = [
    {
        name: "示例店家1",
        city: "台北市",
        district: "信義區",
        category: "咖啡廳",
        notes: "草系咖啡廳",
        recommender: "",
        search_link: "https://maps.app.goo.gl/example1",
        address: "信義區信義路五段7號",
        rating: "4.5",
        reviews: "120",
        latitude: 25.0330,
        longitude: 121.5654,
        description: "示例店家1 - 咖啡廳\n備註: 草系咖啡廳\n地址: 信義區信義路五段7號\n評價: 4.5星 (120則評論)"
    }
    // Add more locations here...
];

// Function to create 草.yml file
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
    } catch (error) {
        console.error('❌ 建立檔案時發生錯誤:', error);
    }
}

// Function to help with manual data entry
function createDataEntryTemplate() {
    const template = {
        name: "店家名稱",
        city: "縣市",
        district: "行政區", 
        category: "類別",
        notes: "備註",
        recommender: "推薦者",
        search_link: "Google Maps 連結",
        address: "詳細地址",
        rating: "評價",
        reviews: "評論數",
        latitude: "緯度",
        longitude: "經度"
    };
    
    console.log('\n📝 資料輸入範本:');
    console.log(JSON.stringify(template, null, 2));
    console.log('\n💡 請將 Google Maps 連結中的資料按照此格式輸入');
}

// Instructions for manual data extraction
function showInstructions() {
    console.log('\n🔍 如何從 Google Maps 提取資料:');
    console.log('1. 開啟 Google Maps 連結: https://maps.app.goo.gl/U6xzWpGJgR1m8X236');
    console.log('2. 查看地圖上的標記或列表');
    console.log('3. 點擊每個標記查看詳細資訊');
    console.log('4. 複製以下資訊:');
    console.log('   - 店家名稱');
    console.log('   - 地址');
    console.log('   - 評價和評論數');
    console.log('   - 經緯度座標');
    console.log('5. 將資料添加到 sampleGrassData 陣列中');
    console.log('6. 執行此腳本: node extract_google_maps.js');
}

// Main execution
if (process.argv.includes('--help')) {
    showInstructions();
    createDataEntryTemplate();
} else if (process.argv.includes('--create')) {
    createGrassYml(sampleGrassData);
} else {
    console.log('使用方式:');
    console.log('node extract_google_maps.js --help    # 顯示說明');
    console.log('node extract_google_maps.js --create  # 建立範例檔案');
    console.log('\n請先編輯此檔案，將 Google Maps 的資料添加到 sampleGrassData 陣列中');
}