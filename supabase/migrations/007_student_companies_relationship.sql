-- Create student_companies junction table for many-to-many relationship
CREATE TABLE student_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL DEFAULT 'Dipendente', -- Titolare, Dipendente, Consulente, etc.
    is_primary BOOLEAN NOT NULL DEFAULT false, -- Primary company for the student
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, company_id)
);

-- Remove the old company_id column from students table
ALTER TABLE students DROP COLUMN IF EXISTS company_id;

-- Add indexes for better performance
CREATE INDEX idx_student_companies_student_id ON student_companies(student_id);
CREATE INDEX idx_student_companies_company_id ON student_companies(company_id);
CREATE INDEX idx_student_companies_primary ON student_companies(is_primary) WHERE is_primary = true;

-- Create trigger for updated_at
CREATE TRIGGER update_student_companies_updated_at 
    BEFORE UPDATE ON student_companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure at least one primary company per student
CREATE OR REPLACE FUNCTION ensure_primary_company()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a company as primary, unset all other primaries for this student
    IF NEW.is_primary = true THEN
        UPDATE student_companies 
        SET is_primary = false 
        WHERE student_id = NEW.student_id AND id != NEW.id;
    END IF;
    
    -- If this is the only company for the student, make it primary
    IF NOT EXISTS (
        SELECT 1 FROM student_companies 
        WHERE student_id = NEW.student_id AND is_primary = true
    ) THEN
        NEW.is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_primary_company_trigger
    BEFORE INSERT OR UPDATE ON student_companies
    FOR EACH ROW EXECUTE FUNCTION ensure_primary_company();

-- Update bookings table to reference company from student_companies
-- We'll add a company_reference_id to bookings to track which company the booking is for
ALTER TABLE bookings ADD COLUMN company_reference_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Create a function to get the primary company for a student
CREATE OR REPLACE FUNCTION get_student_primary_company(student_uuid UUID)
RETURNS UUID AS $$
DECLARE
    primary_company_id UUID;
BEGIN
    SELECT company_id INTO primary_company_id
    FROM student_companies
    WHERE student_id = student_uuid AND is_primary = true
    LIMIT 1;
    
    RETURN primary_company_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all companies for a student
CREATE OR REPLACE FUNCTION get_student_companies(student_uuid UUID)
RETURNS TABLE(
    company_id UUID,
    company_name VARCHAR,
    role VARCHAR,
    is_primary BOOLEAN,
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.company_id,
        c.name as company_name,
        sc.role,
        sc.is_primary,
        sc.start_date,
        sc.end_date
    FROM student_companies sc
    JOIN companies c ON sc.company_id = c.id
    WHERE sc.student_id = student_uuid
    ORDER BY sc.is_primary DESC, sc.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all students for a company
CREATE OR REPLACE FUNCTION get_company_students(company_uuid UUID)
RETURNS TABLE(
    student_id UUID,
    student_name VARCHAR,
    student_email VARCHAR,
    role VARCHAR,
    is_primary BOOLEAN,
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.student_id,
        s.name as student_name,
        s.email as student_email,
        sc.role,
        sc.is_primary,
        sc.start_date,
        sc.end_date
    FROM student_companies sc
    JOIN students s ON sc.student_id = s.id
    WHERE sc.company_id = company_uuid
    ORDER BY sc.is_primary DESC, sc.start_date DESC;
END;
$$ LANGUAGE plpgsql;

