const fs = require('fs');
const path = require('path');

// Simple CSV to JSON converter
function csvToJson(csvFilePath, jsonFilePath) {
  try {
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Get headers from first line
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    console.log('Headers found:', headers);
    
    const jsonData = [];
    
    // Process each data line
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
      
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          let value = values[index];
          
          // Try to convert numbers
          if (header === 'rental_duration_days' || header === 'price_SAR') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              value = numValue;
            }
          }
          
          row[header] = value;
        });
        jsonData.push(row);
      }
    }
    
    console.log(`Converted ${jsonData.length} records`);
    
    // Write JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Successfully converted CSV to JSON: ${jsonFilePath}`);
    
    // Show sample data
    console.log('\nSample records:');
    console.log(JSON.stringify(jsonData.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error('❌ Error converting CSV to JSON:', error.message);
  }
}

// Run the conversion
const csvPath = 'Competitor Analysis.csv';
const jsonPath = 'public/competitor_analysis.json';

if (fs.existsSync(csvPath)) {
  csvToJson(csvPath, jsonPath);
} else {
  console.error(`❌ CSV file not found: ${csvPath}`);
  console.log('Please make sure "Competitor Analysis.csv" is in the project root directory');
}