const XLSX = require('xlsx');
const path = require('path');

// Leggi il file Excel reale
const excelPath = path.join(__dirname, '..', 'MBS DATI IMPORT.xlsx');
console.log(`📖 Analizzando COMPLETAMENTE il file Excel: ${excelPath}`);

const workbook = XLSX.readFile(excelPath);
const sheetNames = workbook.SheetNames;

console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}\n`);

// Analizza ogni foglio COMPLETAMENTE
for (const sheetName of sheetNames) {
  console.log(`\n=== FOGLIO: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Numero righe: ${rows.length}`);
  
  if (rows.length > 0) {
    console.log('TUTTE le colonne trovate:');
    const columns = Object.keys(rows[0]);
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col}`);
    });
    
    console.log('\nPrime 5 righe di dati COMPLETI:');
    rows.slice(0, 5).forEach((row, index) => {
      console.log(`\nRiga ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
    // Mostra anche alcune righe casuali per vedere la varietà dei dati
    if (rows.length > 10) {
      console.log('\nAlcune righe casuali per vedere la varietà:');
      const randomIndices = [10, 20, 50, 100].filter(i => i < rows.length);
      randomIndices.forEach((i, index) => {
        console.log(`\nRiga ${i + 1}:`);
        Object.entries(rows[i]).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
  }
}

console.log('\n🔍 ANALISI COMPLETA TERMINATA');
