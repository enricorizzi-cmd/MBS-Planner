-- Enable Row Level Security on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user's partner_id
CREATE OR REPLACE FUNCTION get_user_partner_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT partner_id 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Partners policies
CREATE POLICY "Admin can view all partners" ON partners
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert partners" ON partners
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update partners" ON partners
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete partners" ON partners
    FOR DELETE USING (is_admin());

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view users from their partner" ON users
    FOR SELECT USING (partner_id = get_user_partner_id());

CREATE POLICY "Admin can insert users" ON users
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete users" ON users
    FOR DELETE USING (is_admin());

-- Students policies
CREATE POLICY "Admin can view all students" ON students
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view students from their partner" ON students
    FOR SELECT USING (partner_id = get_user_partner_id());

CREATE POLICY "Users can insert students to their partner" ON students
    FOR INSERT WITH CHECK (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can update students from their partner" ON students
    FOR UPDATE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete students from their partner" ON students
    FOR DELETE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

-- Companies policies
CREATE POLICY "Admin can view all companies" ON companies
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view companies from their partner" ON companies
    FOR SELECT USING (partner_id = get_user_partner_id());

CREATE POLICY "Users can insert companies to their partner" ON companies
    FOR INSERT WITH CHECK (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can update companies from their partner" ON companies
    FOR UPDATE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete companies from their partner" ON companies
    FOR DELETE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

-- Supervisors policies
CREATE POLICY "Admin can view all supervisors" ON supervisors
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view supervisors from their partner" ON supervisors
    FOR SELECT USING (partner_id = get_user_partner_id());

CREATE POLICY "Users can insert supervisors to their partner" ON supervisors
    FOR INSERT WITH CHECK (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can update supervisors from their partner" ON supervisors
    FOR UPDATE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete supervisors from their partner" ON supervisors
    FOR DELETE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

-- Programs policies
CREATE POLICY "Admin can view all programs" ON programs
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view programs from their partner" ON programs
    FOR SELECT USING (partner_id = get_user_partner_id());

CREATE POLICY "Users can insert programs to their partner" ON programs
    FOR INSERT WITH CHECK (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can update programs from their partner" ON programs
    FOR UPDATE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete programs from their partner" ON programs
    FOR DELETE USING (
        is_admin() OR 
        (partner_id = get_user_partner_id() AND auth.uid() IS NOT NULL)
    );

-- Push subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON push_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON push_subscriptions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own subscriptions" ON push_subscriptions
    FOR DELETE USING (user_id = auth.uid());

