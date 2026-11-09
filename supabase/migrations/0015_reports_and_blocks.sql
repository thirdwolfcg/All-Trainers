-- Report and block, which Apple (guideline 1.2) and Google Play require for
-- apps where people post and message each other.
--
-- Reports: anyone signed in can report a post, a profile, a message or a
-- class. Only the person who reported it can see their report; Zomi reviews
-- them in the Supabase dashboard (see the open_reports view below), within
-- 24 hours as the Terms promise.
--
-- Blocks: blocking someone is private (they're never told and can't see it).
-- Once either person has blocked the other, neither can message the other or
-- start a conversation, the blocked person can't follow, and any follow
-- between them is removed. The app also hides the blocked person's posts,
-- classes and profile from the person who blocked them.
--
-- Run in the Supabase SQL Editor after 0014.

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type     text not null check (target_type in ('post', 'profile', 'message', 'class')),
  target_id       uuid not null,
  -- The person the report is about, when there is one (the post's author, the message's sender...).
  target_user_id  uuid references public.profiles (id) on delete set null,
  reason          text not null check (reason in ('spam', 'harassment', 'inappropriate', 'impersonation', 'safety', 'other')),
  details         text check (char_length(details) <= 1000),
  status          text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  unique (reporter_id, target_type, target_id)
);
create index if not exists reports_open on public.reports (created_at) where status = 'open';

alter table public.reports enable row level security;

drop policy if exists "see own reports" on public.reports;
create policy "see own reports" on public.reports for select using (reporter_id = auth.uid());

drop policy if exists "file a report" on public.reports;
create policy "file a report" on public.reports for insert
  with check (reporter_id = auth.uid() and status = 'open' and reviewed_at is null and (target_user_id is null or target_user_id <> auth.uid()));
-- No update or delete for users: once sent, a report is Zomi's to review.

create table if not exists public.blocks (
  blocker_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked on public.blocks (blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "see who I blocked" on public.blocks;
create policy "see who I blocked" on public.blocks for select using (blocker_id = auth.uid());
drop policy if exists "block someone" on public.blocks;
create policy "block someone" on public.blocks for insert with check (blocker_id = auth.uid());
drop policy if exists "unblock someone" on public.blocks;
create policy "unblock someone" on public.blocks for delete using (blocker_id = auth.uid());

-- True if either person has blocked the other. Security definer so it can see
-- blocks made by the other person without revealing them.
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;
revoke all on function public.is_blocked_between(uuid, uuid) from public;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- Restrictive policies add a rule on top of the existing ones.
drop policy if exists "no messages across a block" on public.messages;
create policy "no messages across a block" on public.messages as restrictive for insert
  with check (
    not exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.is_blocked_between(c.instructor_id, c.client_id)
    )
  );

drop policy if exists "no conversations across a block" on public.conversations;
create policy "no conversations across a block" on public.conversations as restrictive for insert
  with check (not public.is_blocked_between(instructor_id, client_id));

drop policy if exists "no follows across a block" on public.follows;
create policy "no follows across a block" on public.follows as restrictive for insert
  with check (not public.is_blocked_between(client_id, instructor_id));

-- Blocking removes any follow between the two people, in either direction.
create or replace function public.drop_follows_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where (client_id = new.blocker_id and instructor_id = new.blocked_id)
     or (client_id = new.blocked_id and instructor_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists blocks_drop_follows on public.blocks;
create trigger blocks_drop_follows after insert on public.blocks
  for each row execute function public.drop_follows_on_block();

-- For Zomi's own review in the dashboard: open reports with who and what.
-- Not exposed to the app (no grants to anon or authenticated).
create or replace view public.open_reports with (security_invoker = true) as
  select r.id, r.created_at, r.reason, r.details, r.target_type, r.target_id,
         reporter.display_name as reporter, target.display_name as about
  from public.reports r
  left join public.profiles reporter on reporter.id = r.reporter_id
  left join public.profiles target on target.id = r.target_user_id
  where r.status = 'open'
  order by r.created_at;
revoke all on public.open_reports from anon, authenticated;
