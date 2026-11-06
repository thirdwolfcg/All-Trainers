-- Zomi (formerly All Trainers): test data for the Supabase project.
--
-- HOW TO RUN: Supabase dashboard, SQL Editor, paste this whole file, Run.
-- Needs migrations 0001 through 0012 to have been run first, in order.
-- Safe to run again: it deletes the previous test data first.
--
-- Every test account uses an @alltrainers.test email and the password below.
-- Delete them before launch by running only the CLEANUP section.
--
-- Dates are relative to today in Denver, so the schedule always looks current.

-- ---------------------------------------------------------------------------
-- CLEANUP (removes all test accounts and everything they own)
-- ---------------------------------------------------------------------------
delete from public.studios where id::text like '33333333-%';
delete from auth.users where email like '%@alltrainers.test';

-- ---------------------------------------------------------------------------
-- Helpers (temporary, disappear when the session ends)
-- ---------------------------------------------------------------------------
create or replace function pg_temp.seed_user(uid uuid, mail text) returns void
language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
    extensions.crypt('AllTrainers-test-2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, 'email',
          jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
          now(), now(), now());
end;
$$;

-- "today + n days" at a Denver clock time, as a timestamp
create or replace function pg_temp.at(days int, t time) returns timestamptz
language sql as $$
  select (((now() at time zone 'America/Denver')::date + days) + t) at time zone 'America/Denver';
$$;

create or replace function pg_temp.day(days int) returns date
language sql as $$
  select (now() at time zone 'America/Denver')::date + days;
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
select pg_temp.seed_user('11111111-0000-4000-8000-000000000001', 'maya@alltrainers.test');
select pg_temp.seed_user('11111111-0000-4000-8000-000000000002', 'jordan@alltrainers.test');
select pg_temp.seed_user('11111111-0000-4000-8000-000000000003', 'priya@alltrainers.test');
select pg_temp.seed_user('11111111-0000-4000-8000-000000000004', 'theo@alltrainers.test');
select pg_temp.seed_user('11111111-0000-4000-8000-000000000005', 'sasha@alltrainers.test');
select pg_temp.seed_user('22222222-0000-4000-8000-000000000001', 'kendall@alltrainers.test');
select pg_temp.seed_user('22222222-0000-4000-8000-000000000002', 'marcus@alltrainers.test');
select pg_temp.seed_user('22222222-0000-4000-8000-000000000003', 'tess@alltrainers.test');
select pg_temp.seed_user('22222222-0000-4000-8000-000000000004', 'dev@alltrainers.test');
select pg_temp.seed_user('22222222-0000-4000-8000-000000000005', 'riley@alltrainers.test');
select pg_temp.seed_user('22222222-0000-4000-8000-000000000006', 'amara@alltrainers.test');
select pg_temp.seed_user('22222222-0000-4000-8000-000000000007', 'jules@alltrainers.test');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
insert into public.profiles (id, role, display_name, handle, bio, styles, neighborhood) values
  ('11111111-0000-4000-8000-000000000001', 'instructor', 'Maya Chen', 'mayamoves',
   'Reformer girlie with a soft spot for slow burns and loud playlists. Teaching all over Denver, come find me.',
   '{pilates,barre}', 'LoHi'),
  ('11111111-0000-4000-8000-000000000002', 'instructor', 'Jordan Ellis', 'jordanrides',
   'Rhythm rides, 2000s throwbacks and zero judgment. If you leave dry, I did it wrong.',
   '{cycle,hiit}', 'RiNo'),
  ('11111111-0000-4000-8000-000000000003', 'instructor', 'Priya Raman', 'priya.flows',
   'Vinyasa and yin. Breath first, shapes second. Ask me about the Sunday candlelight flow.',
   '{yoga}', 'Wash Park'),
  ('11111111-0000-4000-8000-000000000004', 'instructor', 'Theo Marquez', 'theolifts',
   'Strength coach. Form over ego, always. Privates available for lifting basics.',
   '{strength,hiit}', 'Highlands'),
  ('11111111-0000-4000-8000-000000000005', 'instructor', 'Sasha Bloom', 'sashabarre',
   'Barre and sculpt. Tiny movements, big shakes. Former dancer, current pop music evangelist.',
   '{barre,dance}', 'Cherry Creek'),
  ('22222222-0000-4000-8000-000000000001', 'client', 'Kendall Brooks', null, null, '{}', 'LoHi'),
  ('22222222-0000-4000-8000-000000000002', 'client', 'Marcus Ortiz',   null, null, '{}', 'RiNo'),
  ('22222222-0000-4000-8000-000000000003', 'client', 'Tess Nguyen',    null, null, '{}', 'Wash Park'),
  ('22222222-0000-4000-8000-000000000004', 'client', 'Dev Patel',      null, null, '{}', 'Highlands'),
  ('22222222-0000-4000-8000-000000000005', 'client', 'Riley Kim',      null, null, '{}', 'Capitol Hill'),
  ('22222222-0000-4000-8000-000000000006', 'client', 'Amara Okafor',   null, null, '{}', 'Baker'),
  ('22222222-0000-4000-8000-000000000007', 'client', 'Jules Romero',   null, null, '{}', 'Sloan''s Lake');

