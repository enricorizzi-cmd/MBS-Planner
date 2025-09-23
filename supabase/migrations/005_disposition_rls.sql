-- Enable RLS on new tables
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE row_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposition_history ENABLE ROW LEVEL SECURITY;

-- Manuals policies (read-only for all users, admin can manage)
CREATE POLICY "Admin can manage manuals" ON manuals
    FOR ALL USING (is_admin());

CREATE POLICY "Users can view manuals" ON manuals
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Sessions policies
CREATE POLICY "Admin can view all sessions" ON sessions
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view sessions from their partner" ON sessions
    FOR SELECT USING (partner_id = get_user_partner_id());

CREATE POLICY "Users can insert sessions to their partner" ON sessions
    FOR INSERT WITH CHECK (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can update sessions from their partner" ON sessions
    FOR UPDATE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete sessions from their partner" ON sessions
    FOR DELETE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

-- Session days policies
CREATE POLICY "Admin can view all session days" ON session_days
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view session days from their partner" ON session_days
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM sessions WHERE partner_id = get_user_partner_id()
        )
    );

CREATE POLICY "Users can manage session days from their partner" ON session_days
    FOR ALL USING (
        is_admin() OR 
        session_id IN (
            SELECT id FROM sessions WHERE partner_id = get_user_partner_id()
        )
    );

-- Student enrollments policies
CREATE POLICY "Admin can view all enrollments" ON student_enrollments
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view enrollments from their partner" ON student_enrollments
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

CREATE POLICY "Users can manage enrollments from their partner" ON student_enrollments
    FOR ALL USING (
        is_admin() OR 
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

-- Bookings policies
CREATE POLICY "Admin can view all bookings" ON bookings
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view bookings from their partner" ON bookings
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

CREATE POLICY "Users can manage bookings from their partner" ON bookings
    FOR ALL USING (
        is_admin() OR 
        student_id IN (
            SELECT id FROM students WHERE partner_id = get_user_partner_id()
        )
    );

-- Layouts policies
CREATE POLICY "Admin can view all layouts" ON layouts
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view layouts from their partner" ON layouts
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM sessions WHERE partner_id = get_user_partner_id()
        )
    );

CREATE POLICY "Users can manage layouts from their partner" ON layouts
    FOR ALL USING (
        is_admin() OR 
        session_id IN (
            SELECT id FROM sessions WHERE partner_id = get_user_partner_id()
        )
    );

-- Row assignments policies
CREATE POLICY "Admin can view all row assignments" ON row_assignments
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view row assignments from their partner" ON row_assignments
    FOR SELECT USING (
        layout_id IN (
            SELECT l.id FROM layouts l
            JOIN sessions s ON l.session_id = s.id
            WHERE s.partner_id = get_user_partner_id()
        )
    );

CREATE POLICY "Users can manage row assignments from their partner" ON row_assignments
    FOR ALL USING (
        is_admin() OR 
        layout_id IN (
            SELECT l.id FROM layouts l
            JOIN sessions s ON l.session_id = s.id
            WHERE s.partner_id = get_user_partner_id()
        )
    );

-- Seats policies
CREATE POLICY "Admin can view all seats" ON seats
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view seats from their partner" ON seats
    FOR SELECT USING (
        session_day_id IN (
            SELECT sd.id FROM session_days sd
            JOIN sessions s ON sd.session_id = s.id
            WHERE s.partner_id = get_user_partner_id()
        )
    );

CREATE POLICY "Users can manage seats from their partner" ON seats
    FOR ALL USING (
        is_admin() OR 
        session_day_id IN (
            SELECT sd.id FROM session_days sd
            JOIN sessions s ON sd.session_id = s.id
            WHERE s.partner_id = get_user_partner_id()
        )
    );

-- Disposition history policies
CREATE POLICY "Admin can view all disposition history" ON disposition_history
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view disposition history from their partner" ON disposition_history
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM sessions WHERE partner_id = get_user_partner_id()
        )
    );

CREATE POLICY "Users can insert disposition history from their partner" ON disposition_history
    FOR INSERT WITH CHECK (
        is_admin() OR 
        (session_id IN (
            SELECT id FROM sessions WHERE partner_id = get_user_partner_id()
        ) AND user_id = auth.uid())
    );

