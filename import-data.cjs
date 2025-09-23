#!/usr/bin/env node

/**
 * Script di importazione diretto usando le dipendenze del backend
 */

const path = require('path');
const fs = require('fs');

// Cambia directory al backend dove sono installate le dipendenze
process.chdir(path.join(__dirname, 'backend'));

// Carica le dipendenze dal backend
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

// Inizializza il client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Funzione per pulire e validare i dati
function cleanData(data) {
  if (typeof data === 'string') {
    return data.trim();
  }
  return data;
}

// Funzione per validare email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Funzione per validare telefono
function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

// Funzione per generare UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Funzione per importare i partner
async function importPartners(rows) {
  console.log('📊 Importando Partner...');
  let created = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Partner'] || row['Partner'] || row['Nome']);
      
      if (!name) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Nome partner mancante`);
        errors++;
        continue;
      }

      // Controlla se il partner esiste già
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('name', name)
        .single();

      if (existingPartner) {
        console.log(`ℹ️  Partner "${name}" già esistente`);
        continue;
      }

      // Crea il partner
      const { error } = await supabase
        .from('partners')
        .insert({
          id: generateUUID(),
          name: name,
        });

      if (error) {
        console.log(`❌ Errore creazione partner "${name}": ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Partner "${name}" creato`);
        created++;
      }
    } catch (error) {
      console.log(`❌ Errore generico riga ${rows.indexOf(row) + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log(`📈 Partner: ${created} creati, ${errors} errori\n`);
  return { created, errors };
}

// Funzione per importare le aziende
async function importCompanies(rows) {
  console.log('🏢 Importando Aziende...');
  let created = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Azienda'] || row['Azienda'] || row['Nome']);
      const address = cleanData(row['Indirizzo'] || row['Address']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const email = cleanData(row['Email']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Nome azienda mancante`);
        errors++;
        continue;
      }

      // Valida email se fornita
      if (email && !isValidEmail(email)) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Email non valida - ${email}`);
        errors++;
        continue;
      }

      // Valida telefono se fornito
      if (phone && !isValidPhone(phone)) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Telefono non valido - ${phone}`);
        errors++;
        continue;
      }

      // Ottieni l'ID del partner
      let partnerId = null;
      if (partnerName) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('name', partnerName)
          .single();
        
        if (partner) {
          partnerId = partner.id;
        } else {
          console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Partner non trovato - ${partnerName}`);
          errors++;
          continue;
        }
      }

      if (!partnerId) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Partner ID mancante`);
        errors++;
        continue;
      }

      // Controlla se l'azienda esiste già
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', name)
        .eq('partner_id', partnerId)
        .single();

      if (existingCompany) {
        console.log(`ℹ️  Azienda "${name}" già esistente`);
        continue;
      }

      // Crea l'azienda
      const { error } = await supabase
        .from('companies')
        .insert({
          id: generateUUID(),
          name,
          address: address || null,
          phone: phone || null,
          email: email || null,
          partner_id: partnerId,
        });

      if (error) {
        console.log(`❌ Errore creazione azienda "${name}": ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Azienda "${name}" creata`);
        created++;
      }
    } catch (error) {
      console.log(`❌ Errore generico riga ${rows.indexOf(row) + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log(`📈 Aziende: ${created} create, ${errors} errori\n`);
  return { created, errors };
}

