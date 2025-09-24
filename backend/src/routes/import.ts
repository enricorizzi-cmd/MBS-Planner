import { Router } from 'express';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { supabase } from '../index.js';
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
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

// Import partners from Excel
async function importPartners(rows: ExcelRow[], partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Partner'] || row['Partner'] || row['Nome']);
      
      if (!name) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Nome partner mancante`);
        continue;
      }

      // Check if partner already exists
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('name', name)
        .single();

      if (existingPartner) {
        updated++;
      } else {
        const { error } = await supabase
          .from('partners')
          .insert({
            id: uuidv4(),
            name: name,
          });

        if (error) {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore creazione partner - ${error.message}`);
        } else {
          created++;
        }
      }
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore generico - ${error}`);
    }
  }

  return { created, updated, errors, errorMessages };
}

// Import companies from Excel
async function importCompanies(rows: ExcelRow[], partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Azienda'] || row['Azienda'] || row['Nome']);
      const address = cleanData(row['Indirizzo'] || row['Address']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const email = cleanData(row['Email']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Nome azienda mancante`);
        continue;
      }

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Email non valida - ${email}`);
        continue;
      }

      // Validate phone if provided
      if (phone && !isValidPhone(phone)) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Telefono non valido - ${phone}`);
        continue;
      }

      // Get partner ID
      let partnerIdToUse = partnerId;
      if (partnerName && !partnerIdToUse) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('name', partnerName)
          .single();
        
        if (partner) {
          partnerIdToUse = partner.id;
        } else {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Partner non trovato - ${partnerName}`);
          continue;
        }
      }

      if (!partnerIdToUse) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Partner ID mancante`);
        continue;
      }

      // Check if company already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', name)
        .eq('partner_id', partnerIdToUse)
        .single();

      const companyData = {
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
        partner_id: partnerIdToUse,
      };

      if (existingCompany) {
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompany.id);

        if (error) {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore aggiornamento azienda - ${error.message}`);
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase
          .from('companies')
          .insert({
            id: uuidv4(),
            ...companyData,
          });

        if (error) {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore creazione azienda - ${error.message}`);
        } else {
          created++;
        }
      }
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore generico - ${error}`);
    }
  }

  return { created, updated, errors, errorMessages };
}

// Import students from Excel
async function importStudents(rows: ExcelRow[], partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Studente'] || row['Studente'] || row['Nome']);
      const email = cleanData(row['Email']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name || !email) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Nome o email studente mancanti`);
        continue;
      }

      // Validate email
      if (!isValidEmail(email)) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Email non valida - ${email}`);
        continue;
      }

      // Validate phone if provided
      if (phone && !isValidPhone(phone)) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Telefono non valido - ${phone}`);
        continue;
      }

      // Get partner ID
      let partnerIdToUse = partnerId;
      if (partnerName && !partnerIdToUse) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('name', partnerName)
          .single();
        
        if (partner) {
          partnerIdToUse = partner.id;
        } else {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Partner non trovato - ${partnerName}`);
          continue;
        }
      }

      if (!partnerIdToUse) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Partner ID mancante`);
        continue;
      }

      // Check if student already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .eq('partner_id', partnerIdToUse)
        .single();

      const studentData = {
        name,
        email,
        phone: phone || null,
        partner_id: partnerIdToUse,
      };

      if (existingStudent) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', existingStudent.id);

        if (error) {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore aggiornamento studente - ${error.message}`);
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase
          .from('students')
          .insert({
            id: uuidv4(),
            ...studentData,
          });

        if (error) {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore creazione studente - ${error.message}`);
        } else {
          created++;
        }
      }
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore generico - ${error}`);
    }
  }

  return { created, updated, errors, errorMessages };
}

// Import supervisors from Excel
async function importSupervisors(rows: ExcelRow[], partnerId?: string): Promise<ImportFunctionResult> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const row of rows) {
    try {
      const name = cleanData(row['Nome Supervisore'] || row['Supervisore'] || row['Nome']);
      const email = cleanData(row['Email']);
      const phone = cleanData(row['Telefono'] || row['Phone']);
      const companyName = cleanData(row['Azienda'] || row['Nome Azienda']);
      const partnerName = cleanData(row['Partner'] || row['Nome Partner']);

      if (!name || !email || !companyName) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Nome, email o azienda supervisore mancanti`);
        continue;
      }

      // Validate email
      if (!isValidEmail(email)) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Email non valida - ${email}`);
        continue;
      }

      // Validate phone if provided
      if (phone && !isValidPhone(phone)) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Telefono non valido - ${phone}`);
        continue;
      }

      // Get partner ID
      let partnerIdToUse = partnerId;
      if (partnerName && !partnerIdToUse) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('name', partnerName)
          .single();
        
        if (partner) {
          partnerIdToUse = partner.id;
        } else {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Partner non trovato - ${partnerName}`);
          continue;
        }
      }

      if (!partnerIdToUse) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Partner ID mancante`);
        continue;
      }

      // Get company ID
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .eq('partner_id', partnerIdToUse)
        .single();

      if (!company) {
        errors++;
        errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Azienda non trovata - ${companyName}`);
        continue;
      }

      // Check if supervisor already exists
      const { data: existingSupervisor } = await supabase
        .from('supervisors')
        .select('id')
        .eq('email', email)
        .eq('company_id', company.id)
        .single();

      const supervisorData = {
        name,
        email,
        phone: phone || null,
        company_id: company.id,
        partner_id: partnerIdToUse,
      };

      if (existingSupervisor) {
        const { error } = await supabase
          .from('supervisors')
          .update(supervisorData)
          .eq('id', existingSupervisor.id);

        if (error) {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore aggiornamento supervisore - ${error.message}`);
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase
          .from('supervisors')
          .insert({
            id: uuidv4(),
            ...supervisorData,
          });

        if (error) {
          errors++;
          errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore creazione supervisore - ${error.message}`);
        } else {
          created++;
        }
      }
    } catch (error) {
      errors++;
      errorMessages.push(`Riga ${rows.indexOf(row) + 1}: Errore generico - ${error}`);
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

