-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'amministrazione', 'titolare');
CREATE TYPE program_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Create partners table
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'project_manager',
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supervisors table
CREATE TABLE supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create programs table
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status program_status NOT NULL DEFAULT 'draft',
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push_subscriptions table for PWA notifications
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Create indexes for better performance
CREATE INDEX idx_users_partner_id ON users(partner_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_partner_id ON students(partner_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_companies_partner_id ON companies(partner_id);
CREATE INDEX idx_supervisors_partner_id ON supervisors(partner_id);
CREATE INDEX idx_supervisors_company_id ON supervisors(company_id);
CREATE INDEX idx_programs_partner_id ON programs(partner_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

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
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

