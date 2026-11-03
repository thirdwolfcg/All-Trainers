-- Fix: "update own profile" let anyone change their own role (a client could
-- make themselves an instructor). Role is set once, at sign up.
-- Run in the Supabase SQL Editor after 0007_video_posts.sql.

create or replace function public.profiles_lock_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Role can''t be changed. Make a new account instead.';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Profile id can''t be changed.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_role on public.profiles;
create trigger profiles_lock_role
  before update on public.profiles
  for each row execute function public.profiles_lock_role();
