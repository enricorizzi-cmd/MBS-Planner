import { Router } from 'express';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { adminSupabase } from '../index.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new CustomError('Solo file Excel (.xlsx, .xls) sono supportati', 400));
    }
  },
});

// Schema for import validation
const importDataSchema = z.object({
  partner_id: z.string().uuid('ID partner non valido').optional(),
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
});

interface ExcelRow {
  [key: string]: any;
}

interface ImportResult {
  success: boolean;
  message: string;
  data: {
    partners: { created: number; updated: number; errors: number };
    companies: { created: number; updated: number; errors: number };
    students: { created: number; updated: number; errors: number };
    supervisors: { created: number; updated: number; errors: number };
  };
  errors: string[];
}

interface ImportFunctionResult {
  created: number;
  updated: number;
  errors: number;
  errorMessages: string[];
}

// Helper function to clean and validate data
function cleanData(data: any): any {
  if (typeof data === 'string') {
    return data.trim();
  }
  return data;
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
}

// Import partners from Excel - OPTIMIZED VERSION
async function importPartners(rows: ExcelRow[], _partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  // Batch process partners
  const partnersToInsert: any[] = [];

  // First pass: collect all partners and check existing ones
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    
    try {
      const name = cleanData(row['Nome Partner'] || row['Partner'] || row['Nome']);
      
      if (!name) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Nome partner mancante`);
        continue;
      }

      partnersToInsert.push({ name });
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${i + 1}: Errore generico - ${error}`);
    }
  }

  if (partnersToInsert.length === 0) {
    return { created, updated, errors, errorMessages };
  }

  // Batch check existing partners
  const partnerNames = partnersToInsert.map(p => p.name);
  const { data: existingPartners } = await adminSupabase
    .from('partners')
    .select('id, name')
    .in('name', partnerNames);

  const existingPartnerMap = new Map(existingPartners?.map(p => [p.name, p.id]) || []);

  // Separate inserts and updates
  const toInsert = partnersToInsert.filter(p => !existingPartnerMap.has(p.name));
  const toUpdate = partnersToInsert.filter(p => existingPartnerMap.has(p.name));

  // Batch insert new partners
  if (toInsert.length > 0) {
    const { error: insertError } = await adminSupabase
      .from('partners')
      .insert(toInsert.map(p => ({ id: uuidv4(), name: p.name })));

    if (insertError) {
      errors += toInsert.length;
      errorMessages.push(`Errore batch creazione partner: ${insertError.message}`);
    } else {
      created = toInsert.length;
    }
  }

  // Count updates (no actual update needed for partners, just count)
  updated = toUpdate.length;

  return { created, updated, errors, errorMessages };
}

