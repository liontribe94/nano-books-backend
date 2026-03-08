-- 1. Fix invoice_items column discrepancy
-- The code expects 'product_id' (snake_case)
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_price NUMERIC(12, 2) DEFAULT 0.00;

-- 2. Create missing journal_entries table
-- The LedgerService expects this table for headers
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ensure permissions are correct
GRANT ALL ON TABLE public.invoice_items TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.journal_entries TO postgres, anon, authenticated, service_role;
