-- Classes a client says they're booked into. Booking itself happens on the
-- studio's app, Mindbody or ClassPass; this is the client's own note so the
-- class shows in "Your week". The class's instructor can see who's coming.
-- Run in the Supabase SQL Editor after 0009_delete_my_account.sql.

create table public.class_bookings (
  client_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, class_id)
);

create index class_bookings_class on public.class_bookings (class_id);

alter table public.class_bookings enable row level security;

create policy "clients see their bookings, instructors see who's coming" on public.class_bookings
  for select to authenticated
  using (
    client_id = auth.uid()
    or exists (
      select 1 from public.classes c
      where c.id = class_id and (c.instructor_id = auth.uid() or c.sub_instructor_id = auth.uid())
    )
  );

create policy "clients add their own bookings" on public.class_bookings
  for insert to authenticated
  with check (client_id = auth.uid() and not public.is_instructor(auth.uid()));

create policy "clients remove their own bookings" on public.class_bookings
  for delete to authenticated
  using (client_id = auth.uid());