// Funzione per importare gli studenti
async function importStudents(rows) {
  console.log('👨‍🎓 Importando Studenti...');
  let created = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Studente'] || row['Studente'] || row['Nome']);
      const email = cleanData(row['Email']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name || !email) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Nome o email studente mancanti`);
        errors++;
        continue;
      }

      // Valida email
      if (!isValidEmail(email)) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Email non valida - ${email}`);
        errors++;
        continue;
      }

      // Valida telefono se fornito
      if (phone && !isValidPhone(phone)) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Telefono non valido - ${phone}`);
        errors++;
        continue;
      }

      // Ottieni l'ID del partner
      let partnerId = null;
      if (partnerName) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('name', partnerName)
          .single();
        
        if (partner) {
          partnerId = partner.id;
        } else {
          console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Partner non trovato - ${partnerName}`);
          errors++;
          continue;
        }
      }

      if (!partnerId) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Partner ID mancante`);
        errors++;
        continue;
      }

      // Controlla se lo studente esiste già
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .eq('partner_id', partnerId)
        .single();

      if (existingStudent) {
        console.log(`ℹ️  Studente "${name}" già esistente`);
        continue;
      }

      // Crea lo studente
      const { error } = await supabase
        .from('students')
        .insert({
          id: generateUUID(),
          name,
          email,
          phone: phone || null,
          partner_id: partnerId,
        });

      if (error) {
        console.log(`❌ Errore creazione studente "${name}": ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Studente "${name}" creato`);
        created++;
      }
    } catch (error) {
      console.log(`❌ Errore generico riga ${rows.indexOf(row) + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log(`📈 Studenti: ${created} creati, ${errors} errori\n`);
  return { created, errors };
}

