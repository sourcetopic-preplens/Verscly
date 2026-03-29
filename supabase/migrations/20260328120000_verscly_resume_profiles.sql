create table if not exists public.verscly_resume_profiles (
  client_id text primary key,
  resume_text text not null,
  updated_at timestamptz not null default now()
);

alter table public.verscly_resume_profiles enable row level security;

create policy "verscly_resume_select"
  on public.verscly_resume_profiles for select
  using (true);

create policy "verscly_resume_insert"
  on public.verscly_resume_profiles for insert
  with check (true);

create policy "verscly_resume_update"
  on public.verscly_resume_profiles for update
  using (true);
