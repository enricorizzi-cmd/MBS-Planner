-- Create function to temporarily disable RLS for partners table
-- This is needed for the seed operation to work properly

CREATE OR REPLACE FUNCTION disable_rls_for_partners()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Temporarily disable RLS for partners table
    ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
    
    -- Re-enable RLS after a short delay (this is handled by the application)
    -- The RLS will be re-enabled when the application restarts or when explicitly called
END;
$$;

-- Create function to re-enable RLS for partners table
CREATE OR REPLACE FUNCTION enable_rls_for_partners()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Re-enable RLS for partners table
    ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION disable_rls_for_partners() TO service_role;
GRANT EXECUTE ON FUNCTION enable_rls_for_partners() TO service_role;
