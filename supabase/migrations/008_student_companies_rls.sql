-- Enable RLS on student_companies table
ALTER TABLE student_companies ENABLE ROW LEVEL SECURITY;

-- Admin can view all student-company relationships
CREATE POLICY "Admin can view all student companies" ON student_companies
    FOR SELECT USING (is_admin());

-- Users can view student-company relationships from their partner
CREATE POLICY "Users can view student companies from their partner" ON student_companies
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

-- Users can insert student-company relationships for their partner
CREATE POLICY "Users can insert student companies for their partner" ON student_companies
    FOR INSERT WITH CHECK (
        is_admin() OR 
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

-- Users can update student-company relationships for their partner
CREATE POLICY "Users can update student companies for their partner" ON student_companies
    FOR UPDATE USING (
        is_admin() OR 
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

-- Users can delete student-company relationships for their partner
CREATE POLICY "Users can delete student companies for their partner" ON student_companies
    FOR DELETE USING (
        is_admin() OR 
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

