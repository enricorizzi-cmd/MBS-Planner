// Script per leggere e analizzare il file Excel reale
const fs = require('fs');
const path = require('path');

// Leggi il file Excel come buffer per analizzarlo
const excelPath = path.join(__dirname, '..', 'MBS DATI IMPORT.xlsx');

console.log('📖 Analizzando il file Excel...');
console.log(`Percorso: ${excelPath}`);

// Verifica se il file esiste
if (fs.existsSync(excelPath)) {
  console.log('✅ File Excel trovato!');
  
  const stats = fs.statSync(excelPath);
  console.log(`Dimensione file: ${stats.size} bytes`);
  console.log(`Ultima modifica: ${stats.mtime}`);
  
  // Leggi i primi bytes per verificare che sia un file Excel
  const buffer = fs.readFileSync(excelPath, { start: 0, end: 100 });
  console.log('Prime 20 bytes:', buffer.slice(0, 20));
  
} else {
  console.log('❌ File Excel non trovato!');
  console.log('Controllando directory corrente...');
  
  const files = fs.readdirSync(__dirname);
  console.log('File nella directory backend:', files);
  
  const parentFiles = fs.readdirSync(path.join(__dirname, '..'));
  console.log('File nella directory principale:', parentFiles);
}

// Prova a installare xlsx se non è disponibile
try {
  const XLSX = require('xlsx');
  console.log('✅ Modulo xlsx disponibile');
  
  // Prova a leggere il file
  const workbook = XLSX.readFile(excelPath);
  const sheetNames = workbook.SheetNames;
  
  console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}`);
  
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
      
      console.log('\nPrime 2 righe di dati:');
      rows.slice(0, 2).forEach((row, index) => {
        console.log(`\nRiga ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
  }
  
} catch (error) {
  console.log('❌ Errore nel leggere il file Excel:', error.message);
  console.log('Provo a installare xlsx...');
  
  // Prova a installare xlsx
  const { execSync } = require('child_process');
  try {
    execSync('npm install xlsx', { stdio: 'inherit' });
    console.log('✅ xlsx installato');
  } catch (installError) {
    console.log('❌ Errore nell\'installazione di xlsx:', installError.message);
  }
}
