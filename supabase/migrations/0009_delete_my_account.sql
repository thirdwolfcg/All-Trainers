-- Lets a signed-in person delete their own account from inside the app
-- (Apple requires this, and the Privacy Policy promises it).
-- Deleting the auth user cascades to their profile and everything tied to it:
-- birthday, follows, attendance, notes, messages, posts, classes, sub requests.
-- Run in the Supabase SQL Editor after 0008_lock_profile_role.sql.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
