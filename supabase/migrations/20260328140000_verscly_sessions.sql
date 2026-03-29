create table if not exists public.verscly_sessions (
  id uuid primary key,
  client_id text not null,
  position_name text,
  jd_text text,
  resume_text text,
  analysis_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists verscly_sessions_client_id_idx on public.verscly_sessions (client_id);

alter table public.verscly_sessions enable row level security;

create policy "verscly_sessions_select"
  on public.verscly_sessions for select
  using (true);

create policy "verscly_sessions_insert"
  on public.verscly_sessions for insert
  with check (true);

create policy "verscly_sessions_update"
  on public.verscly_sessions for update
  using (true);
