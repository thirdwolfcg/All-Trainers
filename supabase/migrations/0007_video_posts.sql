-- Video posts: instructors link an Instagram Reel, TikTok or YouTube video.
-- Also: posts get a title (the app shows one on every post), and links must be https.
-- Run in the Supabase SQL Editor after 0006_ai_usage.sql.

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts
  add constraint posts_kind_check check (kind in ('photo', 'video', 'recipe', 'playlist', 'note'));

alter table public.posts drop constraint if exists posts_link_url_https;
alter table public.posts
  add constraint posts_link_url_https check (link_url is null or link_url ~* '^https://');

alter table public.posts
  add column if not exists title text check (title is null or char_length(title) between 1 and 120);