-- Social handles
update public.profiles set instagram_handle = 'mayamoves', tiktok_handle = 'mayamoves' where id = '11111111-0000-4000-8000-000000000001';
update public.profiles set instagram_handle = 'jordanrides' where id = '11111111-0000-4000-8000-000000000002';
update public.profiles set instagram_handle = 'priya.flows', tiktok_handle = 'priyaflows' where id = '11111111-0000-4000-8000-000000000003';
update public.profiles set tiktok_handle = 'sashabarre' where id = '11111111-0000-4000-8000-000000000005';

-- Birthdays (month and day only), spread so some show up this week
-- Test clients said yes to sharing their birthday with instructors they follow.
insert into public.profile_private (user_id, birthday_month, birthday_day, share_birthday, birthday_shared_at)
select id::uuid, extract(month from pg_temp.day(n))::smallint, extract(day from pg_temp.day(n))::smallint, true, now()
from (values
  ('22222222-0000-4000-8000-000000000001', 2),    -- Kendall, in 2 days
  ('22222222-0000-4000-8000-000000000002', 0),    -- Marcus, today
  ('22222222-0000-4000-8000-000000000003', 19),   -- Tess
  ('22222222-0000-4000-8000-000000000004', 6),    -- Dev, this week
  ('22222222-0000-4000-8000-000000000005', 140),  -- Riley
  ('22222222-0000-4000-8000-000000000007', 220)   -- Jules (Amara skipped hers)
) as b(id, n);

-- Instructor plans: the first three are founding instructors
insert into public.instructor_plans (instructor_id, plan, founding_until) values
  ('11111111-0000-4000-8000-000000000001', 'founding', '2027-06-30'),
  ('11111111-0000-4000-8000-000000000002', 'founding', '2027-06-30'),
  ('11111111-0000-4000-8000-000000000003', 'founding', '2027-06-30'),
  ('11111111-0000-4000-8000-000000000004', 'standard', null),
  ('11111111-0000-4000-8000-000000000005', 'standard', null);

-- ---------------------------------------------------------------------------
-- Studios (made up)
-- ---------------------------------------------------------------------------
insert into public.studios (id, name, address, neighborhood, website_url, created_by) values
  ('33333333-0000-4000-8000-000000000001', 'Lumen Reformer',   '1550 Boulder St',  'LoHi',         'https://example.com/lumen',  '11111111-0000-4000-8000-000000000001'),
  ('33333333-0000-4000-8000-000000000002', 'Spoke & Spin',     '3200 Larimer St',  'RiNo',         'https://example.com/spoke',  '11111111-0000-4000-8000-000000000002'),
  ('33333333-0000-4000-8000-000000000003', 'Stillwater Yoga',  '700 S Downing St', 'Wash Park',    'https://example.com/still',  '11111111-0000-4000-8000-000000000003'),
  ('33333333-0000-4000-8000-000000000004', 'The Forge',        '3400 W 32nd Ave',  'Highlands',    'https://example.com/forge',  '11111111-0000-4000-8000-000000000004'),
  ('33333333-0000-4000-8000-000000000005', 'Pointe Barre Co.', '250 Columbine St', 'Cherry Creek', 'https://example.com/pointe', '11111111-0000-4000-8000-000000000005');

