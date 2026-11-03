-- Repeating classes, and extras attached to a class.
--   * class_series: one row per repeating class ("Reformer Flow, Mon and Wed
--     at 6pm, every week for 3 months"). The app creates the individual
--     classes rows and tags them with series_id, so one class in a series can
--     still be cancelled or subbed on its own.
--   * classes.playlist_url and classes.recipe_post_id: the class playlist and
--     one of the instructor's recipe posts.
-- Run in the Supabase SQL Editor after 0010_class_bookings.sql.

create table public.class_series (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  studio_id     uuid references public.studios (id) on delete set null,
  title         text not null check (char_length(title) between 1 and 120),
  repeat        text not null check (repeat in ('weekly', 'biweekly')),
  -- weekday (0 = Sunday) -> start time "HH:MM", e.g. {"1": "18:00", "3": "07:00"}
  schedule      jsonb not null,
  duration_min  smallint not null check (duration_min between 10 and 300),
  starts_on     date not null,
  ends_on       date,
  created_at    timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create index class_series_instructor on public.class_series (instructor_id);

alter table public.class_series enable row level security;

create policy "series are public" on public.class_series for select using (true);
create policy "instructor manages own series" on public.class_series for all to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid() and public.is_instructor(auth.uid()));

alter table public.classes
  add column if not exists series_id      uuid references public.class_series (id) on delete set null,
  add column if not exists playlist_url   text check (playlist_url is null or playlist_url ~* '^https://'),
  add column if not exists recipe_post_id uuid references public.posts (id) on delete set null;

create index if not exists classes_series on public.classes (series_id);