// Funzione per importare i supervisori
async function importSupervisors(rows) {
  console.log('👨‍💼 Importando Supervisori...');
  let created = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Supervisore'] || row['Supervisore'] || row['Nome']);
      const email = cleanData(row['Email']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const companyName = cleanData(row['Azienda'] || row['Nome Azienda']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name || !email || !companyName) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Nome, email o azienda supervisore mancanti`);
        errors++;
        continue;
      }

      // Valida email
      if (!isValidEmail(email)) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Email non valida - ${email}`);
        errors++;
        continue;
      }

      // Valida telefono se fornito
      if (phone && !isValidPhone(phone)) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Telefono non valido - ${phone}`);
        errors++;
        continue;
      }

      // Ottieni l'ID del partner
      let partnerId = null;
      if (partnerName) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('name', partnerName)
          .single();
        
        if (partner) {
          partnerId = partner.id;
        } else {
          console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Partner non trovato - ${partnerName}`);
          errors++;
          continue;
        }
      }

      if (!partnerId) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Partner ID mancante`);
        errors++;
        continue;
      }

      // Ottieni l'ID dell'azienda
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .eq('partner_id', partnerId)
        .single();

      if (!company) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Azienda non trovata - ${companyName}`);
        errors++;
        continue;
      }

      // Controlla se il supervisore esiste già
      const { data: existingSupervisor } = await supabase
        .from('supervisors')
        .select('id')
        .eq('email', email)
        .eq('company_id', company.id)
        .single();

      if (existingSupervisor) {
        console.log(`ℹ️  Supervisore "${name}" già esistente`);
        continue;
      }

      // Crea il supervisore
      const { error } = await supabase
        .from('supervisors')
        .insert({
          id: generateUUID(),
          name,
          email,
          phone: phone || null,
          company_id: company.id,
          partner_id: partnerId,
        });

      if (error) {
        console.log(`❌ Errore creazione supervisore "${name}": ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Supervisore "${name}" creato`);
        created++;
      }
    } catch (error) {
      console.log(`❌ Errore generico riga ${rows.indexOf(row) + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log(`📈 Supervisori: ${created} creati, ${errors} errori\n`);
  return { created, errors };
}

// Funzione principale
async function main() {
  console.log('🚀 Avvio importazione dati Excel nel database Supabase\n');

  try {
    // Testa la connessione
    console.log('🔗 Testando connessione a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('partners')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Errore connessione:', testError.message);
      return;
    }
    console.log('✅ Connessione a Supabase riuscita!\n');

    // Leggi il file Excel dalla directory principale
    const excelPath = path.join(__dirname, 'MBS DATI IMPORT.xlsx');
    console.log(`📖 Leggendo file: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;

    console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}\n`);

    const totalResults = {
      partners: { created: 0, errors: 0 },
      companies: { created: 0, errors: 0 },
      students: { created: 0, errors: 0 },
      supervisors: { created: 0, errors: 0 }
    };

    // Processa ogni foglio
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        console.log(`⚠️  Foglio "${sheetName}" vuoto, saltato\n`);
        continue;
      }

      console.log(`📄 Processando foglio "${sheetName}" (${rows.length} righe)`);

      try {
        switch (sheetName.toLowerCase()) {
          case 'partner':
          case 'partners':
            const partnerResult = await importPartners(rows);
            totalResults.partners.created += partnerResult.created;
            totalResults.partners.errors += partnerResult.errors;
            break;

          case 'aziende':
          case 'companies':
          case 'company':
            const companyResult = await importCompanies(rows);
            totalResults.companies.created += companyResult.created;
            totalResults.companies.errors += companyResult.errors;
            break;

          case 'clienti':
          case 'students':
          case 'student':
            const studentResult = await importStudents(rows);
            totalResults.students.created += studentResult.created;
            totalResults.students.errors += studentResult.errors;
            break;

          case 'supervisori':
          case 'supervisors':
          case 'supervisor':
            const supervisorResult = await importSupervisors(rows);
            totalResults.supervisors.created += supervisorResult.created;
            totalResults.supervisors.errors += supervisorResult.errors;
            break;

          case 'lista':
            console.log('📋 Processando Lista Unificata...');
            
            const partnerRows = [];
            const companyRows = [];
            const studentRows = [];
            const supervisorRows = [];

            // Raggruppa le righe per tipo
            for (const row of rows) {
              const tipo = cleanData(row['Tipo']);
              
              if (tipo === 'Partner') {
                partnerRows.push(row);
              } else if (tipo === 'Azienda') {
                companyRows.push(row);
              } else if (tipo === 'Studente') {
                studentRows.push(row);
              } else if (tipo === 'Supervisore') {
                supervisorRows.push(row);
              }
            }

            console.log(`📊 Trovati: ${partnerRows.length} Partner, ${companyRows.length} Aziende, ${studentRows.length} Studenti, ${supervisorRows.length} Supervisori\n`);

            // Processa ogni tipo
            if (partnerRows.length > 0) {
              const partnerResult = await importPartners(partnerRows);
              totalResults.partners.created += partnerResult.created;
              totalResults.partners.errors += partnerResult.errors;
            }

            if (companyRows.length > 0) {
              const companyResult = await importCompanies(companyRows);
              totalResults.companies.created += companyResult.created;
              totalResults.companies.errors += companyResult.errors;
            }

            if (studentRows.length > 0) {
              const studentResult = await importStudents(studentRows);
              totalResults.students.created += studentResult.created;
              totalResults.students.errors += studentResult.errors;
            }

            if (supervisorRows.length > 0) {
              const supervisorResult = await importSupervisors(supervisorRows);
              totalResults.supervisors.created += supervisorResult.created;
              totalResults.supervisors.errors += supervisorResult.errors;
            }
            break;

          default:
            console.log(`⚠️  Foglio "${sheetName}" non riconosciuto, saltato\n`);
        }
      } catch (error) {
        console.log(`❌ Errore nel processamento del foglio ${sheetName}: ${error.message}\n`);
      }
    }

    // Riepilogo finale
    console.log('🎉 Importazione completata!\n');
    console.log('📊 RIEPILOGO FINALE:');
    console.log(`   Partner: ${totalResults.partners.created} creati, ${totalResults.partners.errors} errori`);
    console.log(`   Aziende: ${totalResults.companies.created} create, ${totalResults.companies.errors} errori`);
    console.log(`   Studenti: ${totalResults.students.created} creati, ${totalResults.students.errors} errori`);
    console.log(`   Supervisori: ${totalResults.supervisors.created} creati, ${totalResults.supervisors.errors} errori`);
    
    const totalCreated = totalResults.partners.created + totalResults.companies.created + 
                        totalResults.students.created + totalResults.supervisors.created;
    const totalErrors = totalResults.partners.errors + totalResults.companies.errors + 
                       totalResults.students.errors + totalResults.supervisors.errors;
    
    console.log(`\n📈 TOTALE: ${totalCreated} record creati, ${totalErrors} errori`);

    if (totalErrors === 0) {
      console.log('\n✅ Importazione completata con successo!');
      console.log('🚀 I dati sono ora disponibili nel database Supabase');
    } else {
      console.log('\n⚠️  Importazione completata con alcuni errori');
      console.log('🔍 Controlla i log sopra per i dettagli degli errori');
    }

  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error);
  }
}

// Esegui l'importazione
main();
