-- Create revenues table for monthly company revenues
CREATE TABLE revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX idx_revenues_company_id ON revenues(company_id);
CREATE INDEX idx_revenues_year_month ON revenues(year, month);
CREATE INDEX idx_revenues_company_year ON revenues(company_id, year);

-- Create trigger for updated_at
CREATE TRIGGER update_revenues_updated_at 
    BEFORE UPDATE ON revenues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get monthly revenue with increment
CREATE OR REPLACE FUNCTION get_monthly_revenue_with_increment(company_uuid UUID, target_month INTEGER, target_year INTEGER)
RETURNS TABLE(
    month INTEGER,
    year INTEGER,
    amount DECIMAL(15,2),
    increment_percent DECIMAL(5,2)
) AS $$
DECLARE
    current_amount DECIMAL(15,2);
    previous_amount DECIMAL(15,2);
    increment DECIMAL(5,2);
BEGIN
    -- Get current month amount
    SELECT r.amount INTO current_amount
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.month = target_month 
    AND r.year = target_year;
    
    -- Get previous year same month amount
    SELECT r.amount INTO previous_amount
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.month = target_month 
    AND r.year = target_year - 1;
    
    -- Calculate increment percentage
    IF previous_amount IS NOT NULL AND previous_amount > 0 THEN
        increment := ((current_amount - previous_amount) / previous_amount) * 100;
    ELSE
        increment := NULL;
    END IF;
    
    RETURN QUERY SELECT target_month, target_year, current_amount, increment;
END;
$$ LANGUAGE plpgsql;

-- Create function to get annual revenue with increment
CREATE OR REPLACE FUNCTION get_annual_revenue_with_increment(company_uuid UUID, target_year INTEGER)
RETURNS TABLE(
    year INTEGER,
    total_amount DECIMAL(15,2),
    increment_percent DECIMAL(5,2),
    ytd_increment_percent DECIMAL(5,2)
) AS $$
DECLARE
    current_total DECIMAL(15,2);
    previous_total DECIMAL(15,2);
    current_ytd DECIMAL(15,2);
    previous_ytd DECIMAL(15,2);
    increment DECIMAL(5,2);
    ytd_increment DECIMAL(5,2);
    current_month INTEGER;
BEGIN
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Get current year total
    SELECT COALESCE(SUM(r.amount), 0) INTO current_total
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.year = target_year;
    
    -- Get previous year total
    SELECT COALESCE(SUM(r.amount), 0) INTO previous_total
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.year = target_year - 1;
    
    -- Get current year YTD (up to current month)
    SELECT COALESCE(SUM(r.amount), 0) INTO current_ytd
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.year = target_year
    AND r.month <= current_month;
    
    -- Get previous year YTD (up to current month)
    SELECT COALESCE(SUM(r.amount), 0) INTO previous_ytd
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.year = target_year - 1
    AND r.month <= current_month;
    
    -- Calculate increment percentage
    IF previous_total IS NOT NULL AND previous_total > 0 THEN
        increment := ((current_total - previous_total) / previous_total) * 100;
    ELSE
        increment := NULL;
    END IF;
    
    -- Calculate YTD increment percentage
    IF previous_ytd IS NOT NULL AND previous_ytd > 0 THEN
        ytd_increment := ((current_ytd - previous_ytd) / previous_ytd) * 100;
    ELSE
        ytd_increment := NULL;
    END IF;
    
    RETURN QUERY SELECT target_year, current_total, increment, ytd_increment;
END;
$$ LANGUAGE plpgsql;

-- Create function to get last month revenue for display
CREATE OR REPLACE FUNCTION get_last_month_revenue(company_uuid UUID)
RETURNS TABLE(
    month INTEGER,
    year INTEGER,
    amount DECIMAL(15,2),
    increment_percent DECIMAL(5,2),
    is_missing BOOLEAN
) AS $$
DECLARE
    last_month INTEGER;
    last_year INTEGER;
    current_amount DECIMAL(15,2);
    previous_amount DECIMAL(15,2);
    increment DECIMAL(5,2);
    missing BOOLEAN;
BEGIN
    -- Calculate last month
    last_month := EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month');
    last_year := EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month');
    
    -- Get last month amount
    SELECT r.amount INTO current_amount
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.month = last_month 
    AND r.year = last_year;
    
    -- Check if missing
    missing := (current_amount IS NULL);
    
    -- Get previous year same month amount
    SELECT r.amount INTO previous_amount
    FROM revenues r
    WHERE r.company_id = company_uuid 
    AND r.month = last_month 
    AND r.year = last_year - 1;
    
    -- Calculate increment percentage
    IF previous_amount IS NOT NULL AND previous_amount > 0 AND current_amount IS NOT NULL THEN
        increment := ((current_amount - previous_amount) / previous_amount) * 100;
    ELSE
        increment := NULL;
    END IF;
    
    RETURN QUERY SELECT last_month, last_year, current_amount, increment, missing;
END;
$$ LANGUAGE plpgsql;

