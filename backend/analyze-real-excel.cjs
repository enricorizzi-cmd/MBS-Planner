const XLSX = require('xlsx');
const path = require('path');

// Leggi il file Excel reale
const excelPath = path.join(__dirname, '..', 'MBS DATI IMPORT.xlsx');
console.log(`📖 Leggendo file: ${excelPath}`);

const workbook = XLSX.readFile(excelPath);
const sheetNames = workbook.SheetNames;

console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}\n`);

// Analizza ogni foglio
for (const sheetName of sheetNames) {
  console.log(`\n=== FOGLIO: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Numero righe: ${rows.length}`);
  
  if (rows.length > 0) {
    console.log('Colonne trovate:');
    const columns = Object.keys(rows[0]);
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col}`);
    });
    
    console.log('\nPrime 3 righe di dati:');
    rows.slice(0, 3).forEach((row, index) => {
      console.log(`\nRiga ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
  }
}
