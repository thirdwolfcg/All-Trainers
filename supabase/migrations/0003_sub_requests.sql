-- Sub requests: an instructor asks another instructor to cover a class.
-- Rule: you can only ask someone who teaches at the SAME studio. "Teaches at"
-- means they have a class on the schedule at that studio within the last
-- 90 days or coming up. The rule is enforced here, not just in the app.
--
-- Run in the Supabase SQL Editor after 0002_booking_links.sql.

alter table public.classes
  add column sub_instructor_id uuid references public.profiles (id) on delete set null;

create table public.sub_requests (
  id                 uuid primary key default gen_random_uuid(),
  class_id           uuid not null references public.classes (id) on delete cascade,
  from_instructor_id uuid not null references public.profiles (id) on delete cascade,
  to_instructor_id   uuid not null references public.profiles (id) on delete cascade,
  status             text not null default 'pending'
                       check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at         timestamptz not null default now(),
  responded_at       timestamptz,
  check (from_instructor_id <> to_instructor_id)
);
create index sub_requests_to on public.sub_requests (to_instructor_id, status);
create index sub_requests_class on public.sub_requests (class_id);
-- One open ask per person per class.
create unique index sub_requests_one_pending
  on public.sub_requests (class_id, to_instructor_id) where status = 'pending';

-- Does this instructor teach at this studio?
create or replace function public.teaches_at(instr uuid, studio uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from classes
    where instructor_id = instr and studio_id = studio
      and starts_at > now() - interval '90 days'
  );
$$;

-- May the signed-in instructor ask `target` to cover `cls`?
create or replace function public.can_request_sub(cls uuid, target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from classes c
    where c.id = cls
      and c.instructor_id = auth.uid()
      and c.status in ('scheduled', 'sub_needed')
      and c.starts_at > now()
      and target <> auth.uid()
      and is_instructor(target)
      and teaches_at(target, c.studio_id)
  );
$$;

alter table public.sub_requests enable row level security;

-- Only the two instructors involved can see a request.
create policy "see own sub requests" on public.sub_requests for select
  using (from_instructor_id = auth.uid() or to_instructor_id = auth.uid());

-- Ask: only for your own upcoming class, only someone from the same studio.
create policy "ask same-studio instructor" on public.sub_requests for insert
  with check (
    from_instructor_id = auth.uid()
    and status = 'pending'
    and can_request_sub(class_id, to_instructor_id)
  );

-- The asker can withdraw; the person asked can accept or decline.
-- Each WITH CHECK repeats who may make that change: Postgres ORs the checks of
-- all update policies together, so a check without the user in it would let
-- the asker accept their own request.
create policy "asker withdraws" on public.sub_requests for update
  using (from_instructor_id = auth.uid() and status = 'pending')
  with check (from_instructor_id = auth.uid() and status = 'cancelled');
create policy "asked person responds" on public.sub_requests for update
  using (to_instructor_id = auth.uid() and status = 'pending')
  with check (to_instructor_id = auth.uid() and status in ('accepted', 'declined'));

-- Asking marks the class as needing a sub. Accepting assigns the sub, marks
-- the class as subbed, and closes every other open ask for that class.
create or replace function public.on_sub_request_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update classes set status = 'sub_needed'
      where id = new.class_id and status = 'scheduled';
    return new;
  end if;

  -- Second line of defense: who is asking and for which class never changes,
  -- and only the person asked can say yes or no.
  if new.class_id <> old.class_id
     or new.from_instructor_id <> old.from_instructor_id
     or new.to_instructor_id <> old.to_instructor_id then
    raise exception 'A sub request cannot be moved to another class or person.';
  end if;
  if auth.uid() is not null and new.status in ('accepted', 'declined')
     and auth.uid() <> new.to_instructor_id then
    raise exception 'Only the instructor who was asked can respond.';
  end if;

  if new.status <> old.status then
    new.responded_at := now();
  end if;

  if new.status = 'accepted' and old.status = 'pending' then
    -- Make sure the class still needs covering and the rule still holds.
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

create trigger sub_requests_insert after insert on public.sub_requests
  for each row execute function public.on_sub_request_change();
create trigger sub_requests_update before update on public.sub_requests
  for each row execute function public.on_sub_request_change();
