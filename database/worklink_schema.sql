-- GIO Werklink PRO TEST 001
-- Bestaande planner_data wordt NIET gewijzigd of verwijderd.
create extension if not exists pgcrypto;
create table if not exists work_links(id uuid primary key default gen_random_uuid(),token_hash text not null unique,employee_name text not null,employee_type text,employee_photo text,project_name text not null,customer_name text,work_address text,work_date date,planned_start time,planned_end time,assignment text,allow_km boolean not null default true,allow_note boolean not null default true,valid_until timestamptz not null,active boolean not null default true,status text not null default 'Niet gestart',clock_in timestamptz,clock_out timestamptz,pause_started timestamptz,pause_minutes integer not null default 0,kilometers numeric(10,2) not null default 0,trip_type text not null default 'retour',note text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists work_events(id bigint generated always as identity primary key,work_link_id uuid not null references work_links(id) on delete cascade,event_type text not null,event_data jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
alter table work_links enable row level security;alter table work_events enable row level security;
-- Geen publieke policies; toegang alleen via beveiligde serverroutes.
