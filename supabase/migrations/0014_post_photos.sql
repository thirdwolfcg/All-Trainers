-- Photos on instructor posts.
--
-- A public storage bucket: anyone can view a post photo (posts are public),
-- only instructors can upload, and only into their own folder
-- (post-photos/<their user id>/...). People can delete only their own files.
-- Images only, up to 5 MB each.
--
-- Run in the Supabase SQL Editor after 0013.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "instructors upload post photos to their folder" on storage.objects;
create policy "instructors upload post photos to their folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_instructor(auth.uid())
  );

drop policy if exists "owners remove their post photos" on storage.objects;
create policy "owners remove their post photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- A post can only point at a photo in its own instructor's folder.
alter table public.posts drop constraint if exists posts_media_path_own_folder;
alter table public.posts
  add constraint posts_media_path_own_folder
  check (media_path is null or media_path like instructor_id::text || '/%');
