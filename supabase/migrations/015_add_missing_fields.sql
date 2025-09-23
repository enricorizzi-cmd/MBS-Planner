-- Migrazione per aggiungere campi mancanti alle tabelle esistenti
-- File: 015_add_missing_fields.sql

-- Aggiungi campi mancanti alla tabella students
ALTER TABLE students ADD COLUMN IF NOT EXISTS ruolo VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS tipologia VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS importo_vsd_mbs DECIMAL(10,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS consulenti VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS manuale_di_studio VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS avanzamento VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS prossimo_studio VARCHAR(100);

-- Aggiungi campi mancanti alla tabella companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sito_azienda VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settore VARCHAR(500);

-- Crea tabella per i collegamenti studente-azienda con tutti i campi
CREATE TABLE IF NOT EXISTS student_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ruolo VARCHAR(100),
    categoria VARCHAR(50),
    tipologia VARCHAR(50),
    importo_vsd_mbs DECIMAL(10,2),
    consulenti VARCHAR(255),
    manuale_di_studio VARCHAR(100),
    avanzamento VARCHAR(100),
    prossimo_studio VARCHAR(100),
    sito_azienda VARCHAR(500),
    settore VARCHAR(500),
    is_primary BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, company_id)
);

-- Crea trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_companies_updated_at 
    BEFORE UPDATE ON student_companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_student_companies_student_id ON student_companies(student_id);
CREATE INDEX IF NOT EXISTS idx_student_companies_company_id ON student_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_students_partner_id ON students(partner_id);
CREATE INDEX IF NOT EXISTS idx_companies_partner_id ON companies(partner_id);

-- Abilita RLS per la nuova tabella
ALTER TABLE student_companies ENABLE ROW LEVEL SECURITY;

-- Crea policy RLS per student_companies
CREATE POLICY "Users can view student_companies for their partner" ON student_companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s 
            JOIN users u ON s.partner_id = u.partner_id 
            WHERE s.id = student_companies.student_id 
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert student_companies for their partner" ON student_companies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s 
            JOIN users u ON s.partner_id = u.partner_id 
            WHERE s.id = student_companies.student_id 
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can update student_companies for their partner" ON student_companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s 
            JOIN users u ON s.partner_id = u.partner_id 
            WHERE s.id = student_companies.student_id 
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete student_companies for their partner" ON student_companies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM students s 
            JOIN users u ON s.partner_id = u.partner_id 
            WHERE s.id = student_companies.student_id 
            AND u.id = auth.uid()
        )
    );
