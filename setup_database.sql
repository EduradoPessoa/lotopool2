-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tables (Create if not exists)

-- Table: profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  name text,
  email text,
  role text default 'POOL_MEMBER' check (role in ('SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER')),
  whatsapp text,
  cpf text,
  "pixKey" text
);

-- Table: groups
create table if not exists public.groups (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  "ownerId" uuid references public.profiles(id),
  name text not null,
  balance numeric default 0,
  "pixKey" text,
  "notifActive" boolean default true,
  participants jsonb default '[]'::jsonb
);

-- Table: pools
create table if not exists public.pools (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  "groupId" uuid references public.groups(id),
  name text not null,
  type text not null,
  "drawNumber" text,
  "drawDate" text,
  "paymentDeadline" text,
  "totalPrize" numeric default 0,
  status text default 'OPEN',
  "budgetUsed" numeric default 0,
  participants jsonb default '[]'::jsonb,
  tickets jsonb default '[]'::jsonb
);

-- Table: participants
create table if not exists public.participants (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text,
  phone text,
  cpf text,
  "pixKey" text,
  "luckyNumber" integer,
  "profileId" uuid references public.profiles(id)
);

-- 2. Triggers for Automatic Profile Creation

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'POOL_MEMBER'))
  on conflict (id) do nothing; -- Prevent error if profile exists
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Triggers for Linking Participants <-> Profiles (link_users.sql content)

create or replace function public.link_participant_to_profile()
returns trigger as $$
begin
  update public.participants
  set "profileId" = (select id from public.profiles where email = new.email limit 1)
  where id = new.id
  and "profileId" is null;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_participant_email_change on public.participants;
create trigger on_participant_email_change
  after insert or update of email on public.participants
  for each row execute procedure public.link_participant_to_profile();

create or replace function public.link_profile_to_participant()
returns trigger as $$
begin
  update public.participants
  set "profileId" = new.id
  where email = new.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_link on public.profiles;
create trigger on_profile_created_link
  after insert on public.profiles
  for each row execute procedure public.link_profile_to_participant();

-- 4. RLS Policies (Drop and Recreate to be safe)

alter table public.profiles enable row level security;
alter table public.participants enable row level security;
alter table public.groups enable row level security;
alter table public.pools enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Authenticated view groups" on public.groups;
drop policy if exists "Authenticated view pools" on public.pools;

-- Create policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Authenticated view groups" on public.groups for select using (auth.role() = 'authenticated');
create policy "Authenticated view pools" on public.pools for select using (auth.role() = 'authenticated');
