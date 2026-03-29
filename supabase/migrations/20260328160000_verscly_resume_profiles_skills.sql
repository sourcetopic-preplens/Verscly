alter table public.verscly_resume_profiles
  add column if not exists display_name text,
  add column if not exists skills_json jsonb default '[]'::jsonb;

create policy "verscly_resume_delete"
  on public.verscly_resume_profiles for delete
  using (true);
