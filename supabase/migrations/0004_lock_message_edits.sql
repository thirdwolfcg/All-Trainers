-- Fix: the "mark read" rule in 0001 let either person in a conversation change
-- any column of any message in it, including the other person's words.
-- Now an update may only set read_at, and only the recipient may set it.
--
-- Run in the Supabase SQL Editor after 0003_sub_requests.sql.

create or replace function public.messages_only_mark_read()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.body <> old.body
     or new.sender_id <> old.sender_id
     or new.conversation_id <> old.conversation_id
     or new.created_at <> old.created_at then
    raise exception 'Messages cannot be edited.';
  end if;
  if auth.uid() is not null and auth.uid() = old.sender_id
     and new.read_at is distinct from old.read_at then
    raise exception 'Only the recipient can mark a message as read.';
  end if;
  return new;
end;
$$;

create trigger messages_only_mark_read before update on public.messages
  for each row execute function public.messages_only_mark_read();
