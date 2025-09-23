console.log('🚀 Test script avviato');

const XLSX = require('xlsx');
const path = require('path');

try {
  console.log('📖 Leggendo file Excel...');
  const excelPath = path.join(__dirname, '..', 'MBS DATI IMPORT.xlsx');
  console.log(`Percorso: ${excelPath}`);
  
  const workbook = XLSX.readFile(excelPath);
  const sheetNames = workbook.SheetNames;
  
  console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}`);
  
  // Testa solo il primo foglio
  if (sheetNames.length > 0) {
    const firstSheet = sheetNames[0];
    console.log(`\n📄 Testando foglio: ${firstSheet}`);
    
    const worksheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Numero righe: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('Prima riga:');
      console.log(JSON.stringify(rows[0], null, 2));
    }
  }
  
  console.log('✅ Test completato con successo!');
  
} catch (error) {
  console.error('❌ Errore:', error.message);
  console.error('Stack:', error.stack);
}
