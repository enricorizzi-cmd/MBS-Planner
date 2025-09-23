-- Insert sample revenue data for testing
INSERT INTO revenues (company_id, month, year, amount, notes) 
SELECT 
    c.id,
    month_num,
    year_num,
    CASE 
        WHEN month_num <= 6 THEN 50000 + (month_num * 5000) + (year_num - 2022) * 10000
        ELSE 80000 + (month_num * 3000) + (year_num - 2022) * 15000
    END,
    'Dati di esempio per test'
FROM companies c
CROSS JOIN generate_series(1, 12) as month_num
CROSS JOIN generate_series(2022, 2024) as year_num
WHERE c.id IN (
    SELECT id FROM companies LIMIT 3
)
ON CONFLICT (company_id, month, year) DO NOTHING;

