-- Where clients can book a studio's classes: the studio's own app or site,
-- Mindbody, ClassPass, or another booking page. Entered once per studio and
-- shared by every instructor who teaches there.
--
-- Run in the Supabase SQL Editor after 0001_initial.sql.

create table public.studio_booking_links (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references public.studios (id) on delete cascade,
  platform    text not null check (platform in ('studio', 'mindbody', 'classpass', 'other')),
  url         text not null check (url ~* '^https://'),
  label       text check (char_length(label) <= 60),   -- e.g. "Lumen app"
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (studio_id, platform)
);
create index studio_booking_links_studio on public.studio_booking_links (studio_id);

alter table public.studio_booking_links enable row level security;

-- Anyone can see where to book.
create policy "booking links are public" on public.studio_booking_links
  for select using (true);

-- Instructors add links for studios; whoever added a link can fix or remove it.
create policy "instructors add booking links" on public.studio_booking_links
  for insert with check (created_by = auth.uid() and public.is_instructor(auth.uid()));
create policy "creator updates booking link" on public.studio_booking_links
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "creator deletes booking link" on public.studio_booking_links
  for delete using (created_by = auth.uid());

-- classes.booking_url (from 0001) stays as an optional link to one exact class,
-- shown first in the app when an instructor provides it.
comment on column public.classes.booking_url is 'Optional deep link to this exact class. Studio-wide links live in studio_booking_links.';
