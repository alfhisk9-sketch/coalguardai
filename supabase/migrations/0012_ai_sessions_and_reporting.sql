-- 0012_ai_sessions_and_reporting.sql
-- CoalGuard AI: AI Sessions, Messages & Extended Mine Metadata

-- 1. Extend mines table with operational metadata
alter table mines add column if not exists operator text default 'Coal India Limited';
alter table mines add column if not exists state text default 'Chhattisgarh';
alter table mines add column if not exists district text default 'Korba';
alter table mines add column if not exists target_production numeric default 50000;
alter table mines add column if not exists actual_production numeric default 47500;
alter table mines add column if not exists worker_count integer default 150;
alter table mines add column if not exists compliance_score numeric default 85;
alter table mines add column if not exists risk_band text default 'LOW';
alter table mines add column if not exists environmental_status text default 'NORMAL';
alter table mines add column if not exists last_inspection date;
alter table mines add column if not exists is_demo boolean not null default true;

-- 2. Create AI Sessions table
create table if not exists ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  mine_id uuid references mines(id),
  title text not null default 'New Safety Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_sessions_user on ai_sessions(user_id);
create index if not exists idx_ai_sessions_mine on ai_sessions(mine_id);

-- 3. Create AI Messages table
create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references ai_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  context_sources jsonb not null default '[]'::jsonb,
  is_grounded boolean not null default false,
  model_version text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_messages_session on ai_messages(session_id);

-- 4. Enable Row Level Security (RLS)
alter table ai_sessions enable row level security;
alter table ai_messages enable row level security;

-- Policies for ai_sessions
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'ai_sessions_select_owner') then
    create policy ai_sessions_select_owner on ai_sessions
      for select using (auth.uid() = user_id or fn_user_has_permission('ai.view'));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ai_sessions_insert_owner') then
    create policy ai_sessions_insert_owner on ai_sessions
      for insert with check (auth.uid() = user_id or auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ai_sessions_delete_owner') then
    create policy ai_sessions_delete_owner on ai_sessions
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Policies for ai_messages
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'ai_messages_select_session_owner') then
    create policy ai_messages_select_session_owner on ai_messages
      for select using (
        exists (
          select 1 from ai_sessions s
          where s.id = ai_messages.session_id
            and (s.user_id = auth.uid() or fn_user_has_permission('ai.view'))
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ai_messages_insert_session_owner') then
    create policy ai_messages_insert_session_owner on ai_messages
      for insert with check (
        exists (
          select 1 from ai_sessions s
          where s.id = session_id and (s.user_id = auth.uid() or auth.uid() is not null)
        )
      );
  end if;
end $$;
