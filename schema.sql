-- Habilitar a extensão UUID se ainda não estiver habilitada
create extension if not exists "uuid-ossp";

-- Enum para roles (opcional, mas bom para integridade)
-- create type user_role as enum ('SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER');

-- Tabela: profiles (Extensão da tabela auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  name text,
  email text,
  role text default 'POOL_MEMBER' check (role in ('SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER')),
  whatsapp text,
  cpf text,
  "pixKey" text
);

-- Trigger para criar perfil automaticamente após signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'POOL_MEMBER'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Tabela: participants (Mantida para vincular pessoas aos bolões, pode ser linkada a profiles futuramente se necessário)
-- Por enquanto, participants são entidades dentro dos grupos, podendo ou não ter login.
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text,
  phone text,
  cpf text,
  "pixKey" text,
  "luckyNumber" integer,
  "profileId" uuid references public.profiles(id) -- Opcional: Link se o participante for um usuário do sistema
);

-- Tabela: groups
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  "ownerId" uuid references public.profiles(id), -- Quem criou/paga (POOL_ADMIN)
  name text not null,
  balance numeric default 0,
  "pixKey" text,
  "notifActive" boolean default true,
  participants jsonb default '[]'::jsonb -- Lista de {participantId, luckyNumber}
);

-- Tabela: pools
create table public.pools (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  "groupId" uuid references public.groups(id),
  name text not null,
  type text not null, -- MEGA_SENA, LOTOFACIL, etc
  "drawNumber" text,
  "drawDate" text,
  "paymentDeadline" text,
  "totalPrize" numeric default 0,
  status text default 'OPEN', -- OPEN, CLOSED, FINISHED
  "budgetUsed" numeric default 0,
  participants jsonb default '[]'::jsonb, -- Lista de {participantId, shares, paid, paymentDate}
  tickets jsonb default '[]'::jsonb -- Lista de tickets completos
);

-- Políticas de segurança (RLS)

alter table public.profiles enable row level security;
alter table public.participants enable row level security;
alter table public.groups enable row level security;
alter table public.pools enable row level security;

-- PROFILES
-- Usuários veem seu próprio perfil
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
-- Usuários atualizam seu próprio perfil
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
-- SAAS_ADMIN vê todos
create policy "Admins view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'SAAS_ADMIN')
);

-- GROUPS
-- SAAS_ADMIN vê tudo
create policy "SAAS_ADMIN view all groups" on public.groups for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'SAAS_ADMIN')
);
-- POOL_ADMIN vê seus grupos
create policy "POOL_ADMIN view own groups" on public.groups for all using (
  "ownerId" = auth.uid()
);
-- POOL_MEMBER vê grupos onde participa (Complexo com JSONB, simplificação: se tiver acesso ao ID)
-- Na prática, POOL_MEMBER só deve ver grupos onde ele está na lista de participantes.
-- Como participants é JSONB, podemos checar se o ID do profile do usuário está lá (se houver link) ou permitir leitura pública autenticada e filtrar no front
create policy "Authenticated view groups" on public.groups for select using (auth.role() = 'authenticated');

-- POOLS
create policy "Authenticated view pools" on public.pools for select using (auth.role() = 'authenticated');
create policy "POOL_ADMIN manage pools" on public.pools for all using (
  exists (
    select 1 from public.groups 
    where groups.id = pools."groupId" 
    and groups."ownerId" = auth.uid()
  )
);
create policy "SAAS_ADMIN manage pools" on public.pools for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'SAAS_ADMIN')
);
