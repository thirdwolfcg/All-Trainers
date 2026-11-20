-- Stories: short posts from instructors that disappear after 24 hours, like
-- Instagram stories. A story is a photo (stored in the post-photos bucket,
-- in the instructor's own folder) or a line of text on a brand color, and can
-- point at one of the instructor's own classes so viewers can jump to it.
--
-- Anyone can see a story until it expires. Only instructors post them, only
-- the owner can delete one. Viewers mark stories as seen (for the rings in the
-- app); the instructor can see who viewed their own stories, like Instagram.
--
-- Run in the Supabase SQL Editor after 0015.

create table if not exists public.stories (
  id             uuid primary key default gen_random_uuid(),
  instructor_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  media_path     text,
  body           text check (char_length(body) <= 200),
  background     text not null default 'plum' check (background in ('plum', 'lilac', 'ink', 'blush', 'mint')),
  class_id       uuid references public.classes (id) on delete set null,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '24 hours',
  check (media_path is not null or body is not null),
  check (media_path is null or media_path like instructor_id::text || '/%'),
  check (expires_at > created_at and expires_at <= created_at + interval '24 hours 5 minutes')
);
create index if not exists stories_live on public.stories (instructor_id, expires_at);

alter table public.stories enable row level security;

drop policy if exists "stories are public until they expire" on public.stories;
create policy "stories are public until they expire" on public.stories for select
  using (expires_at > now() or instructor_id = auth.uid());

drop policy if exists "instructors post their own stories" on public.stories;
create policy "instructors post their own stories" on public.stories for insert
  with check (
    instructor_id = auth.uid()
    and public.is_instructor(auth.uid())
    and created_at > now() - interval '5 minutes'
    and created_at < now() + interval '5 minutes'
    and (class_id is null or exists (select 1 from public.classes c where c.id = class_id and c.instructor_id = auth.uid()))
  );

drop policy if exists "instructors delete their own stories" on public.stories;
create policy "instructors delete their own stories" on public.stories for delete
  using (instructor_id = auth.uid());

create table if not exists public.story_views (
  story_id   uuid not null references public.stories (id) on delete cascade,
  viewer_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.story_views enable row level security;

drop policy if exists "mark a story seen" on public.story_views;
create policy "mark a story seen" on public.story_views for insert
  with check (
    viewer_id = auth.uid()
    and exists (select 1 from public.stories s where s.id = story_id and s.expires_at > now() and s.instructor_id <> auth.uid())
  );

drop policy if exists "see my views and views of my stories" on public.story_views;
create policy "see my views and views of my stories" on public.story_views for select
  using (
    viewer_id = auth.uid()
    or exists (select 1 from public.stories s where s.id = story_id and s.instructor_id = auth.uid())
  );

-- Clean up: expired stories are hidden by the rule above but stay in the table.
-- To remove them (and their views) after a week, schedule this daily with
-- pg_cron or a Supabase scheduled Edge Function:
--   delete from public.stories where expires_at < now() - interval '7 days';
-- Photo files for deleted stories stay in storage until removed separately.

-- Stories can be reported too.
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
  check (target_type in ('post', 'profile', 'message', 'class', 'story'));