// Import companies from Excel - OPTIMIZED VERSION
async function importCompanies(rows: ExcelRow[], partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  // Batch process companies
  const companiesToProcess: any[] = [];
  const partnerNames = new Set<string>();

  // First pass: collect and validate data
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) {
      errors++;
      errorMessages.push(`Riga ${i + 1}: Dati azienda mancanti nel file`);
      continue;
    }
    try {
      const name = cleanData(row['Nome Azienda'] || row['Azienda'] || row['Nome']);
      const address = cleanData(row['Indirizzo'] || row['Address']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const email = cleanData(row['Email']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Nome azienda mancante`);
        continue;
      }

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Email non valida - ${email}`);
        continue;
      }

      // Validate phone if provided
      if (phone && !isValidPhone(phone)) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Telefono non valido - ${phone}`);
        continue;
      }

      companiesToProcess.push({
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
        partnerName,
        rowIndex: i + 1
      });

      if (partnerName) {
        partnerNames.add(partnerName);
      }
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${i + 1}: Errore generico - ${error}`);
    }
  }

  if (companiesToProcess.length === 0) {
    return { created, updated, errors, errorMessages };
  }

  // Batch fetch partners
  const partnerMap = new Map<string, string>();
  if (partnerNames.size > 0) {
    const { data: partners } = await adminSupabase
      .from('partners')
      .select('id, name')
      .in('name', Array.from(partnerNames));

    partners?.forEach(p => partnerMap.set(p.name, p.id));
  }

  // Process companies with partner resolution
  const companiesToInsert: any[] = [];
  const companyKeys = new Set<string>();

  for (const company of companiesToProcess) {
    let partnerIdToUse = partnerId;
    
    if (company.partnerName && !partnerIdToUse) {
      const partnerId = partnerMap.get(company.partnerName);
      if (partnerId) {
        partnerIdToUse = partnerId;
      } else {
        errors++;
        errorMessages.push(`Riga ${company.rowIndex}: Partner non trovato - ${company.partnerName}`);
        continue;
      }
    }

    if (!partnerIdToUse) {
      errors++;
      errorMessages.push(`Riga ${company.rowIndex}: Partner ID mancante`);
      continue;
    }

    const companyKey = `${company.name}-${partnerIdToUse}`;
    if (companyKeys.has(companyKey)) {
      continue; // Skip duplicates
    }
    companyKeys.add(companyKey);

    companiesToInsert.push({
      id: uuidv4(),
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      partner_id: partnerIdToUse,
    });
  }

  // Batch check existing companies
  if (companiesToInsert.length > 0) {
    const companyNames = companiesToInsert.map(c => c.name);
    const partnerIds = companiesToInsert.map(c => c.partner_id);
    
    const { data: existingCompanies } = await adminSupabase
      .from('companies')
      .select('id, name, partner_id')
      .in('name', companyNames)
      .in('partner_id', partnerIds);

    const existingCompanyMap = new Map(
      existingCompanies?.map(c => [`${c.name}-${c.partner_id}`, c.id]) || []
    );

    // Separate inserts and updates
    const toInsert = companiesToInsert.filter(c => 
      !existingCompanyMap.has(`${c.name}-${c.partner_id}`)
    );
    const toUpdate = companiesToInsert.filter(c => 
      existingCompanyMap.has(`${c.name}-${c.partner_id}`)
    );

    // Batch insert new companies
    if (toInsert.length > 0) {
      const { error: insertError } = await adminSupabase
        .from('companies')
        .insert(toInsert);

      if (insertError) {
        errors += toInsert.length;
        errorMessages.push(`Errore batch creazione aziende: ${insertError.message}`);
      } else {
        created = toInsert.length;
      }
    }

    // Batch update existing companies
    if (toUpdate.length > 0) {
      for (const company of toUpdate) {
        const existingId = existingCompanyMap.get(`${company.name}-${company.partner_id}`);
        if (existingId) {
          const { error: updateError } = await adminSupabase
            .from('companies')
            .update({
              address: company.address,
              phone: company.phone,
              email: company.email,
            })
            .eq('id', existingId);

          if (updateError) {
            errors++;
            errorMessages.push(`Errore aggiornamento azienda ${company.name}: ${updateError.message}`);
          } else {
            updated++;
          }
        }
      }
    }
  }

  return { created, updated, errors, errorMessages };
}

