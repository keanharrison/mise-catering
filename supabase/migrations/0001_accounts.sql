-- Mise accounts: customers self-register, staff are invite-only, restaurants can request a demo.
-- Run in the Supabase SQL editor (or `supabase db push`). Safe to read top to bottom.

create type public.app_role as enum ('customer', 'owner', 'manager', 'staff');

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand jsonb not null default '{}'::jsonb, -- colors, logo, images for the restaurant-branded customer site
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  restaurant_id uuid references public.restaurants (id),
  created_at timestamptz not null default now(),
  constraint staff_needs_restaurant check (role = 'customer' or restaurant_id is not null)
);

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  email text not null,
  role public.app_role not null check (role <> 'customer'),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (restaurant_id, email)
);

create table public.demo_inquiries (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null check (char_length(restaurant_name) between 1 and 200),
  contact_name text not null check (char_length(contact_name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  phone text not null default '' check (char_length(phone) <= 40),
  message text not null default '' check (char_length(message) <= 4000),
  created_at timestamptz not null default now()
);

-- Helpers read the caller's own profile without tripping row-level security.
create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create function public.current_restaurant() returns uuid
language sql stable security definer set search_path = public as
$$ select restaurant_id from public.profiles where id = auth.uid() $$;

-- Every new auth user gets a profile. The role is NEVER read from client-supplied metadata:
-- it is 'customer' unless the user arrived through an admin invite (invited_at is set only by that flow)
-- AND a matching staff_invitations row exists.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$
declare
  v_role public.app_role := 'customer';
  v_restaurant uuid := null;
  v_invite uuid := null;
begin
  if new.invited_at is not null then
    select id, role, restaurant_id into v_invite, v_role, v_restaurant
    from public.staff_invitations
    where lower(email) = lower(new.email)
    order by created_at desc limit 1;
    if v_invite is null then v_role := 'customer'; v_restaurant := null; end if;
  end if;

  insert into public.profiles (id, role, full_name, phone, email, restaurant_id)
  values (
    new.id, v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.email, ''), v_restaurant
  );

  if v_invite is not null then delete from public.staff_invitations where id = v_invite; end if;
  return new;
end
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Row-level security
alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.demo_inquiries enable row level security;

-- Restaurant branding is public: customers see it before they sign in.
create policy "restaurants are public" on public.restaurants for select to anon, authenticated using (true);

create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Users may change only their contact details, never role or restaurant.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated, anon;

create policy "owners and managers manage invitations" on public.staff_invitations for all to authenticated
  using (restaurant_id = public.current_restaurant() and public.current_app_role() in ('owner', 'manager'))
  with check (restaurant_id = public.current_restaurant() and public.current_app_role() in ('owner', 'manager'));

-- Anyone may submit a demo request; nobody can read them through the API (read them in the dashboard).
create policy "anyone can request a demo" on public.demo_inquiries for insert to anon, authenticated with check (true);
revoke select, update, delete on public.demo_inquiries from anon, authenticated;

-- First restaurant, for the pilot.
insert into public.restaurants (slug, name) values ('pearl-island', 'Pearl Island');
