-- SBV Portfolio secure content model.
-- Run this in Supabase SQL Editor. It never contains a password or service-role key.

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'sanjay')),
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_content (
  id text primary key check (id = 'main'),
  content jsonb not null,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.portfolio_admins enable row level security;
alter table public.portfolio_content enable row level security;

create or replace function public.is_portfolio_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.portfolio_admins where user_id = auth.uid()); $$;

create or replace function public.is_portfolio_owner()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.portfolio_admins where user_id = auth.uid() and role = 'owner'); $$;

revoke all on function public.is_portfolio_admin() from public;
revoke all on function public.is_portfolio_owner() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;
grant execute on function public.is_portfolio_owner() to authenticated;

drop policy if exists "admins read own role" on public.portfolio_admins;
create policy "admins read own role" on public.portfolio_admins for select to authenticated using (user_id = auth.uid());

drop policy if exists "public reads published content" on public.portfolio_content;
create policy "public reads published content" on public.portfolio_content for select to anon, authenticated using (published = true or public.is_portfolio_admin());

drop policy if exists "admins update content" on public.portfolio_content;
create policy "admins update content" on public.portfolio_content for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

drop policy if exists "admins insert content" on public.portfolio_content;
create policy "admins insert content" on public.portfolio_content for insert to authenticated with check (public.is_portfolio_admin());

grant select on public.portfolio_content to anon, authenticated;
grant select, insert, update on public.portfolio_content to authenticated;
grant select on public.portfolio_admins to authenticated;
