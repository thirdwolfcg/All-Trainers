-- Birthdays are shared with instructors only when the client says yes.
-- share_birthday records that choice and birthday_shared_at when it was made.
-- instructor_client_list() returns a birthday only when it is shared.
-- Run in the Supabase SQL Editor after 0011_class_series_and_extras.sql.

alter table public.profile_private
  add column if not exists share_birthday     boolean not null default false,
  add column if not exists birthday_shared_at timestamptz;

-- Birthdays entered before this change were entered on a screen that said
-- "Only instructors you follow can see it", so they count as shared.
update public.profile_private
   set share_birthday = true, birthday_shared_at = coalesce(birthday_shared_at, updated_at)
 where birthday_month is not null and birthday_day is not null and share_birthday = false;

create or replace function public.instructor_client_list()
returns table (
  client_id       uuid,
  display_name    text,
  avatar_path     text,
  followed_at     timestamptz,
  birthday_month  smallint,
  birthday_day    smallint,
  classes_taken   bigint,
  last_attended   date,
  is_premium      boolean
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.display_name, p.avatar_path, f.created_at,
    case when pp.share_birthday then pp.birthday_month end,
    case when pp.share_birthday then pp.birthday_day end,
    count(a.id), max(a.attended_on),
    has_premium(auth.uid(), p.id)
  from follows f
  join profiles p on p.id = f.client_id
  left join profile_private pp on pp.user_id = p.id
  left join attendance a on a.client_id = p.id and a.instructor_id = f.instructor_id
  where f.instructor_id = auth.uid()
  group by p.id, p.display_name, p.avatar_path, f.created_at, pp.share_birthday, pp.birthday_month, pp.birthday_day;
$$;
