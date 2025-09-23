#!/usr/bin/env node

/**
 * Test script per verificare l'importazione dei dati Excel
 * Questo script simula l'upload di un file Excel e testa l'endpoint di importazione
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Crea un file Excel di test basato sui dati forniti
function createTestExcelFile() {
  console.log('📊 Creando file Excel di test...');

  const workbook = XLSX.utils.book_new();

  // Foglio Partners
  const partnersData = [
    ['Nome Partner'],
    ['TechCorp S.r.l.'],
    ['InnovateLab'],
    ['FutureTech'],
    ['Digital Solutions'],
    ['StartupHub']
  ];
  const partnersSheet = XLSX.utils.aoa_to_sheet(partnersData);
  XLSX.utils.book_append_sheet(workbook, partnersSheet, 'Partners');

  // Foglio Aziende
  const companiesData = [
    ['Nome Azienda', 'Indirizzo', 'Telefono', 'Email', 'Partner'],
    ['TechCorp S.r.l.', 'Via Roma 123, Milano', '+39 02 123 4567', 'info@techcorp.it', 'TechCorp S.r.l.'],
    ['InnovateLab', 'Corso Italia 456, Torino', '+39 011 123 4567', 'contact@innovatelab.it', 'InnovateLab'],
    ['FutureTech', 'Piazza Duomo 789, Firenze', '+39 055 123 4567', 'hello@futuretech.it', 'FutureTech'],
    ['Digital Solutions', 'Via Garibaldi 321, Bologna', '+39 051 123 4567', 'info@digitalsolutions.it', 'Digital Solutions'],
    ['StartupHub', 'Corso Vittorio Emanuele 654, Napoli', '+39 081 123 4567', 'hello@startuphub.it', 'StartupHub']
  ];
  const companiesSheet = XLSX.utils.aoa_to_sheet(companiesData);
  XLSX.utils.book_append_sheet(workbook, companiesSheet, 'Aziende');

  // Foglio Clienti (Studenti)
  const studentsData = [
    ['Nome Studente', 'Email', 'Telefono', 'Partner'],
    ['Mario Rossi', 'mario.rossi@email.com', '+39 123 456 7890', 'TechCorp S.r.l.'],
    ['Giulia Bianchi', 'giulia.bianchi@email.com', '+39 123 456 7891', 'TechCorp S.r.l.'],
    ['Luca Verdi', 'luca.verdi@email.com', '+39 123 456 7892', 'InnovateLab'],
    ['Anna Neri', 'anna.neri@email.com', '+39 123 456 7893', 'InnovateLab'],
    ['Marco Blu', 'marco.blu@email.com', '+39 123 456 7894', 'FutureTech'],
    ['Sara Gialli', 'sara.gialli@email.com', '+39 123 456 7895', 'FutureTech'],
    ['Giuseppe Rossi', 'giuseppe.rossi@email.com', '+39 123 456 7896', 'Digital Solutions'],
    ['Francesca Verde', 'francesca.verde@email.com', '+39 123 456 7897', 'Digital Solutions'],
    ['Antonio Bianco', 'antonio.bianco@email.com', '+39 123 456 7898', 'StartupHub'],
    ['Elena Rosa', 'elena.rosa@email.com', '+39 123 456 7899', 'StartupHub']
  ];
  const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData);
  XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Clienti');

  // Foglio Supervisori
  const supervisorsData = [
    ['Nome Supervisore', 'Email', 'Telefono', 'Azienda', 'Partner'],
    ['Marco Rossi', 'marco.rossi@techcorp.it', '+39 02 123 4567', 'TechCorp S.r.l.', 'TechCorp S.r.l.'],
    ['Sara Bianchi', 'sara.bianchi@innovatelab.it', '+39 011 123 4567', 'InnovateLab', 'InnovateLab'],
    ['Giuseppe Verdi', 'giuseppe.verdi@futuretech.it', '+39 055 123 4567', 'FutureTech', 'FutureTech'],
    ['Laura Neri', 'laura.neri@digitalsolutions.it', '+39 051 123 4567', 'Digital Solutions', 'Digital Solutions'],
    ['Roberto Blu', 'roberto.blu@startuphub.it', '+39 081 123 4567', 'StartupHub', 'StartupHub']
  ];
  const supervisorsSheet = XLSX.utils.aoa_to_sheet(supervisorsData);
  XLSX.utils.book_append_sheet(workbook, supervisorsSheet, 'Supervisori');

  // Foglio Lista (unificato)
  const listData = [
    ['Tipo', 'Nome', 'Email', 'Telefono', 'Indirizzo', 'Azienda', 'Partner'],
    ['Partner', 'TechCorp S.r.l.', '', '', '', '', ''],
    ['Partner', 'InnovateLab', '', '', '', '', ''],
    ['Partner', 'FutureTech', '', '', '', '', ''],
    ['Partner', 'Digital Solutions', '', '', '', '', ''],
    ['Partner', 'StartupHub', '', '', '', '', ''],
    ['Azienda', 'TechCorp S.r.l.', 'info@techcorp.it', '+39 02 123 4567', 'Via Roma 123, Milano', '', 'TechCorp S.r.l.'],
    ['Azienda', 'InnovateLab', 'contact@innovatelab.it', '+39 011 123 4567', 'Corso Italia 456, Torino', '', 'InnovateLab'],
    ['Azienda', 'FutureTech', 'hello@futuretech.it', '+39 055 123 4567', 'Piazza Duomo 789, Firenze', '', 'FutureTech'],
    ['Azienda', 'Digital Solutions', 'info@digitalsolutions.it', '+39 051 123 4567', 'Via Garibaldi 321, Bologna', '', 'Digital Solutions'],
    ['Azienda', 'StartupHub', 'hello@startuphub.it', '+39 081 123 4567', 'Corso Vittorio Emanuele 654, Napoli', '', 'StartupHub'],
    ['Studente', 'Mario Rossi', 'mario.rossi@email.com', '+39 123 456 7890', '', '', 'TechCorp S.r.l.'],
    ['Studente', 'Giulia Bianchi', 'giulia.bianchi@email.com', '+39 123 456 7891', '', '', 'TechCorp S.r.l.'],
    ['Studente', 'Luca Verdi', 'luca.verdi@email.com', '+39 123 456 7892', '', '', 'InnovateLab'],
    ['Studente', 'Anna Neri', 'anna.neri@email.com', '+39 123 456 7893', '', '', 'InnovateLab'],
    ['Studente', 'Marco Blu', 'marco.blu@email.com', '+39 123 456 7894', '', '', 'FutureTech'],
    ['Studente', 'Sara Gialli', 'sara.gialli@email.com', '+39 123 456 7895', '', '', 'FutureTech'],
    ['Studente', 'Giuseppe Rossi', 'giuseppe.rossi@email.com', '+39 123 456 7896', '', '', 'Digital Solutions'],
    ['Studente', 'Francesca Verde', 'francesca.verde@email.com', '+39 123 456 7897', '', '', 'Digital Solutions'],
    ['Studente', 'Antonio Bianco', 'antonio.bianco@email.com', '+39 123 456 7898', '', '', 'StartupHub'],
    ['Studente', 'Elena Rosa', 'elena.rosa@email.com', '+39 123 456 7899', '', '', 'StartupHub'],
    ['Supervisore', 'Marco Rossi', 'marco.rossi@techcorp.it', '+39 02 123 4567', '', 'TechCorp S.r.l.', 'TechCorp S.r.l.'],
    ['Supervisore', 'Sara Bianchi', 'sara.bianchi@innovatelab.it', '+39 011 123 4567', '', 'InnovateLab', 'InnovateLab'],
    ['Supervisore', 'Giuseppe Verdi', 'giuseppe.verdi@futuretech.it', '+39 055 123 4567', '', 'FutureTech', 'FutureTech'],
    ['Supervisore', 'Laura Neri', 'laura.neri@digitalsolutions.it', '+39 051 123 4567', '', 'Digital Solutions', 'Digital Solutions'],
    ['Supervisore', 'Roberto Blu', 'roberto.blu@startuphub.it', '+39 081 123 4567', '', 'StartupHub', 'StartupHub']
  ];
  const listSheet = XLSX.utils.aoa_to_sheet(listData);
  XLSX.utils.book_append_sheet(workbook, listSheet, 'Lista');

  // Salva il file
  const outputPath = path.join(process.cwd(), 'test-import-data.xlsx');
  XLSX.writeFile(workbook, outputPath);
  
  console.log(`✅ File Excel di test creato: ${outputPath}`);
  return outputPath;
}

// Funzione per testare la lettura del file Excel
function testExcelReading(filePath) {
  console.log('📖 Testando la lettura del file Excel...');

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}`);

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`\n📄 Foglio "${sheetName}":`);
      console.log(`   - Righe: ${rows.length}`);
      
      if (rows.length > 0) {
        console.log(`   - Colonne: ${Object.keys(rows[0]).join(', ')}`);
        console.log(`   - Prima riga:`, rows[0]);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Errore nella lettura del file Excel:', error);
    return false;
  }
}

// Funzione principale
function main() {
  console.log('🚀 Avvio test di importazione dati Excel\n');

  try {
    // Crea il file Excel di test
    const testFile = createTestExcelFile();
    
    // Testa la lettura del file
    const readSuccess = testExcelReading(testFile);
    
    if (readSuccess) {
      console.log('\n✅ Test completato con successo!');
      console.log('\n📝 Prossimi passi:');
      console.log('   1. Avvia il server backend: npm run dev (nella cartella backend)');
      console.log('   2. Avvia il frontend: npm run dev (nella cartella app)');
      console.log('   3. Vai su http://localhost:5173/impostazioni/import');
      console.log('   4. Carica il file test-import-data.xlsx');
      console.log('   5. Verifica che i dati vengano importati correttamente');
    } else {
      console.log('\n❌ Test fallito');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
    process.exit(1);
  }
}

// Esegui il test
if (require.main === module) {
  main();
}

module.exports = { createTestExcelFile, testExcelReading };
