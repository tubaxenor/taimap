const fs = require('fs');
const yaml = require('js-yaml');

console.log('Testing YAML structure...');

try {
    const yamlContent = fs.readFileSync('data/台派.yml', 'utf8');
    console.log('YAML content length:', yamlContent.length);
    console.log('First 500 characters:');
    console.log(yamlContent.substring(0, 500));
    
    const data = yaml.load(yamlContent);
    console.log('\nParsed data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Length:', data ? data.length : 'null/undefined');
    
    if (data && data.length > 0) {
        console.log('\nFirst item:');
        console.log(JSON.stringify(data[0], null, 2));
        
        console.log('\nSample of first 3 items:');
        data.slice(0, 3).forEach((item, index) => {
            console.log(`${index + 1}. ${item.標題} - ${item.詳細地址}`);
        });
    }
    
} catch (error) {
    console.error('Error:', error);
}