// Import students from Excel - OPTIMIZED VERSION
async function importStudents(rows: ExcelRow[], partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  // Batch process students
  const studentsToProcess: any[] = [];
  const partnerNames = new Set<string>();

  // First pass: collect and validate data
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) {
      errors++;
      errorMessages.push(`Riga ${i + 1}: Dati studente mancanti nel file`);
      continue;
    }
    try {
      const name = cleanData(row['Nome Studente'] || row['Studente'] || row['Nome']);
      const email = cleanData(row['Email']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name || !email) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Nome o email studente mancanti`);
        continue;
      }

      // Validate email
      if (!isValidEmail(email)) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Email non valida - ${email}`);
        continue;
      }

      // Validate phone if provided
      if (phone && !isValidPhone(phone)) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Telefono non valido - ${phone}`);
        continue;
      }

      studentsToProcess.push({
        name,
        email,
        phone: phone || null,
        partnerName,
        rowIndex: i + 1
      });

      if (partnerName) {
        partnerNames.add(partnerName);
      }
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${i + 1}: Errore generico - ${error}`);
    }
  }

  if (studentsToProcess.length === 0) {
    return { created, updated, errors, errorMessages };
  }

  // Batch fetch partners
  const partnerMap = new Map<string, string>();
  if (partnerNames.size > 0) {
    const { data: partners } = await adminSupabase
      .from('partners')
      .select('id, name')
      .in('name', Array.from(partnerNames));

    partners?.forEach(p => partnerMap.set(p.name, p.id));
  }

  // Process students with partner resolution
  const studentsToInsert: any[] = [];
  const studentKeys = new Set<string>();

  for (const student of studentsToProcess) {
    let partnerIdToUse = partnerId;
    
    if (student.partnerName && !partnerIdToUse) {
      const partnerId = partnerMap.get(student.partnerName);
      if (partnerId) {
        partnerIdToUse = partnerId;
      } else {
        errors++;
        errorMessages.push(`Riga ${student.rowIndex}: Partner non trovato - ${student.partnerName}`);
        continue;
      }
    }

    if (!partnerIdToUse) {
      errors++;
      errorMessages.push(`Riga ${student.rowIndex}: Partner ID mancante`);
      continue;
    }

    const studentKey = `${student.email}-${partnerIdToUse}`;
    if (studentKeys.has(studentKey)) {
      continue; // Skip duplicates
    }
    studentKeys.add(studentKey);

    studentsToInsert.push({
      id: uuidv4(),
      name: student.name,
      email: student.email,
      phone: student.phone,
      partner_id: partnerIdToUse,
    });
  }

  // Batch check existing students
  if (studentsToInsert.length > 0) {
    const studentEmails = studentsToInsert.map(s => s.email);
    const partnerIds = studentsToInsert.map(s => s.partner_id);
    
    const { data: existingStudents } = await adminSupabase
      .from('students')
      .select('id, email, partner_id')
      .in('email', studentEmails)
      .in('partner_id', partnerIds);

    const existingStudentMap = new Map(
      existingStudents?.map(s => [`${s.email}-${s.partner_id}`, s.id]) || []
    );

    // Separate inserts and updates
    const toInsert = studentsToInsert.filter(s => 
      !existingStudentMap.has(`${s.email}-${s.partner_id}`)
    );
    const toUpdate = studentsToInsert.filter(s => 
      existingStudentMap.has(`${s.email}-${s.partner_id}`)
    );

    // Batch insert new students
    if (toInsert.length > 0) {
      const { error: insertError } = await adminSupabase
        .from('students')
        .insert(toInsert);

      if (insertError) {
        errors += toInsert.length;
        errorMessages.push(`Errore batch creazione studenti: ${insertError.message}`);
      } else {
        created = toInsert.length;
      }
    }

    // Batch update existing students
    if (toUpdate.length > 0) {
      for (const student of toUpdate) {
        const existingId = existingStudentMap.get(`${student.email}-${student.partner_id}`);
        if (existingId) {
          const { error: updateError } = await adminSupabase
            .from('students')
            .update({
              name: student.name,
              phone: student.phone,
            })
            .eq('id', existingId);

          if (updateError) {
            errors++;
            errorMessages.push(`Errore aggiornamento studente ${student.email}: ${updateError.message}`);
          } else {
            updated++;
          }
        }
      }
    }
  }

  return { created, updated, errors, errorMessages };
}

