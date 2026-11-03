-- Tracks AI writing help so each instructor gets a daily cap (keeps the AI bill predictable).
-- Run in the Supabase SQL Editor after 0005_socials_descriptions_sub_undo.sql.

create table public.ai_usage (
  id         bigserial primary key,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  feature    text not null check (feature in ('describe_class')),
  created_at timestamptz not null default now()
);

create index ai_usage_user_time on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

create policy "instructors log their own AI use" on public.ai_usage
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_instructor(auth.uid()));

create policy "see your own AI use" on public.ai_usage
  for select to authenticated
  using (user_id = auth.uid());
