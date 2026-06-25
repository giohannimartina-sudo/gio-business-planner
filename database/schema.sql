create table if not exists planner_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table planner_data enable row level security;
drop policy if exists "read own planner data" on planner_data;
create policy "read own planner data" on planner_data for select to authenticated using (auth.uid() = user_id);
drop policy if exists "insert own planner data" on planner_data;
create policy "insert own planner data" on planner_data for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "update own planner data" on planner_data;
create policy "update own planner data" on planner_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
