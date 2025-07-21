const fs = require('fs');
const path = require('path');

// Robust CSV parser that handles quoted fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

// Enhanced CSV to JSON converter
function csvToJson(csvFilePath, jsonFilePath) {
  try {
    console.log('🔄 Reading CSV file...');
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    console.log(`📊 Total lines in CSV: ${lines.length}`);
    
    // Get headers from first line
    const headers = parseCSVLine(lines[0]).map(header => 
      header.replace(/"/g, '').trim()
    );
    console.log('📋 Headers found:', headers);
    console.log(`📋 Expected columns: ${headers.length}`);
    
    const jsonData = [];
    let skippedRows = 0;
    let processedRows = 0;
    
    // Process each data line
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]).map(value => 
          value.replace(/"/g, '').trim()
        );
        
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            let value = values[index];
            
            // Convert numeric fields
            if (header === 'rental_duration_days' || header === 'price_SAR') {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                value = numValue;
              }
            }
            
            row[header] = value;
          });
          
          jsonData.push(row);
          processedRows++;
        } else {
          skippedRows++;
          if (skippedRows <= 5) { // Show first 5 problematic rows for debugging
            console.log(`⚠️  Row ${i + 1} skipped - Expected ${headers.length} columns, got ${values.length}`);
            console.log(`   Data: ${lines[i].substring(0, 100)}...`);
          }
        }
      } catch (error) {
        skippedRows++;
        if (skippedRows <= 5) {
          console.log(`❌ Error processing row ${i + 1}: ${error.message}`);
        }
      }
      
      // Progress indicator for large files
      if (i % 5000 === 0) {
        console.log(`🔄 Processed ${i}/${lines.length - 1} rows...`);
      }
    }
    
    console.log(`\n📈 Conversion Summary:`);
    console.log(`   Total rows processed: ${processedRows}`);
    console.log(`   Rows skipped: ${skippedRows}`);
    console.log(`   Success rate: ${((processedRows / (lines.length - 1)) * 100).toFixed(2)}%`);
    
    // Create public directory if it doesn't exist
    const publicDir = path.dirname(jsonFilePath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      console.log(`📁 Created directory: ${publicDir}`);
    }
    
    // Write JSON file
    console.log('💾 Writing JSON file...');
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Successfully converted CSV to JSON: ${jsonFilePath}`);
    
    // Show sample data
    console.log('\n📋 Sample records:');
    console.log(JSON.stringify(jsonData.slice(0, 3), null, 2));
    
    // Show statistics
    if (jsonData.length > 0) {
      const entities = [...new Set(jsonData.map(r => r.Entity))];
      const vehicleGroups = [...new Set(jsonData.map(r => r.Vehicle_Group))];
      const durations = [...new Set(jsonData.map(r => r.rental_duration_days))].sort((a,b) => a-b);
      
      console.log('\n📊 Data Statistics:');
      console.log(`   Entities: ${entities.join(', ')}`);
      console.log(`   Vehicle Groups: ${vehicleGroups.join(', ')}`);
      console.log(`   Rental Durations: ${durations.join(', ')} days`);
    }
    
  } catch (error) {
    console.error('❌ Error converting CSV to JSON:', error.message);
    console.error(error.stack);
  }
}

// Run the conversion
const csvPath = 'Competitor Analysis.csv';
const jsonPath = 'public/competitor_analysis.json';

console.log('🚀 Starting CSV to JSON conversion...');

if (fs.existsSync(csvPath)) {
  csvToJson(csvPath, jsonPath);
} else {
  console.error(`❌ CSV file not found: ${csvPath}`);
  console.log('📁 Current directory:', process.cwd());
  console.log('📁 Looking for file:', path.resolve(csvPath));
  console.log('💡 Please make sure "Competitor Analysis.csv" is in the project root directory');
}