-- Where to book each studio (platform home pages stand in for real studio pages)
insert into public.studio_booking_links (studio_id, platform, url, label, created_by) values
  ('33333333-0000-4000-8000-000000000001', 'studio',    'https://example.com/lumen',              'Lumen app',          '11111111-0000-4000-8000-000000000001'),
  ('33333333-0000-4000-8000-000000000001', 'mindbody',  'https://www.mindbodyonline.com/explore', null,                 '11111111-0000-4000-8000-000000000001'),
  ('33333333-0000-4000-8000-000000000001', 'classpass', 'https://classpass.com',                  null,                 '11111111-0000-4000-8000-000000000001'),
  ('33333333-0000-4000-8000-000000000002', 'studio',    'https://example.com/spoke',              'Spoke & Spin app',   '11111111-0000-4000-8000-000000000002'),
  ('33333333-0000-4000-8000-000000000002', 'classpass', 'https://classpass.com',                  null,                 '11111111-0000-4000-8000-000000000002'),
  ('33333333-0000-4000-8000-000000000003', 'mindbody',  'https://www.mindbodyonline.com/explore', null,                 '11111111-0000-4000-8000-000000000003'),
  ('33333333-0000-4000-8000-000000000004', 'studio',    'https://example.com/forge',              'The Forge website',  '11111111-0000-4000-8000-000000000004'),
  ('33333333-0000-4000-8000-000000000005', 'mindbody',  'https://www.mindbodyonline.com/explore', null,                 '11111111-0000-4000-8000-000000000005'),
  ('33333333-0000-4000-8000-000000000005', 'classpass', 'https://classpass.com',                  null,                 '11111111-0000-4000-8000-000000000005');

-- ---------------------------------------------------------------------------
-- This week's classes
-- ---------------------------------------------------------------------------
insert into public.classes (instructor_id, studio_id, title, style, starts_at, ends_at, booking_url, status, note)
select i::uuid, s::uuid, title, style,
       pg_temp.at(d, t), pg_temp.at(d, t) + make_interval(mins => m),
       null, status, note
from (values
  -- Maya
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'Reformer Flow',      'pilates',  0, time '17:30', 50, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000005', 'Barre Burn',         'barre',    1, time '06:00', 50, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'Jumpboard Cardio',   'pilates',  2, time '12:00', 45, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'Reformer Flow',      'pilates',  4, time '18:00', 50, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000005', 'Sculpt + Stretch',   'barre',    5, time '09:30', 50, 'scheduled',  null),
  -- Jordan
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'Throwback Ride',     'cycle',    0, time '18:00', 45, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'Rhythm 45',          'cycle',    2, time '06:00', 45, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000004', 'HIIT Express',       'hiit',     3, time '12:00', 30, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'Pop Diva Ride',      'cycle',    5, time '10:00', 45, 'cancelled',  'Cancelled, see you next week'),
  -- Priya
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000003', 'Vinyasa 60',         'yoga',     1, time '07:00', 60, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000003', 'Yin + Sound',        'yoga',     3, time '19:30', 75, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000003', 'Candlelight Flow',   'yoga',     6, time '18:00', 60, 'scheduled',  null),
  -- Theo
  ('11111111-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000004', 'Lift Lab',           'strength', 1, time '17:30', 50, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000004', 'Full Body Strength', 'strength', 4, time '06:30', 50, 'scheduled',  null),
  -- Sasha
  ('11111111-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000005', 'Barre Classic',      'barre',    2, time '09:00', 50, 'scheduled',  null),
  ('11111111-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000005', 'Pop Sculpt',         'dance',    4, time '12:00', 45, 'scheduled',  null)
) as c(i, s, title, style, d, t, m, status, note);