// Import supervisors from Excel - OPTIMIZED VERSION
async function importSupervisors(rows: ExcelRow[], partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  // Batch process supervisors
  const supervisorsToProcess: any[] = [];
  const partnerNames = new Set<string>();
  const companyNames = new Set<string>();

  // First pass: collect and validate data
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) {
      errors++;
      errorMessages.push(`Riga ${i + 1}: Dati supervisore mancanti nel file`);
      continue;
    }
    try {
      const name = cleanData(row['Nome Supervisore'] || row['Supervisore'] || row['Nome']);
      const email = cleanData(row['Email']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const companyName = cleanData(row['Azienda'] || row['Nome Azienda']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name || !email || !companyName) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Nome, email o azienda supervisore mancanti`);
        continue;
      }

      // Validate email
      if (!isValidEmail(email)) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Email non valida - ${email}`);
        continue;
      }

      // Validate phone if provided
      if (phone && !isValidPhone(phone)) {
        errors++;
        errorMessages.push(`Riga ${i + 1}: Telefono non valido - ${phone}`);
        continue;
      }

      supervisorsToProcess.push({
        name,
        email,
        phone: phone || null,
        companyName,
        partnerName,
        rowIndex: i + 1
      });

      if (partnerName) {
        partnerNames.add(partnerName);
      }
      companyNames.add(companyName);
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${i + 1}: Errore generico - ${error}`);
    }
  }

  if (supervisorsToProcess.length === 0) {
    return { created, updated, errors, errorMessages };
  }

  // Batch fetch partners and companies
  const partnerMap = new Map<string, string>();
  if (partnerNames.size > 0) {
    const { data: partners } = await adminSupabase
      .from('partners')
      .select('id, name')
      .in('name', Array.from(partnerNames));

    partners?.forEach(p => partnerMap.set(p.name, p.id));
  }

  const companyMap = new Map<string, string>();
  if (companyNames.size > 0) {
    const { data: companies } = await adminSupabase
      .from('companies')
      .select('id, name, partner_id')
      .in('name', Array.from(companyNames));

    companies?.forEach(c => companyMap.set(`${c.name}-${c.partner_id}`, c.id));
  }

  // Process supervisors with partner and company resolution
  const supervisorsToInsert: any[] = [];
  const supervisorKeys = new Set<string>();

  for (const supervisor of supervisorsToProcess) {
    let partnerIdToUse = partnerId;
    
    if (supervisor.partnerName && !partnerIdToUse) {
      const partnerId = partnerMap.get(supervisor.partnerName);
      if (partnerId) {
        partnerIdToUse = partnerId;
      } else {
        errors++;
        errorMessages.push(`Riga ${supervisor.rowIndex}: Partner non trovato - ${supervisor.partnerName}`);
        continue;
      }
    }

    if (!partnerIdToUse) {
      errors++;
      errorMessages.push(`Riga ${supervisor.rowIndex}: Partner ID mancante`);
      continue;
    }

    // Get company ID
    const companyKey = `${supervisor.companyName}-${partnerIdToUse}`;
    const companyId = companyMap.get(companyKey);
    if (!companyId) {
      errors++;
      errorMessages.push(`Riga ${supervisor.rowIndex}: Azienda non trovata - ${supervisor.companyName}`);
      continue;
    }

    const supervisorKey = `${supervisor.email}-${companyId}`;
    if (supervisorKeys.has(supervisorKey)) {
      continue; // Skip duplicates
    }
    supervisorKeys.add(supervisorKey);

    supervisorsToInsert.push({
      id: uuidv4(),
      name: supervisor.name,
      email: supervisor.email,
      phone: supervisor.phone,
      company_id: companyId,
      partner_id: partnerIdToUse,
    });
  }

  // Batch check existing supervisors
  if (supervisorsToInsert.length > 0) {
    const supervisorEmails = supervisorsToInsert.map(s => s.email);
    const companyIds = supervisorsToInsert.map(s => s.company_id);
    
    const { data: existingSupervisors } = await adminSupabase
      .from('supervisors')
      .select('id, email, company_id')
      .in('email', supervisorEmails)
      .in('company_id', companyIds);

    const existingSupervisorMap = new Map(
      existingSupervisors?.map(s => [`${s.email}-${s.company_id}`, s.id]) || []
    );

    // Separate inserts and updates
    const toInsert = supervisorsToInsert.filter(s => 
      !existingSupervisorMap.has(`${s.email}-${s.company_id}`)
    );
    const toUpdate = supervisorsToInsert.filter(s => 
      existingSupervisorMap.has(`${s.email}-${s.company_id}`)
    );

    // Batch insert new supervisors
    if (toInsert.length > 0) {
      const { error: insertError } = await adminSupabase
        .from('supervisors')
        .insert(toInsert);

      if (insertError) {
        errors += toInsert.length;
        errorMessages.push(`Errore batch creazione supervisori: ${insertError.message}`);
      } else {
        created = toInsert.length;
      }
    }

    // Batch update existing supervisors
    if (toUpdate.length > 0) {
      for (const supervisor of toUpdate) {
        const existingId = existingSupervisorMap.get(`${supervisor.email}-${supervisor.company_id}`);
        if (existingId) {
          const { error: updateError } = await adminSupabase
            .from('supervisors')
            .update({
              name: supervisor.name,
              phone: supervisor.phone,
            })
            .eq('id', existingId);

          if (updateError) {
            errors++;
            errorMessages.push(`Errore aggiornamento supervisore ${supervisor.email}: ${updateError.message}`);
          } else {
            updated++;
          }
        }
      }
    }
  }

  return { created, updated, errors, errorMessages };
}

// Main import endpoint
router.post('/excel', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) {
      throw new CustomError('Nessun file fornito', 400);
    }

    const importOptions = importDataSchema.parse(req.body);
    
    // Set partner_id for non-admin users
    const partnerId = req.user!.role !== 'admin' ? req.user!.partner_id : importOptions.partner_id;

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const result: ImportResult = {
      success: true,
      message: 'Import completato con successo',
      data: {
        partners: { created: 0, updated: 0, errors: 0 },
        companies: { created: 0, updated: 0, errors: 0 },
        students: { created: 0, updated: 0, errors: 0 },
        supervisors: { created: 0, updated: 0, errors: 0 },
      },
      errors: [],
    };

    // Process each sheet
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        console.log(`Sheet ${sheetName} not found, skipping`);
        continue;
      }
      
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        continue;
      }

      console.log(`Processing sheet: ${sheetName} with ${rows.length} rows`);

      try {
        switch (sheetName.toLowerCase()) {
          case 'partner':
          case 'partners':
            const partnerResult = await importPartners(rows, partnerId);
            result.data.partners = partnerResult;
            result.errors.push(...partnerResult.errorMessages);
            break;

          case 'aziende':
          case 'companies':
          case 'company':
            const companyResult = await importCompanies(rows, partnerId);
            result.data.companies = companyResult;
            result.errors.push(...companyResult.errorMessages);
            break;

          case 'clienti':
          case 'students':
          case 'student':
            const studentResult = await importStudents(rows, partnerId);
            result.data.students = studentResult;
            result.errors.push(...studentResult.errorMessages);
            break;

          case 'supervisori':
          case 'supervisors':
          case 'supervisor':
            const supervisorResult = await importSupervisors(rows, partnerId);
            result.data.supervisors = supervisorResult;
            result.errors.push(...supervisorResult.errorMessages);
            break;

          case 'lista':
            // Process the unified list sheet
            // This sheet contains all data types, so we need to identify the type based on columns
            const listResult = await processUnifiedList(rows, partnerId);
            result.data.partners.created += listResult.partners.created;
            result.data.partners.updated += listResult.partners.updated;
            result.data.partners.errors += listResult.partners.errors;
            
            result.data.companies.created += listResult.companies.created;
            result.data.companies.updated += listResult.companies.updated;
            result.data.companies.errors += listResult.companies.errors;
            
            result.data.students.created += listResult.students.created;
            result.data.students.updated += listResult.students.updated;
            result.data.students.errors += listResult.students.errors;
            
            result.data.supervisors.created += listResult.supervisors.created;
            result.data.supervisors.updated += listResult.supervisors.updated;
            result.data.supervisors.errors += listResult.supervisors.errors;
            
            result.errors.push(...listResult.errors);
            break;

          default:
            console.log(`Unknown sheet: ${sheetName}, skipping`);
        }
      } catch (error) {
        result.errors.push(`Errore nel processamento del foglio ${sheetName}: ${error}`);
      }
    }

    // Check if there were any errors
    const totalErrors = result.data.partners.errors + result.data.companies.errors + 
                       result.data.students.errors + result.data.supervisors.errors;

    if (totalErrors > 0) {
      result.success = false;
      result.message = `Import completato con ${totalErrors} errori`;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Helper function to process unified list sheet
async function processUnifiedList(rows: ExcelRow[], partnerId?: string): Promise<{
  partners: { created: number; updated: number; errors: number };
  companies: { created: number; updated: number; errors: number };
  students: { created: number; updated: number; errors: number };
  supervisors: { created: number; updated: number; errors: number };
  errors: string[];
}> {
  const result = {
    partners: { created: 0, updated: 0, errors: 0 },
    companies: { created: 0, updated: 0, errors: 0 },
    students: { created: 0, updated: 0, errors: 0 },
    supervisors: { created: 0, updated: 0, errors: 0 },
    errors: [] as string[],
  };

  // Group rows by type based on available columns
  const partnerRows: ExcelRow[] = [];
  const companyRows: ExcelRow[] = [];
  const studentRows: ExcelRow[] = [];
  const supervisorRows: ExcelRow[] = [];

  for (const row of rows) {
    const hasPartnerFields = row['Nome Partner'] || row['Partner'];
    const hasCompanyFields = row['Nome Azienda'] || row['Azienda'];
    const hasStudentFields = row['Nome Studente'] || row['Studente'];
    const hasSupervisorFields = row['Nome Supervisore'] || row['Supervisore'];

    if (hasPartnerFields && !hasCompanyFields && !hasStudentFields && !hasSupervisorFields) {
      partnerRows.push(row);
    } else if (hasCompanyFields && !hasStudentFields && !hasSupervisorFields) {
      companyRows.push(row);
    } else if (hasStudentFields && !hasSupervisorFields) {
      studentRows.push(row);
    } else if (hasSupervisorFields) {
      supervisorRows.push(row);
    }
  }

  // Process each type
  if (partnerRows.length > 0) {
    const partnerResult = await importPartners(partnerRows, partnerId);
    result.partners = partnerResult;
    result.errors.push(...partnerResult.errorMessages);
  }

  if (companyRows.length > 0) {
    const companyResult = await importCompanies(companyRows, partnerId);
    result.companies = companyResult;
    result.errors.push(...companyResult.errorMessages);
  }

  if (studentRows.length > 0) {
    const studentResult = await importStudents(studentRows, partnerId);
    result.students = studentResult;
    result.errors.push(...studentResult.errorMessages);
  }

  if (supervisorRows.length > 0) {
    const supervisorResult = await importSupervisors(supervisorRows, partnerId);
    result.supervisors = supervisorResult;
    result.errors.push(...supervisorResult.errorMessages);
  }

  return result;
}

// Get import template
router.get('/template', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Create a sample Excel file with the expected structure
    const workbook = XLSX.utils.book_new();

    // Partners sheet
    const partnersData = [
      ['Nome Partner'],
      ['TechCorp S.r.l.'],
      ['InnovateLab'],
      ['FutureTech']
    ];
    const partnersSheet = XLSX.utils.aoa_to_sheet(partnersData);
    XLSX.utils.book_append_sheet(workbook, partnersSheet, 'Partners');

    // Companies sheet
    const companiesData = [
      ['Nome Azienda', 'Indirizzo', 'Telefono', 'Email', 'Partner'],
      ['TechCorp S.r.l.', 'Via Roma 123, Milano', '+39 02 123 4567', 'info@techcorp.it', 'TechCorp S.r.l.'],
      ['InnovateLab', 'Corso Italia 456, Torino', '+39 011 123 4567', 'contact@innovatelab.it', 'InnovateLab']
    ];
    const companiesSheet = XLSX.utils.aoa_to_sheet(companiesData);
    XLSX.utils.book_append_sheet(workbook, companiesSheet, 'Aziende');

    // Students sheet
    const studentsData = [
      ['Nome Studente', 'Email', 'Telefono', 'Partner'],
      ['Mario Rossi', 'mario.rossi@email.com', '+39 123 456 7890', 'TechCorp S.r.l.'],
      ['Giulia Bianchi', 'giulia.bianchi@email.com', '+39 123 456 7891', 'TechCorp S.r.l.']
    ];
    const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Clienti');

    // Supervisors sheet
    const supervisorsData = [
      ['Nome Supervisore', 'Email', 'Telefono', 'Azienda', 'Partner'],
      ['Marco Rossi', 'marco.rossi@techcorp.it', '+39 02 123 4567', 'TechCorp S.r.l.', 'TechCorp S.r.l.'],
      ['Sara Bianchi', 'sara.bianchi@innovatelab.it', '+39 011 123 4567', 'InnovateLab', 'InnovateLab']
    ];
    const supervisorsSheet = XLSX.utils.aoa_to_sheet(supervisorsData);
    XLSX.utils.book_append_sheet(workbook, supervisorsSheet, 'Supervisori');

    // Unified list sheet
    const listData = [
      ['Tipo', 'Nome', 'Email', 'Telefono', 'Indirizzo', 'Azienda', 'Partner'],
      ['Partner', 'TechCorp S.r.l.', '', '', '', '', ''],
      ['Azienda', 'TechCorp S.r.l.', 'info@techcorp.it', '+39 02 123 4567', 'Via Roma 123, Milano', '', 'TechCorp S.r.l.'],
      ['Studente', 'Mario Rossi', 'mario.rossi@email.com', '+39 123 456 7890', '', '', 'TechCorp S.r.l.'],
      ['Supervisore', 'Marco Rossi', 'marco.rossi@techcorp.it', '+39 02 123 4567', '', 'TechCorp S.r.l.', 'TechCorp S.r.l.']
    ];
    const listSheet = XLSX.utils.aoa_to_sheet(listData);
    XLSX.utils.book_append_sheet(workbook, listSheet, 'Lista');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_import.xlsx"');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
});

export { router as importRoutes };

