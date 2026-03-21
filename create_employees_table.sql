-- Create employees table for Nano Books
-- Execute this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    department TEXT,
    salary NUMERIC(15, 2) NOT NULL DEFAULT 0,
    hire_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),
    bank_code TEXT,
    account_number TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_deleted ON public.employees(is_deleted);

-- Grant permissions (matching project pattern)
GRANT ALL ON TABLE public.employees TO postgres, anon, authenticated, service_role;

-- Optional: Enable Row Level Security (RLS)
-- ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Basic policy example (requires company_id in auth.jwt())
-- CREATE POLICY "Users can only view employees in their company" ON public.employees
--     FOR SELECT USING (auth.jwt() ->> 'company_id' = company_id::text);
