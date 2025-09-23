-- Migrate existing data from students.company_id to student_companies table
-- First, create student_companies entries for existing students
INSERT INTO student_companies (student_id, company_id, role, is_primary, start_date)
SELECT 
    s.id as student_id,
    s.company_id as company_id,
    'Dipendente' as role,
    true as is_primary,
    s.created_at::date as start_date
FROM students s
WHERE s.company_id IS NOT NULL
ON CONFLICT (student_id, company_id) DO NOTHING;

-- Update bookings to reference the primary company
UPDATE bookings 
SET company_reference_id = (
    SELECT sc.company_id 
    FROM student_companies sc 
    WHERE sc.student_id = bookings.student_id 
    AND sc.is_primary = true 
    LIMIT 1
)
WHERE company_reference_id IS NULL;

-- Add some sample data for testing the many-to-many relationship
-- Create additional company relationships for some students
INSERT INTO student_companies (student_id, company_id, role, is_primary, start_date, notes)
SELECT 
    s.id,
    c.id,
    'Titolare',
    false,
    CURRENT_DATE - INTERVAL '1 year',
    'Azienda secondaria'
FROM students s
CROSS JOIN companies c
WHERE s.id IN (
    SELECT id FROM students LIMIT 3
)
AND c.id != (
    SELECT sc.company_id 
    FROM student_companies sc 
    WHERE sc.student_id = s.id 
    AND sc.is_primary = true 
    LIMIT 1
)
LIMIT 5
ON CONFLICT (student_id, company_id) DO NOTHING;

