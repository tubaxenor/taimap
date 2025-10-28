const fs = require('fs');
const yaml = require('js-yaml');
const csv = require('csv-parser');

console.log('🔄 重新整理台派資料');
console.log('從 data.csv 提取並重構為新的 YAML 格式');
console.log('');

// Function to process CSV and create new YAML structure
function processTaipaiData() {
    return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream('data/data.csv')
            .pipe(csv())
            .on('data', (row) => {
                // Only process rows that have valid data
                if (row['標題'] && row['標題'].trim() !== '') {
                    const entry = {
                        標題: row['標題'].trim(),
                        搜尋連結: row['搜尋連結'] ? row['搜尋連結'].trim() : '',
                        詳細地址: row['詳細地址'] ? row['詳細地址'].trim() : '',
                        備註: row['備註'] ? row['備註'].trim() : '',
                        緯度: row['緯度'] ? parseFloat(row['緯度']) : null,
                        經度: row['經度'] ? parseFloat(row['經度']) : null
                    };
                    
                    // Only add entries with valid coordinates
                    if (entry.緯度 && entry.經度 && !isNaN(entry.緯度) && !isNaN(entry.經度)) {
                        results.push(entry);
                    }
                }
            })
            .on('end', () => {
                console.log(`✅ 處理完成，共 ${results.length} 個有效資料`);
                resolve(results);
            })
            .on('error', (error) => {
                console.error('❌ 處理 CSV 時發生錯誤:', error);
                reject(error);
            });
    });
}

// Function to save to 台派.yml
function saveTaipaiYml(data) {
    try {
        const yamlStr = yaml.dump(data, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
            sortKeys: false
        });
        
        fs.writeFileSync('data/台派.yml', yamlStr, 'utf8');
        console.log('✅ 台派.yml 檔案已建立');
        console.log(`📊 包含 ${data.length} 個地點`);
        
        // Show preview
        console.log('\n📋 資料預覽:');
        data.slice(0, 5).forEach((location, index) => {
            console.log(`${index + 1}. ${location.標題} - ${location.詳細地址}`);
            console.log(`   備註: ${location.備註 || '無'}`);
            console.log(`   座標: ${location.緯度}, ${location.經度}`);
            console.log('');
        });
        
        if (data.length > 5) {
            console.log(`... 還有 ${data.length - 5} 個地點`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ 建立檔案時發生錯誤:', error);
        return false;
    }
}

// Main function
async function main() {
    console.log('🚀 開始重新整理台派資料...');
    
    try {
        // Process CSV data
        const taipaiData = await processTaipaiData();
        
        if (taipaiData.length > 0) {
            // Save to new YAML format
            if (saveTaipaiYml(taipaiData)) {
                console.log('\n🎉 成功！台派資料已重新整理');
                console.log('\n📊 新格式包含以下欄位:');
                console.log('1. 標題 - 店家名稱');
                console.log('2. 搜尋連結 - Google Maps 連結');
                console.log('3. 詳細地址 - 完整地址');
                console.log('4. 備註 - 額外說明');
                console.log('5. 緯度 - 緯度座標');
                console.log('6. 經度 - 經度座標');
                
                console.log('\n💡 下一步:');
                console.log('1. 檢查 data/台派.yml 檔案');
                console.log('2. 提交變更到 GitHub');
                console.log('3. 測試網站功能');
            }
        } else {
            console.log('❌ 沒有找到有效的資料');
        }
    } catch (error) {
        console.error('❌ 處理過程中發生錯誤:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { processTaipaiData, saveTaipaiYml };