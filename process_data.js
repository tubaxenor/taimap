const Papa = require('papaparse');
const fs = require('fs');
const yaml = require('js-yaml');

// Read the CSV file
const csvFile = fs.readFileSync('data/data.csv', 'utf8');

const data = Papa.parse(csvFile, { header: true }).data;

const categories = {
    '台派': [],
    '草': [],
    '紅統': []
};

data.forEach(row => {
    // Skip empty rows
    if (!row['標題'] || !row['緯度'] || !row['經度']) {
        return;
    }

    const location = {
        name: row['標題'],
        city: row['縣市'],
        district: row['區域'],
        category: row['類別'],
        notes: row['備註'],
        recommender: row['推薦者'],
        search_link: row['搜尋連結'],
        address: row['詳細地址'],
        rating: row['評價'],
        reviews: row['評論數'],
        latitude: parseFloat(row['緯度']),
        longitude: parseFloat(row['經度']),
        description: `${row['標題']} - ${row['類別']}\n${row['備註'] ? '備註: ' + row['備註'] : ''}\n${row['推薦者'] ? '推薦者: ' + row['推薦者'] : ''}\n地址: ${row['詳細地址']}\n評價: ${row['評價']}星 (${row['評論數']}則評論)`
    };

    // For now, let's categorize based on the notes or other indicators
    // We'll need to manually categorize or use keywords
    const notes = (row['備註'] || '').toLowerCase();
    const name = (row['標題'] || '').toLowerCase();
    
    // Simple categorization based on keywords in notes or name
    if (notes.includes('台派') || notes.includes('罷免') || notes.includes('志工') || 
        name.includes('台派') || notes.includes('老闆是') || notes.includes('闆是')) {
        categories['台派'].push(location);
    } else if (notes.includes('草') || name.includes('草')) {
        categories['草'].push(location);
    } else if (notes.includes('紅統') || notes.includes('統派') || name.includes('紅統')) {
        categories['紅統'].push(location);
    } else {
        // Default to 台派 for now, but this should be manually reviewed
        categories['台派'].push(location);
    }
});

for (const category in categories) {
    const yamlStr = yaml.dump(categories[category]);
    fs.writeFileSync(`data/${category}.yml`, yamlStr, 'utf8');
}

console.log('Data processing complete.');