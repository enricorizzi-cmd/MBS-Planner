-- Create custom types for disposition system
CREATE TYPE manual_area AS ENUM ('A', 'B', 'C');
CREATE TYPE session_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('confirmed', 'pending', 'cancelled');
CREATE TYPE seat_status AS ENUM ('occupied', 'reserved', 'empty', 'locked');

-- Create manuals table (mapping manuali → aree)
CREATE TABLE manuals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    area manual_area NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#00e5ff', -- Hex color
    order_priority INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table (classi mensili)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    location VARCHAR(255),
    status session_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(month, year, partner_id)
);

-- Create session days table (D1 e D2)
CREATE TABLE session_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index IN (1, 2)),
    date DATE NOT NULL,
    estimated_attendance INTEGER DEFAULT 0,
    actual_attendance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, day_index)
);

-- Create student enrollments table (iscrizioni a manuali)
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    manual_id UUID NOT NULL REFERENCES manuals(id) ON DELETE RESTRICT,
    current_progress INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 60,
    next_manual_id UUID REFERENCES manuals(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table (prenotazioni studenti per giorno)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_day_id UUID NOT NULL REFERENCES session_days(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    manual_id UUID NOT NULL REFERENCES manuals(id) ON DELETE RESTRICT,
    status booking_status NOT NULL DEFAULT 'confirmed',
    tags TEXT[] DEFAULT '{}', -- ['OPEN_DAY', 'COACH', 'RITARDO', etc.]
    keep_seat_between_days BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_day_id, student_id)
);

-- Create supervisors table (already exists, but adding abilities)
ALTER TABLE supervisors ADD COLUMN abilities JSONB DEFAULT '{"A": false, "B": false, "C": false}';

-- Create layouts table (geometria sala per sessione)
CREATE TABLE layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    seats_per_block INTEGER NOT NULL CHECK (seats_per_block IN (3, 4)),
    rows_count INTEGER NOT NULL CHECK (rows_count >= 8 AND rows_count <= 12),
    columns_count INTEGER NOT NULL CHECK (columns_count IN (9, 12)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create row assignments table (supervisori per riga)
CREATE TABLE row_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    row_letter CHAR(1) NOT NULL CHECK (row_letter ~ '^[a-z]$'),
    supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(layout_id, row_letter)
);

-- Create seats table (posti specifici in un giorno)
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_day_id UUID NOT NULL REFERENCES session_days(id) ON DELETE CASCADE,
    row_letter CHAR(1) NOT NULL CHECK (row_letter ~ '^[a-z]$'),
    column_number INTEGER NOT NULL CHECK (column_number >= 1 AND column_number <= 12),
    area manual_area NOT NULL,
    status seat_status NOT NULL DEFAULT 'empty',
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    reservation_for_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_day_id, row_letter, column_number)
);

-- Create disposition history table (cronologia modifiche)
CREATE TABLE disposition_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'auto_generate', 'manual_move', 'add_row', 'change_layout', etc.
    description TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_manuals_area ON manuals(area);
CREATE INDEX idx_manuals_order ON manuals(order_priority);
CREATE INDEX idx_sessions_month_year ON sessions(month, year);
CREATE INDEX idx_session_days_session_id ON session_days(session_id);
CREATE INDEX idx_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX idx_enrollments_manual_id ON student_enrollments(manual_id);
CREATE INDEX idx_enrollments_active ON student_enrollments(is_active);
CREATE INDEX idx_bookings_session_day_id ON bookings(session_day_id);
CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_manual_id ON bookings(manual_id);
CREATE INDEX idx_layouts_session_id ON layouts(session_id);
CREATE INDEX idx_row_assignments_layout_id ON row_assignments(layout_id);
CREATE INDEX idx_seats_session_day_id ON seats(session_day_id);
CREATE INDEX idx_seats_booking_id ON seats(booking_id);
CREATE INDEX idx_seats_area ON seats(area);
CREATE INDEX idx_disposition_history_session_id ON disposition_history(session_id);
CREATE INDEX idx_disposition_history_user_id ON disposition_history(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_manuals_updated_at BEFORE UPDATE ON manuals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_days_updated_at BEFORE UPDATE ON session_days FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_enrollments_updated_at BEFORE UPDATE ON student_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_layouts_updated_at BEFORE UPDATE ON layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_row_assignments_updated_at BEFORE UPDATE ON row_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

