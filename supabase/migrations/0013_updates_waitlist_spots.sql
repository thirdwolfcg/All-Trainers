-- Class updates, an in-app waitlist, and offering your spot to someone else.
--   * class_updates: the instructor (or sub) posts a note to a class. Clients
--     booked into it (class_bookings) can read it; the app also sends it to
--     each of them as a message.
--   * class_waitlist: clients waiting for a spot in a class. They hear first
--     when someone offers a spot. (A studio's own waitlist lives in its
--     booking system; this only covers spots offered on All Trainers.)
--   * spot_offers: a booked client offers their spot. Another client claims
--     it; the claim moves the booking in class_bookings. Moving the actual
--     reservation (name change at the studio, ClassPass or Mindbody) still
--     happens outside the app.
-- Run in the Supabase SQL Editor after 0012_birthday_consent.sql.

-- Who teaches a class (owner or confirmed sub).
create or replace function public.teaches_class(cls uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = cls and (instructor_id = uid or sub_instructor_id = uid));
$$;

create or replace function public.is_booked(cls uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_bookings where class_id = cls and client_id = uid);
$$;

-- Class updates -------------------------------------------------------------
create table public.class_updates (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes (id) on delete cascade,
  instructor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 500),
  created_at    timestamptz not null default now()
);
create index class_updates_class on public.class_updates (class_id, created_at desc);
alter table public.class_updates enable row level security;

create policy "instructor posts updates to own class" on public.class_updates for insert to authenticated
  with check (instructor_id = auth.uid() and public.teaches_class(class_id, auth.uid()));
create policy "instructor and booked clients read updates" on public.class_updates for select to authenticated
  using (public.teaches_class(class_id, auth.uid()) or public.is_booked(class_id, auth.uid()));
create policy "instructor removes own updates" on public.class_updates for delete to authenticated
  using (instructor_id = auth.uid());

-- Waitlist ------------------------------------------------------------------
create table public.class_waitlist (
  client_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, class_id)
);
create index class_waitlist_class on public.class_waitlist (class_id, created_at);
alter table public.class_waitlist enable row level security;

create policy "clients join waitlists" on public.class_waitlist for insert to authenticated
  with check (client_id = auth.uid() and not public.is_instructor(auth.uid()));
create policy "clients and the instructor see the waitlist" on public.class_waitlist for select to authenticated
  using (client_id = auth.uid() or public.teaches_class(class_id, auth.uid()));
create policy "clients leave waitlists" on public.class_waitlist for delete to authenticated
  using (client_id = auth.uid());

-- Spot offers ---------------------------------------------------------------
create table public.spot_offers (
  id             uuid primary key default gen_random_uuid(),
  class_id       uuid not null references public.classes (id) on delete cascade,
  from_client_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status         text not null default 'open' check (status in ('open', 'claimed', 'cancelled')),
  claimed_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  claimed_at     timestamptz
);
create index spot_offers_class on public.spot_offers (class_id) where status = 'open';
create unique index spot_offers_one_open on public.spot_offers (class_id, from_client_id) where status = 'open';
alter table public.spot_offers enable row level security;

-- Only someone booked into the class can offer a spot.
create policy "booked clients offer their spot" on public.spot_offers for insert to authenticated
  with check (from_client_id = auth.uid() and status = 'open' and public.is_booked(class_id, auth.uid()));
-- Open offers are visible to clients who follow the instructor or wait for the class;
-- the giver, the claimer and the instructor always see theirs.
create policy "see relevant spot offers" on public.spot_offers for select to authenticated
  using (
    from_client_id = auth.uid()
    or claimed_by = auth.uid()
    or public.teaches_class(class_id, auth.uid())
    or (
      status = 'open'
      and (
        exists (select 1 from public.class_waitlist w where w.class_id = spot_offers.class_id and w.client_id = auth.uid())
        or exists (
          select 1 from public.classes c join public.follows f on f.instructor_id = c.instructor_id
          where c.id = spot_offers.class_id and f.client_id = auth.uid()
        )
      )
    )
  );
-- The giver can cancel; another client can claim an open offer.
create policy "giver cancels, others claim" on public.spot_offers for update to authenticated
  using (from_client_id = auth.uid() or (status = 'open' and from_client_id <> auth.uid() and not public.is_instructor(auth.uid())))
  with check (
    (from_client_id = auth.uid() and status in ('open', 'cancelled') and claimed_by is null)
    or (status = 'claimed' and claimed_by = auth.uid())
  );

-- Keep bookings in step with offers, and stop edits once an offer is settled.
create or replace function public.on_spot_offer_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- Offering your spot takes it off your schedule.
    delete from class_bookings where class_id = new.class_id and client_id = new.from_client_id;
    return new;
  end if;

  if old.status <> 'open' then
    raise exception 'This spot was already claimed or taken back.';
  end if;
  if new.class_id <> old.class_id or new.from_client_id <> old.from_client_id then
    raise exception 'Only the status of an offer can change.';
  end if;

  if new.status = 'claimed' then
    if new.claimed_by is null or new.claimed_by = old.from_client_id then
      raise exception 'Someone else has to claim the spot.';
    end if;
    new.claimed_at := now();
    insert into class_bookings (client_id, class_id) values (new.claimed_by, new.class_id) on conflict do nothing;
    delete from class_waitlist where class_id = new.class_id and client_id = new.claimed_by;
  elsif new.status = 'cancelled' then
    -- Taking it back puts the class back on the giver's schedule.
    insert into class_bookings (client_id, class_id) values (old.from_client_id, old.class_id) on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger spot_offer_change
  before insert or update on public.spot_offers
  for each row execute function public.on_spot_offer_change();
