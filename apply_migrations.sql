-- Apply all migrations to Supabase production database
-- This script will create all necessary tables and policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'supervisor', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'project_manager',
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_companies relationship table
CREATE TABLE IF NOT EXISTS student_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, company_id)
);

-- Create revenues table
CREATE TABLE IF NOT EXISTS revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT,
    date DATE NOT NULL,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON supervisors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenues_updated_at BEFORE UPDATE ON revenues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for partner check
CREATE OR REPLACE FUNCTION user_partner_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT partner_id FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for partners
CREATE POLICY "Admin can view all partners" ON partners
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert partners" ON partners
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update partners" ON partners
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete partners" ON partners
    FOR DELETE USING (is_admin());

-- Create RLS policies for users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert users" ON users
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update users" ON users
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete users" ON users
    FOR DELETE USING (is_admin());

-- Create RLS policies for students
CREATE POLICY "Users can view students from their partner" ON students
    FOR SELECT USING (partner_id = user_partner_id() OR is_admin());

CREATE POLICY "Admin can insert students" ON students
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update students" ON students
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete students" ON students
    FOR DELETE USING (is_admin());

-- Create RLS policies for companies
CREATE POLICY "Users can view companies from their partner" ON companies
    FOR SELECT USING (partner_id = user_partner_id() OR is_admin());

CREATE POLICY "Admin can insert companies" ON companies
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update companies" ON companies
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete companies" ON companies
    FOR DELETE USING (is_admin());

-- Create RLS policies for supervisors
CREATE POLICY "Users can view supervisors from their partner" ON supervisors
    FOR SELECT USING (partner_id = user_partner_id() OR is_admin());

CREATE POLICY "Admin can insert supervisors" ON supervisors
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update supervisors" ON supervisors
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete supervisors" ON supervisors
    FOR DELETE USING (is_admin());

-- Create RLS policies for programs
CREATE POLICY "Users can view programs from their partner" ON programs
    FOR SELECT USING (partner_id = user_partner_id() OR is_admin());

CREATE POLICY "Admin can insert programs" ON programs
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update programs" ON programs
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete programs" ON programs
    FOR DELETE USING (is_admin());

-- Create RLS policies for student_companies
CREATE POLICY "Users can view student_companies from their partner" ON student_companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_companies.student_id 
            AND s.partner_id = user_partner_id()
        ) OR is_admin()
    );

CREATE POLICY "Admin can insert student_companies" ON student_companies
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update student_companies" ON student_companies
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete student_companies" ON student_companies
    FOR DELETE USING (is_admin());

-- Create RLS policies for revenues
CREATE POLICY "Users can view revenues from their partner" ON revenues
    FOR SELECT USING (partner_id = user_partner_id() OR is_admin());

CREATE POLICY "Admin can insert revenues" ON revenues
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update revenues" ON revenues
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete revenues" ON revenues
    FOR DELETE USING (is_admin());

-- Insert initial partners
INSERT INTO partners (id, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Mind Business School'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Partner Demo')
ON CONFLICT (id) DO NOTHING;

-- Create functions for RLS management
CREATE OR REPLACE FUNCTION disable_rls_for_partners()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
END;
$$;

CREATE OR REPLACE FUNCTION enable_rls_for_partners()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION disable_rls_for_partners() TO service_role;
GRANT EXECUTE ON FUNCTION enable_rls_for_partners() TO service_role;

-- Insert additional partners
INSERT INTO partners (id, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440003', 'Venezia'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Rovigo')
ON CONFLICT (id) DO NOTHING;
