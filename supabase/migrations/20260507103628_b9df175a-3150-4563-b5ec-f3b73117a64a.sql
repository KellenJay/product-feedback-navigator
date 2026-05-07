
-- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  business_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);
create index projects_user_created_idx on public.projects(user_id, created_at desc);
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

-- analysis_sessions
create table public.analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  product_name text not null,
  business_goal text,
  raw_feedback text,
  feedback_source text check (feedback_source in ('paste','upload','research')),
  analysis_output jsonb,
  market_context_output jsonb,
  model_version text,
  title text,
  saved boolean not null default false,
  folder_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.analysis_sessions enable row level security;
create policy "sessions_select_own" on public.analysis_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.analysis_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.analysis_sessions for update using (auth.uid() = user_id);
create policy "sessions_delete_own" on public.analysis_sessions for delete using (auth.uid() = user_id);
create index sessions_user_created_idx on public.analysis_sessions(user_id, created_at desc);
create trigger sessions_set_updated_at before update on public.analysis_sessions
for each row execute function public.set_updated_at();

-- roadmaps
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  analysis_session_id uuid references public.analysis_sessions(id) on delete set null,
  product_name text not null,
  roadmap_output jsonb,
  prd_output jsonb,
  roadmap_overrides jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.roadmaps enable row level security;
create policy "roadmaps_select_own" on public.roadmaps for select using (auth.uid() = user_id);
create policy "roadmaps_insert_own" on public.roadmaps for insert with check (auth.uid() = user_id);
create policy "roadmaps_update_own" on public.roadmaps for update using (auth.uid() = user_id);
create policy "roadmaps_delete_own" on public.roadmaps for delete using (auth.uid() = user_id);
create index roadmaps_user_created_idx on public.roadmaps(user_id, created_at desc);
create index roadmaps_session_idx on public.roadmaps(analysis_session_id);
create trigger roadmaps_set_updated_at before update on public.roadmaps
for each row execute function public.set_updated_at();

-- folders
create table public.library_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.library_folders enable row level security;
create policy "folders_select_own" on public.library_folders for select using (auth.uid() = user_id);
create policy "folders_insert_own" on public.library_folders for insert with check (auth.uid() = user_id);
create policy "folders_update_own" on public.library_folders for update using (auth.uid() = user_id);
create policy "folders_delete_own" on public.library_folders for delete using (auth.uid() = user_id);

-- eval_runs (schema only)
create table public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_session_id uuid references public.analysis_sessions(id) on delete cascade,
  categorization_score integer,
  prioritization_score integer,
  prd_completeness_score integer,
  actionability_score integer,
  total_score integer,
  grader_output jsonb,
  created_at timestamptz not null default now()
);
alter table public.eval_runs enable row level security;
create policy "evals_select_own" on public.eval_runs for select using (auth.uid() = user_id);
create policy "evals_insert_own" on public.eval_runs for insert with check (auth.uid() = user_id);
create policy "evals_update_own" on public.eval_runs for update using (auth.uid() = user_id);
create policy "evals_delete_own" on public.eval_runs for delete using (auth.uid() = user_id);

-- handle_new_user trigger to seed a profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
