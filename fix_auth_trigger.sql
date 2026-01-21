-- Fix permissions and triggers - Version 2

-- 1. Ensure permissions on schema and tables
-- We remove "GRANT ALL ON ALL SEQUENCES" to avoid errors if no sequences exist
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;

-- 2. Ensure profiles.id is correct (UUID, no sequence)
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'profiles') then
    -- Remove any default value (like a sequence) from id, as it must be a UUID provided by auth
    alter table public.profiles alter column id drop default;
  end if;
end $$;

-- 3. Redefine handle_new_user with SEARCH_PATH set for security
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    coalesce(new.raw_user_meta_data->>'role', 'POOL_MEMBER')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise exception 'Failed to create profile: %', SQLERRM;
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Redefine link_profile_to_participant with SEARCH_PATH set
create or replace function public.link_profile_to_participant()
returns trigger as $$
begin
  begin
    update public.participants
    set "profileId" = new.id
    where email = new.email;
  exception when others then
    raise warning 'Error linking profile to participant: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 5. Re-attach triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists on_profile_created_link on public.profiles;
create trigger on_profile_created_link
  after insert on public.profiles
  for each row execute procedure public.link_profile_to_participant();
