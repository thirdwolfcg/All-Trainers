-- All Trainers, Phase 1 schema (Supabase / Postgres)
-- Run in the Supabase SQL editor or with `supabase db push`.
--
-- Privacy notes
--   * Birthdays are stored as month + day only (no year) and live in a private
--     table. Instructors see them only for their own followers, through
--     instructor_client_list().
--   * Instructor notes about a client (preferences, injuries) are visible to
--     that instructor only. Clients cannot read notes written about them.
--   * Paid access rows are written by the server (service role) only, never by
--     the app, so nobody can grant themselves premium.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          text not null check (role in ('client', 'instructor')),
  display_name  text not null check (char_length(display_name) between 1 and 80),
  handle        citext unique check (handle ~ '^[a-z0-9_\.]{3,30}$'),
  bio           text check (char_length(bio) <= 500),
  avatar_path   text,
  styles        text[] not null default '{}',     -- e.g. {pilates,yoga,cycle}
  neighborhood  text,
  created_at    timestamptz not null default now()
);

-- Private details only the owner can read directly.
create table public.profile_private (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  birthday_month  smallint check (birthday_month between 1 and 12),
  birthday_day    smallint check (birthday_day between 1 and 31),
  updated_at      timestamptz not null default now()
);

-- Instructor plan. Founding instructors are free until founding_until.
create table public.instructor_plans (
  instructor_id   uuid primary key references public.profiles (id) on delete cascade,
  plan            text not null default 'founding' check (plan in ('founding', 'standard')),
  founding_until  date,
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Studios and classes
-- ---------------------------------------------------------------------------
create table public.studios (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text,
  neighborhood  text,
  website_url   text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.classes (
  id             uuid primary key default gen_random_uuid(),
  instructor_id  uuid not null references public.profiles (id) on delete cascade,
  studio_id      uuid references public.studios (id) on delete set null,
  title          text not null,
  style          text,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  booking_url    text,                       -- link out to the studio's own booking
  status         text not null default 'scheduled'
                   check (status in ('scheduled', 'cancelled', 'sub_needed', 'subbed')),
  note           text,
  created_at     timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index classes_instructor_time on public.classes (instructor_id, starts_at);
create index classes_time on public.classes (starts_at);

-- ---------------------------------------------------------------------------
-- Follows (a follow puts the client on the instructor's client list)
-- ---------------------------------------------------------------------------
create table public.follows (
  client_id      uuid not null references public.profiles (id) on delete cascade,
  instructor_id  uuid not null references public.profiles (id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (client_id, instructor_id),
  check (client_id <> instructor_id)
);
create index follows_instructor on public.follows (instructor_id);

-- ---------------------------------------------------------------------------
-- Attendance (class tracker per instructor and per studio)
-- ---------------------------------------------------------------------------
create table public.attendance (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles (id) on delete cascade,
  instructor_id  uuid not null references public.profiles (id) on delete cascade,
  class_id       uuid references public.classes (id) on delete set null,
  studio_id      uuid references public.studios (id) on delete set null,
  kind           text not null default 'class' check (kind in ('class', 'private')),
  attended_on    date not null,
  source         text not null check (source in ('client', 'instructor')),
  created_at     timestamptz not null default now(),
  unique (client_id, class_id)
);
create index attendance_client on public.attendance (client_id);
create index attendance_instructor on public.attendance (instructor_id);

-- ---------------------------------------------------------------------------
-- Instructor notes about clients (private to the instructor)
-- ---------------------------------------------------------------------------
create table public.client_notes (
  instructor_id  uuid not null references public.profiles (id) on delete cascade,
  client_id      uuid not null references public.profiles (id) on delete cascade,
  preferences    text check (char_length(preferences) <= 2000),
  notes          text check (char_length(notes) <= 4000),
  updated_at     timestamptz not null default now(),
  primary key (instructor_id, client_id)
);

-- ---------------------------------------------------------------------------
-- Direct messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  instructor_id    uuid not null references public.profiles (id) on delete cascade,
  client_id        uuid not null references public.profiles (id) on delete cascade,
  last_message_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (instructor_id, client_id)
);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 4000),
  created_at       timestamptz not null default now(),
  read_at          timestamptz
);
create index messages_conversation_time on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Feed posts (photos, recipes, playlist links, notes). Premium posts are
-- visible only to the instructor and their active premium subscribers.
-- ---------------------------------------------------------------------------
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  instructor_id  uuid not null references public.profiles (id) on delete cascade,
  kind           text not null check (kind in ('photo', 'recipe', 'playlist', 'note')),
  body           text check (char_length(body) <= 4000),
  media_path     text,
  link_url       text,
  is_premium     boolean not null default false,
  created_at     timestamptz not null default now()
);
create index posts_instructor_time on public.posts (instructor_id, created_at desc);

-- Written by the server from App Store / Google Play / Stripe webhooks only.
create table public.premium_subscriptions (
  client_id           uuid not null references public.profiles (id) on delete cascade,
  instructor_id       uuid not null references public.profiles (id) on delete cascade,
  status              text not null check (status in ('active', 'past_due', 'canceled')),
  provider            text not null check (provider in ('apple', 'google', 'stripe')),
  current_period_end  timestamptz,
  updated_at          timestamptz not null default now(),
  primary key (client_id, instructor_id)
);

-- Push notification tokens (Expo push)
create table public.push_tokens (
  token       text primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  platform    text check (platform in ('ios', 'android', 'web')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.is_instructor(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = uid and role = 'instructor');
$$;

create or replace function public.is_follower(instr uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from follows where instructor_id = instr and client_id = uid);
$$;

create or replace function public.has_premium(instr uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from premium_subscriptions
    where instructor_id = instr and client_id = uid and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;

-- The instructor's client list: followers, their birthday (month/day),
-- class counts and last visit. Only callable for your own list.
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
    pp.birthday_month, pp.birthday_day,
    count(a.id), max(a.attended_on),
    has_premium(auth.uid(), p.id)
  from follows f
  join profiles p on p.id = f.client_id
  left join profile_private pp on pp.user_id = p.id
  left join attendance a on a.client_id = p.id and a.instructor_id = f.instructor_id
  where f.instructor_id = auth.uid()
  group by p.id, p.display_name, p.avatar_path, f.created_at, pp.birthday_month, pp.birthday_day;
$$;

-- Keep conversations sorted by latest message.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.profile_private       enable row level security;
alter table public.instructor_plans      enable row level security;
alter table public.studios               enable row level security;
alter table public.classes               enable row level security;
alter table public.follows               enable row level security;
alter table public.attendance            enable row level security;
alter table public.client_notes          enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;
alter table public.posts                 enable row level security;
alter table public.premium_subscriptions enable row level security;
alter table public.push_tokens           enable row level security;

-- Profiles: public basics, owner edits.
create policy "profiles are public" on public.profiles for select using (true);
create policy "insert own profile" on public.profiles for insert with check (id = auth.uid());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Private details: owner only.
create policy "own private details" on public.profile_private for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Plans: instructor can read their own; only the server writes.
create policy "read own plan" on public.instructor_plans for select using (instructor_id = auth.uid());

-- Studios: public; instructors can add.
create policy "studios are public" on public.studios for select using (true);
create policy "instructors add studios" on public.studios for insert
  with check (created_by = auth.uid() and is_instructor(auth.uid()));

-- Classes: schedules are free and public; instructors manage their own.
create policy "classes are public" on public.classes for select using (true);
create policy "instructor inserts own classes" on public.classes for insert
  with check (instructor_id = auth.uid() and is_instructor(auth.uid()));
create policy "instructor updates own classes" on public.classes for update
  using (instructor_id = auth.uid()) with check (instructor_id = auth.uid());
create policy "instructor deletes own classes" on public.classes for delete
  using (instructor_id = auth.uid());

-- Follows: clients follow and unfollow; both sides can see the relationship.
create policy "see own follows" on public.follows for select
  using (client_id = auth.uid() or instructor_id = auth.uid());
create policy "follow an instructor" on public.follows for insert
  with check (client_id = auth.uid() and is_instructor(instructor_id));
create policy "unfollow" on public.follows for delete using (client_id = auth.uid());

-- Attendance: clients log their own; instructors log for their followers.
create policy "see own attendance" on public.attendance for select
  using (client_id = auth.uid() or instructor_id = auth.uid());
create policy "client logs own class" on public.attendance for insert
  with check (client_id = auth.uid() and source = 'client');
create policy "instructor logs follower class" on public.attendance for insert
  with check (instructor_id = auth.uid() and source = 'instructor' and is_follower(auth.uid(), client_id));
create policy "remove own log" on public.attendance for delete
  using ((client_id = auth.uid() and source = 'client') or (instructor_id = auth.uid() and source = 'instructor'));

-- Client notes: instructor only, and only about their followers.
create policy "instructor notes" on public.client_notes for all
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid() and is_follower(auth.uid(), client_id));

-- Conversations: participants only. A client may start one with an instructor
-- they follow; an instructor may start one with a follower.
create policy "see own conversations" on public.conversations for select
  using (instructor_id = auth.uid() or client_id = auth.uid());
create policy "start conversation" on public.conversations for insert
  with check (
    (client_id = auth.uid() and is_follower(instructor_id, auth.uid()))
    or (instructor_id = auth.uid() and is_follower(auth.uid(), client_id))
  );

-- Messages: participants read; sender must be a participant.
create policy "read messages in own conversations" on public.messages for select
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.instructor_id = auth.uid() or c.client_id = auth.uid())
  ));
create policy "send message" on public.messages for insert
  with check (sender_id = auth.uid() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.instructor_id = auth.uid() or c.client_id = auth.uid())
  ));
create policy "mark read" on public.messages for update
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.instructor_id = auth.uid() or c.client_id = auth.uid())
  ));

-- Posts: free posts public; premium posts for owner and active subscribers.
create policy "read posts" on public.posts for select
  using (not is_premium or instructor_id = auth.uid() or has_premium(instructor_id, auth.uid()));
create policy "instructor writes own posts" on public.posts for insert
  with check (instructor_id = auth.uid() and is_instructor(auth.uid()));
create policy "instructor edits own posts" on public.posts for update
  using (instructor_id = auth.uid()) with check (instructor_id = auth.uid());
create policy "instructor deletes own posts" on public.posts for delete
  using (instructor_id = auth.uid());

-- Premium: read your own rows; writes come from the server only.
create policy "read own premium" on public.premium_subscriptions for select
  using (client_id = auth.uid() or instructor_id = auth.uid());

-- Push tokens: owner only.
create policy "own push tokens" on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
