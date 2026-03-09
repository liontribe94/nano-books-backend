-- Multi-tenant foundation migration
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid,
  plan text not null default 'free' check (plan in ('free','pro','enterprise')),
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists organization_id uuid;

update public.users
set organization_id = company_id
where organization_id is null and company_id is not null;

create index if not exists users_organization_id_idx on public.users(organization_id);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('admin','accountant','viewer')),
  token_hash text not null,
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz
);

create unique index if not exists invitations_pending_unique
on public.invitations (organization_id, email)
where status = 'pending';

-- All tenant business tables should have organization_id for strict tenancy
alter table public.invoices add column if not exists organization_id uuid;
alter table public.expenses add column if not exists organization_id uuid;
alter table public.customers add column if not exists organization_id uuid;
alter table public.products add column if not exists organization_id uuid;

update public.invoices set organization_id = company_id where organization_id is null and company_id is not null;
update public.expenses set organization_id = company_id where organization_id is null and company_id is not null;
update public.customers set organization_id = company_id where organization_id is null and company_id is not null;
update public.products set organization_id = company_id where organization_id is null and company_id is not null;

create index if not exists invoices_org_idx on public.invoices(organization_id);
create index if not exists expenses_org_idx on public.expenses(organization_id);
create index if not exists customers_org_idx on public.customers(organization_id);
create index if not exists products_org_idx on public.products(organization_id);

-- Optional baseline RLS (requires using auth-aware client for full effect)
alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.invitations enable row level security;

alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;

drop policy if exists users_same_org_select on public.users;
create policy users_same_org_select on public.users
for select
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.organization_id = users.organization_id
  )
);

drop policy if exists invitations_same_org_select on public.invitations;
create policy invitations_same_org_select on public.invitations
for select
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.organization_id = invitations.organization_id
  )
);
