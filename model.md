-- ==========================================
-- 1. DROP EXISTING TABLES
-- ==========================================

DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.ledger_transactions CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- Note: We are not dropping "users" and "companies" as they are tied to Supabase Auth.
-- but if you want to wipe everything, uncomment them.
-- DROP TABLE IF EXISTS public.companies CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ==========================================
-- 2. CREATE TRUE ACCURATE SCHEMA
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- Chart Of Accounts
-----------------------------------------
CREATE TABLE public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL, 
    name TEXT NOT NULL,
    type TEXT NOT NULL, 
    code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Bank Accounts
-----------------------------------------
CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    account_name TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    balance NUMERIC(12, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'NGN',
    created_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Vendors / Suppliers
-----------------------------------------
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Customers (Uses mixed case based on repos)
-----------------------------------------
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "companyId" UUID, -- Some older repos use camelCase, fallback to snake_case just in case
    company_id UUID,  -- customer.repository uses EQ company_id
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false, 
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Products / Inventory (Uses complete snake_case)
-----------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12, 2) DEFAULT 0.00,
    quantity_in_stock NUMERIC(10, 2) DEFAULT 0,
    reorder_level NUMERIC(10, 2) DEFAULT 5,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Inventory Movements
-----------------------------------------
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL, 
    quantity NUMERIC(10, 2) NOT NULL,
    reason TEXT, 
    reference_id TEXT, 
    user_id UUID NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Expenses
-----------------------------------------
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    vendor_id UUID,
    category_id UUID, -- Found in your new expense routes
    category TEXT, 
    amount NUMERIC(12, 2) NOT NULL,
    expense_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_method TEXT,
    description TEXT,
    user_id UUID NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Invoices (Older codebase, primarily camelCase columns expected)
-----------------------------------------
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "companyId" UUID NOT NULL,
    company_id UUID, -- The repository has a mix of them depending on if it's new or old
    "customerId" UUID NOT NULL,
    customer_id UUID,
    "invoiceNumber" TEXT,
    invoice_number TEXT,
    status TEXT DEFAULT 'draft', 
    "issueDate" TIMESTAMPTZ DEFAULT now(),
    "dueDate" TIMESTAMPTZ,
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    "taxTotal" NUMERIC(12, 2) DEFAULT 0.00,
    "totalAmount" NUMERIC(12, 2) DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Invoice Items (Older codebase, primarily camelCase)
-----------------------------------------
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "invoiceId" UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    invoice_id UUID, 
    "companyId" UUID NOT NULL,
    company_id UUID,
    "productId" UUID, 
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    rate NUMERIC(12, 2) NOT NULL,
    "taxPercentage" NUMERIC(5, 2) DEFAULT 0,
    amount NUMERIC(12, 2) NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- Settings
-----------------------------------------
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "companyId" UUID NOT NULL,
    company_id UUID,
    "currency" TEXT DEFAULT 'NGN',
    -- Add any other JSON blocks or fields your settingModel saves
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-----------------------------------------
-- Payments
-----------------------------------------
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    flw_transaction_id TEXT,
    flw_tx_ref TEXT UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    payment_method TEXT,
    status TEXT DEFAULT 'pending', 
    customer_email TEXT,
    customer_name TEXT,
    flw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- General Ledger Transactions
-----------------------------------------
CREATE TABLE public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
    debit NUMERIC(12, 2) DEFAULT 0.00,
    credit NUMERIC(12, 2) DEFAULT 0.00,
    reference_type TEXT, 
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. FIX PERMISSIONS (IMPORTANT)
-- ==========================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