-- What each class is about
update public.classes c set description = d.description
from (values
  ('Reformer Flow',      'A full-body reformer class that moves from footwork to arms to core without stopping. All levels, modifications always. Grip socks required.'),
  ('Barre Burn',         'Small pulses, big shakes. Barre work for legs and glutes with a cardio finisher. Bring grip socks and water.'),
  ('Jumpboard Cardio',   'Reformer meets cardio. 45 minutes of jumping, low impact on the joints, high impact on the heart rate. Some reformer experience helps.'),
  ('Sculpt + Stretch',   'Light weights and a long stretch to end the week right. Great for beginners and sore bodies.'),
  ('Throwback Ride',     'Rhythm ride to 2000s hits. Expect choreography, a lot of singing and zero judgment. Clip-in shoes provided.'),
  ('Rhythm 45',          'Beat-based ride with climbs and sprints. Intermediate, but go at your own pace.'),
  ('HIIT Express',       'Thirty minutes of intervals with bodyweight and dumbbells. Quick, sweaty, done before lunch is over.'),
  ('Pop Diva Ride',      'All-diva playlist, all the key changes. Bring your loudest energy.'),
  ('Vinyasa 60',         'Breath-led flow with sun salutations, standing balance and a long savasana. All levels.'),
  ('Yin + Sound',        'Long, supported holds with a live sound bath. Deeply chill, no experience needed. Mats and props provided.'),
  ('Candlelight Flow',   'Slow evening flow by candlelight. Gentle, grounding and a little bit romantic.'),
  ('Lift Lab',           'Learn the big lifts: squat, hinge, press. Small group, lots of form coaching. Beginners very welcome.'),
  ('Full Body Strength', 'Strength circuits with dumbbells and kettlebells. Bring a towel and water.'),
  ('Barre Classic',      'Traditional barre: posture, port de bras, thighs and seat. No dance experience needed.'),
  ('Pop Sculpt',         'Dance-inspired sculpt to pop hits. Light weights, big fun, a little choreography.')
) as d(title, description)
where c.title = d.title and c.instructor_id::text like '11111111-%';

-- A sub request waiting on Maya: Sasha also teaches at Pointe Barre Co.,
-- so she can ask Maya to cover her Pop Sculpt class there.
insert into public.sub_requests (class_id, from_instructor_id, to_instructor_id, created_at)
select id, '11111111-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000001', now() - interval '2 hours'
from public.classes
where instructor_id = '11111111-0000-4000-8000-000000000005' and title = 'Pop Sculpt';

-- ---------------------------------------------------------------------------
-- Follows (each follow puts the client on that instructor's list)
-- ---------------------------------------------------------------------------
insert into public.follows (client_id, instructor_id, created_at)
select c::uuid, i::uuid, now() - make_interval(days => ago)
from (values
  ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 120),
  ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000002',  90),
  ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003',  60),
  ('22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001',  30),
  ('22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000001', 200),
  ('22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000005',  45),
  ('22222222-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000001',  14),
  ('22222222-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000004',  40),
  ('22222222-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000002',  20),
  ('22222222-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000001',  95),
  ('22222222-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000001',   5),
  ('22222222-0000-4000-8000-000000000007', '11111111-0000-4000-8000-000000000001', 300)
) as f(c, i, ago);

-- ---------------------------------------------------------------------------
-- Past classes for the tracker (client, instructor, studio, days ago)
-- ---------------------------------------------------------------------------
insert into public.attendance (client_id, instructor_id, studio_id, kind, attended_on, source)
select c::uuid, i::uuid, s::uuid, 'class', pg_temp.day(-ago), 'client'
from (values
  -- Kendall: 12 with Maya, 4 with Jordan, 2 with Priya
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001', 1),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001', 4),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000005', 8),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',11),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',15),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',18),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',22),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',29),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000005',36),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',43),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',50),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',57),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000002', 3),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000002',10),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000004',17),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000002',24),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000003', 7),
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000003',21),
  -- Marcus
  ('22222222-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001', 6),
  ('22222222-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',13),
  -- Tess
  ('22222222-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000005', 3),
  ('22222222-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000005',10),
  ('22222222-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',31),
  ('22222222-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',45),
  ('22222222-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',64),
  ('22222222-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000005','33333333-0000-4000-8000-000000000005', 9),
  -- Dev
  ('22222222-0000-4000-8000-000000000004','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001', 2),
  ('22222222-0000-4000-8000-000000000004','11111111-0000-4000-8000-000000000004','33333333-0000-4000-8000-000000000004', 5),
  ('22222222-0000-4000-8000-000000000004','11111111-0000-4000-8000-000000000004','33333333-0000-4000-8000-000000000004',12),
  -- Riley
  ('22222222-0000-4000-8000-000000000005','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001', 9),
  ('22222222-0000-4000-8000-000000000005','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',16),
  ('22222222-0000-4000-8000-000000000005','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',23),
  -- Jules
  ('22222222-0000-4000-8000-000000000007','11111111-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000005',75)
) as a(c, i, s, ago);

