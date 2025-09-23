-- Insert initial partners
INSERT INTO partners (id, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'TechCorp S.r.l.'),
    ('550e8400-e29b-41d4-a716-446655440002', 'InnovateLab'),
    ('550e8400-e29b-41d4-a716-446655440003', 'FutureTech'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Digital Solutions'),
    ('550e8400-e29b-41d4-a716-446655440005', 'StartupHub');

-- Insert sample companies
INSERT INTO companies (id, name, address, phone, email, partner_id) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'TechCorp S.r.l.', 'Via Roma 123, Milano', '+39 02 123 4567', 'info@techcorp.it', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440002', 'InnovateLab', 'Corso Italia 456, Torino', '+39 011 123 4567', 'contact@innovatelab.it', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440003', 'FutureTech', 'Piazza Duomo 789, Firenze', '+39 055 123 4567', 'hello@futuretech.it', '550e8400-e29b-41d4-a716-446655440003'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Digital Solutions', 'Via Garibaldi 321, Bologna', '+39 051 123 4567', 'info@digitalsolutions.it', '550e8400-e29b-41d4-a716-446655440004'),
    ('660e8400-e29b-41d4-a716-446655440005', 'StartupHub', 'Corso Vittorio Emanuele 654, Napoli', '+39 081 123 4567', 'hello@startuphub.it', '550e8400-e29b-41d4-a716-446655440005');

-- Insert sample students
INSERT INTO students (id, name, email, phone, partner_id) VALUES 
    ('770e8400-e29b-41d4-a716-446655440001', 'Mario Rossi', 'mario.rossi@email.com', '+39 123 456 7890', '550e8400-e29b-41d4-a716-446655440001'),
    ('770e8400-e29b-41d4-a716-446655440002', 'Giulia Bianchi', 'giulia.bianchi@email.com', '+39 123 456 7891', '550e8400-e29b-41d4-a716-446655440001'),
    ('770e8400-e29b-41d4-a716-446655440003', 'Luca Verdi', 'luca.verdi@email.com', '+39 123 456 7892', '550e8400-e29b-41d4-a716-446655440002'),
    ('770e8400-e29b-41d4-a716-446655440004', 'Anna Neri', 'anna.neri@email.com', '+39 123 456 7893', '550e8400-e29b-41d4-a716-446655440002'),
    ('770e8400-e29b-41d4-a716-446655440005', 'Marco Blu', 'marco.blu@email.com', '+39 123 456 7894', '550e8400-e29b-41d4-a716-446655440003'),
    ('770e8400-e29b-41d4-a716-446655440006', 'Sara Gialli', 'sara.gialli@email.com', '+39 123 456 7895', '550e8400-e29b-41d4-a716-446655440003'),
    ('770e8400-e29b-41d4-a716-446655440007', 'Giuseppe Rossi', 'giuseppe.rossi@email.com', '+39 123 456 7896', '550e8400-e29b-41d4-a716-446655440004'),
    ('770e8400-e29b-41d4-a716-446655440008', 'Francesca Verde', 'francesca.verde@email.com', '+39 123 456 7897', '550e8400-e29b-41d4-a716-446655440004'),
    ('770e8400-e29b-41d4-a716-446655440009', 'Antonio Bianco', 'antonio.bianco@email.com', '+39 123 456 7898', '550e8400-e29b-41d4-a716-446655440005'),
    ('770e8400-e29b-41d4-a716-446655440010', 'Elena Rosa', 'elena.rosa@email.com', '+39 123 456 7899', '550e8400-e29b-41d4-a716-446655440005');

-- Insert sample supervisors
INSERT INTO supervisors (id, name, email, phone, company_id, partner_id) VALUES 
    ('880e8400-e29b-41d4-a716-446655440001', 'Marco Rossi', 'marco.rossi@techcorp.it', '+39 02 123 4567', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
    ('880e8400-e29b-41d4-a716-446655440002', 'Sara Bianchi', 'sara.bianchi@innovatelab.it', '+39 011 123 4567', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002'),
    ('880e8400-e29b-41d4-a716-446655440003', 'Giuseppe Verdi', 'giuseppe.verdi@futuretech.it', '+39 055 123 4567', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003'),
    ('880e8400-e29b-41d4-a716-446655440004', 'Laura Neri', 'laura.neri@digitalsolutions.it', '+39 051 123 4567', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004'),
    ('880e8400-e29b-41d4-a716-446655440005', 'Roberto Blu', 'roberto.blu@startuphub.it', '+39 081 123 4567', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005');

-- Insert sample programs
INSERT INTO programs (id, name, description, start_date, end_date, status, partner_id) VALUES 
    ('990e8400-e29b-41d4-a716-446655440001', 'Programma Frontend Development', 'Corso completo di sviluppo frontend con React e TypeScript', '2024-01-15T09:00:00Z', '2024-07-15T18:00:00Z', 'active', '550e8400-e29b-41d4-a716-446655440001'),
    ('990e8400-e29b-41d4-a716-446655440002', 'Programma Backend Development', 'Corso di sviluppo backend con Node.js e database', '2024-02-01T09:00:00Z', '2024-08-01T18:00:00Z', 'active', '550e8400-e29b-41d4-a716-446655440002'),
    ('990e8400-e29b-41d4-a716-446655440003', 'Programma Full Stack', 'Corso completo full stack development', '2024-03-01T09:00:00Z', '2024-09-01T18:00:00Z', 'draft', '550e8400-e29b-41d4-a716-446655440003'),
    ('990e8400-e29b-41d4-a716-446655440004', 'Programma Mobile Development', 'Corso di sviluppo mobile con React Native', '2024-04-01T09:00:00Z', '2024-10-01T18:00:00Z', 'draft', '550e8400-e29b-41d4-a716-446655440004'),
    ('990e8400-e29b-41d4-a716-446655440005', 'Programma DevOps', 'Corso di DevOps e deployment', '2024-05-01T09:00:00Z', '2024-11-01T18:00:00Z', 'draft', '550e8400-e29b-41d4-a716-446655440005');

-- Note: Users will be created through the application's registration process
-- The admin user should be created manually through Supabase Auth and then linked to the users table

