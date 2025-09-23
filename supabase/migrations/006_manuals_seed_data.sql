-- Insert manuals with area mapping
INSERT INTO manuals (code, name, area, color, order_priority, total_points) VALUES 
-- Area A: Vendite / Marketing / Etica / DV / Comunicazione Pratica
('VENDITE', 'Vendite', 'A', '#ef4444', 10, 60),
('MARKETING', 'Marketing', 'A', '#f97316', 20, 60),
('ETICA', 'Etica', 'A', '#eab308', 30, 60),
('DV', 'DV', 'A', '#84cc16', 40, 60),
('COM_PRATICA', 'Comunicazione Pratica', 'A', '#22c55e', 50, 60),

-- Area B: Comunicazione Teoria / Potenziale / Principi / Basi / Marketing / Ruolo Amm. / Open Day
('COM_TEORIA', 'Comunicazione Teoria', 'B', '#06b6d4', 60, 60),
('POTENZIALE', 'Potenziale', 'B', '#3b82f6', 70, 60),
('PRINCIPI', 'Principi', 'B', '#6366f1', 80, 60),
('BASI', 'Basi', 'B', '#8b5cf6', 90, 60),
('MARKETING_B', 'Marketing B', 'B', '#a855f7', 100, 60),
('RUOLO_AMM', 'Ruolo Amministrativo', 'B', '#d946ef', 110, 60),
('OPEN_DAY', 'Open Day', 'B', '#ec4899', 120, 60),

-- Area C: Leadership / Spunti / Management / EdilMasterclass / Resp. Intermedio
('LEADERSHIP', 'Leadership', 'C', '#f43f5e', 130, 60),
('SPUNTI', 'Spunti', 'C', '#fb7185', 140, 60),
('MANAGEMENT', 'Management', 'C', '#fda4af', 150, 60),
('EDIL_MASTERCLASS', 'EdilMasterclass', 'C', '#fecaca', 160, 60),
('RESP_INTERMEDIO', 'Responsabile Intermedio', 'C', '#fed7d7', 170, 60);

-- Create sample session for current month
INSERT INTO sessions (month, year, location, status, partner_id) VALUES 
(EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), 'Sede Principale', 'draft', '550e8400-e29b-41d4-a716-446655440001');

-- Create session days for the sample session
INSERT INTO session_days (session_id, day_index, date, estimated_attendance) 
SELECT 
    s.id,
    day_index,
    CASE 
        WHEN day_index = 1 THEN DATE_TRUNC('month', NOW()) + INTERVAL '14 days'
        WHEN day_index = 2 THEN DATE_TRUNC('month', NOW()) + INTERVAL '15 days'
    END,
    80
FROM sessions s
CROSS JOIN (SELECT 1 as day_index UNION SELECT 2) d
WHERE s.month = EXTRACT(MONTH FROM NOW()) AND s.year = EXTRACT(YEAR FROM NOW());

-- Create sample student enrollments
INSERT INTO student_enrollments (student_id, manual_id, current_progress, total_points, next_manual_id) 
SELECT 
    s.id,
    m.id,
    CASE 
        WHEN m.area = 'A' THEN 45
        WHEN m.area = 'B' THEN 30
        WHEN m.area = 'C' THEN 55
    END,
    60,
    CASE 
        WHEN m.area = 'A' THEN (SELECT id FROM manuals WHERE area = 'B' ORDER BY order_priority LIMIT 1)
        WHEN m.area = 'B' THEN (SELECT id FROM manuals WHERE area = 'C' ORDER BY order_priority LIMIT 1)
        WHEN m.area = 'C' THEN NULL
    END
FROM students s
CROSS JOIN manuals m
WHERE s.partner_id = '550e8400-e29b-41d4-a716-446655440001'
AND m.area = 'A'
LIMIT 5;

-- Add more enrollments for different areas
INSERT INTO student_enrollments (student_id, manual_id, current_progress, total_points, next_manual_id) 
SELECT 
    s.id,
    m.id,
    CASE 
        WHEN m.area = 'B' THEN 25
        WHEN m.area = 'C' THEN 50
    END,
    60,
    CASE 
        WHEN m.area = 'B' THEN (SELECT id FROM manuals WHERE area = 'C' ORDER BY order_priority LIMIT 1)
        WHEN m.area = 'C' THEN NULL
    END
FROM students s
CROSS JOIN manuals m
WHERE s.partner_id = '550e8400-e29b-41d4-a716-446655440001'
AND m.area IN ('B', 'C')
LIMIT 8;

-- Create sample bookings for the session
INSERT INTO bookings (session_day_id, student_id, manual_id, status, tags, keep_seat_between_days)
SELECT 
    sd.id,
    se.student_id,
    se.manual_id,
    'confirmed',
    CASE 
        WHEN se.current_progress >= 50 THEN ARRAY['QUASI_FINE']
        ELSE ARRAY[]::TEXT[]
    END,
    CASE 
        WHEN se.current_progress >= 50 THEN true
        ELSE false
    END
FROM session_days sd
JOIN sessions s ON sd.session_id = s.id
JOIN student_enrollments se ON se.student_id IN (
    SELECT id FROM students WHERE partner_id = s.partner_id
)
WHERE s.month = EXTRACT(MONTH FROM NOW()) AND s.year = EXTRACT(YEAR FROM NOW())
AND se.is_active = true;