-- ---------------------------------------------------------------------------
-- Instructor notes (private to the instructor)
-- ---------------------------------------------------------------------------
insert into public.client_notes (instructor_id, client_id, preferences, notes) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Front row, right side. Loves the jumpboard.', 'Asked about privates for next month.'),
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000003', 'Training for a half marathon.', null);

-- ---------------------------------------------------------------------------
-- Premium (normally written by payment webhooks only)
-- ---------------------------------------------------------------------------
insert into public.premium_subscriptions (client_id, instructor_id, status, provider, current_period_end) values
  ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'active', 'stripe', now() + interval '30 days'),
  ('22222222-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000001', 'active', 'stripe', now() + interval '30 days');

-- ---------------------------------------------------------------------------
-- Feed posts
-- ---------------------------------------------------------------------------
insert into public.posts (instructor_id, kind, body, link_url, is_premium, created_at)
select i::uuid, kind, body, link, prem, now() - make_interval(hours => h)
from (values
  ('11111111-0000-4000-8000-000000000001', 'note',     'Schedule drop: new Wednesday jumpboard class at Lumen starting this week. 45 minutes, bring water and your best attitude.', null, false, 3),
  ('11111111-0000-4000-8000-000000000001', 'recipe',   'Post-reformer protein oats. Rolled oats, a scoop of vanilla protein, cinnamon, almond milk, top with berries. Five minutes, no excuses.', null, false, 26),
  ('11111111-0000-4000-8000-000000000001', 'playlist', 'This week''s class playlist. All the songs from Reformer Flow, in order.', 'https://open.spotify.com', true, 30),
  ('11111111-0000-4000-8000-000000000001', 'note',     'Form check: footwork. A quick breakdown of footwork on the reformer, plus the cue I give when your knees start drifting.', null, true, 72),
  ('11111111-0000-4000-8000-000000000002', 'playlist', 'Throwback Ride setlist. Britney, Usher, a little Nelly. You know what it is.', 'https://open.spotify.com', true, 5),
  ('11111111-0000-4000-8000-000000000002', 'note',     'Saturday ride is off. Pop Diva Ride is cancelled this week. Back next Saturday with double the key changes.', null, false, 20),
  ('11111111-0000-4000-8000-000000000003', 'recipe',   'Golden milk for yin nights. Warm oat milk, turmeric, ginger, black pepper, a drizzle of honey.', null, false, 40)
) as p(i, kind, body, link, prem, h);

-- ---------------------------------------------------------------------------
-- Direct messages
-- ---------------------------------------------------------------------------
insert into public.conversations (id, instructor_id, client_id) values
  ('44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000003');

insert into public.messages (conversation_id, sender_id, body, created_at)
select conv::uuid, sender::uuid, body, now() - make_interval(mins => ago)
from (values
  ('44444444-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Is the Wednesday jumpboard class ok for beginners?', 180),
  ('44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'Totally. I''ll give you modifications, just grab a spot near the front so I can see you.', 150),
  ('44444444-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfect, see you there!', 140),
  ('44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002', 'Missed you Thursday! Throwback Ride is back tonight.', 1560),
  ('44444444-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000003', 'Can I book a private next week?', 45)
) as m(conv, sender, body, ago);

-- ---------------------------------------------------------------------------
-- Quick check: should list 12 test accounts
-- ---------------------------------------------------------------------------
select p.display_name, p.role, u.email
from public.profiles p join auth.users u on u.id = p.id
where u.email like '%@alltrainers.test'
order by p.role desc, p.display_name;
