-- 0007_contractors.sql
create type contractor_status as enum ('ACTIVE','SUSPENDED','TERMINATED');

create table contractors (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  company_name text not null,
  registration_no text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status contractor_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_contractors_mine on contractors(mine_id);

-- Now that contractors exists, wire the deferred FK from profiles (0003).
alter table profiles add constraint fk_profiles_contractor foreign key (contractor_id) references contractors(id);

create table contractor_contracts (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  start_date date not null,
  end_date date,
  scope text,
  value numeric
);

create table contractor_workers (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  full_name text not null,
  id_number text,
  role_title text
);
create index idx_contractor_workers_contractor on contractor_workers(contractor_id);

create table contractor_documents (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  document_id uuid, -- FK added in 0012
  doc_type text not null,
  expiry_date date
);

create trigger trg_contractors_updated before update on contractors for each row execute function fn_set_updated_at();
