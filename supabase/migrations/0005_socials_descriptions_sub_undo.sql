-- Instructor social links, class descriptions, and taking back a "can't" on a sub ask.
--
-- Run in the Supabase SQL Editor after 0004_lock_message_edits.sql.

-- Social handles, stored without the @. Letters, numbers, dots, underscores.
alter table public.profiles
  add column instagram_handle text check (instagram_handle ~ '^[A-Za-z0-9_.]{1,30}$'),
  add column tiktok_handle    text check (tiktok_handle    ~ '^[A-Za-z0-9_.]{2,24}$');

-- What the class is about: vibe, level, what to bring.
alter table public.classes
  add column description text check (char_length(description) <= 1000);

-- The person asked can now also change a "declined" back to "pending" (undo)
-- or straight to "accepted" (changed their mind), while the class still needs
-- a sub. The trigger below checks that the class still needs covering.
drop policy "asked person responds" on public.sub_requests;
create policy "asked person responds" on public.sub_requests for update
  using (to_instructor_id = auth.uid() and status in ('pending', 'declined'))
  with check (to_instructor_id = auth.uid() and status in ('pending', 'accepted', 'declined'));

create or replace function public.on_sub_request_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update classes set status = 'sub_needed'
      where id = new.class_id and status = 'scheduled';
    return new;
  end if;

  -- Who is asking and for which class never changes,
  -- and only the person asked can say yes, no, or take back a no.
  if new.class_id <> old.class_id
     or new.from_instructor_id <> old.from_instructor_id
     or new.to_instructor_id <> old.to_instructor_id then
    raise exception 'A sub request cannot be moved to another class or person.';
  end if;
  if auth.uid() is not null and auth.uid() <> new.to_instructor_id
     and (new.status in ('accepted', 'declined') or (old.status = 'declined' and new.status = 'pending')) then
    raise exception 'Only the instructor who was asked can respond.';
  end if;

  -- Undoing a no, or saying yes after a no, only works while the class still needs a sub.
  if old.status = 'declined' and new.status in ('pending', 'accepted') then
    if not exists (select 1 from classes where id = new.class_id and status = 'sub_needed') then
      raise exception 'This class no longer needs a sub.';
    end if;
  end if;

  if new.status <> old.status then
    new.responded_at := case when new.status = 'pending' then null else now() end;
  end if;

  if new.status = 'accepted' and old.status in ('pending', 'declined') then
    if not exists (
      select 1 from classes c
      where c.id = new.class_id and c.status in ('scheduled', 'sub_needed')
        and teaches_at(new.to_instructor_id, c.studio_id)
    ) then
      raise exception 'This class no longer needs a sub.';
    end if;
    update classes
      set status = 'subbed', sub_instructor_id = new.to_instructor_id, note = null
      where id = new.class_id;
    update sub_requests
      set status = 'cancelled', responded_at = now()
      where class_id = new.class_id and id <> new.id and status = 'pending';
  end if;
  return new;
end;
$$;
