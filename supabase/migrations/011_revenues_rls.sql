-- Enable RLS on revenues table
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- Admin can view all revenues
CREATE POLICY "Admin can view all revenues" ON revenues
    FOR SELECT USING (is_admin());

-- Users can view revenues from their partner
CREATE POLICY "Users can view revenues from their partner" ON revenues
    FOR SELECT USING (
        company_id IN (
            SELECT c.id FROM companies c
            JOIN students s ON s.id IN (
                SELECT sc.student_id FROM student_companies sc WHERE sc.company_id = c.id
            )
            WHERE s.partner_id = get_user_partner_id()
        )
    );

-- Users can insert revenues for their partner
CREATE POLICY "Users can insert revenues for their partner" ON revenues
    FOR INSERT WITH CHECK (
        is_admin() OR 
        company_id IN (
            SELECT c.id FROM companies c
            JOIN students s ON s.id IN (
                SELECT sc.student_id FROM student_companies sc WHERE sc.company_id = c.id
            )
            WHERE s.partner_id = get_user_partner_id()
        )
    );

-- Users can update revenues for their partner
CREATE POLICY "Users can update revenues for their partner" ON revenues
    FOR UPDATE USING (
        is_admin() OR 
        company_id IN (
            SELECT c.id FROM companies c
            JOIN students s ON s.id IN (
                SELECT sc.student_id FROM student_companies sc WHERE sc.company_id = c.id
            )
            WHERE s.partner_id = get_user_partner_id()
        )
    );

-- Users can delete revenues for their partner
CREATE POLICY "Users can delete revenues for their partner" ON revenues
    FOR DELETE USING (
        is_admin() OR 
        company_id IN (
            SELECT c.id FROM companies c
            JOIN students s ON s.id IN (
                SELECT sc.student_id FROM student_companies sc WHERE sc.company_id = c.id
            )
            WHERE s.partner_id = get_user_partner_id()
        )
    );

