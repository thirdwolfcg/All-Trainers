# All Trainers (working name)

An instructor-first fitness app. Clients follow their favorite instructors and see where they're teaching this week, across every studio. Instructors get one schedule, an automatic client list, birthday reminders, a class tracker and DMs.

Launch market is Denver.

## Run it

```bash
npm install
npx expo start          # press w for web, i for iOS simulator, a for Android
```

On a phone, install Expo Go and scan the QR code.

The app runs on sample data right now (everything in `src/data/sample.ts` is made up). Use **Me, then Preview mode** to switch between the client view and the instructor view.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| App | Expo SDK 58, React Native, Expo Router, TypeScript | One codebase for iPhone, Android and web |
| Backend | Supabase (Postgres, auth, storage, realtime) | Managed, free tier covers launch, row level security |
| Push | Expo push notifications | Works with Expo builds on both stores |
| Payments | RevenueCat for in-app subscriptions, Stripe on web | Apple and Google require their billing for digital content |
| Calendar | .ics files and a per-instructor calendar feed | Works with Apple and Google Calendar without special API agreements |

## Where things live

```
src/app/                 screens (every file is a route)
  (tabs)/index.tsx       Home for clients, "My week" for instructors
  (tabs)/activity.tsx    Class tracker for clients, client list for instructors
  (tabs)/messages.tsx    Inbox
  (tabs)/me.tsx          Profile, settings, preview switch
  instructor/[id].tsx    Public instructor profile, weekly schedule, feed
  client/[id].tsx        Instructor's view of one client, private notes
  chat/[id].tsx          DM thread
  schedule/new.tsx       Instructor adds a class
src/components/          design system (ui.tsx, cards.tsx, screen.tsx)
src/constants/theme.ts   colors, type, spacing
src/lib/                 types, dates, calendar, in-memory store
src/data/sample.ts       made-up instructors, studios, classes, clients
supabase/migrations/     database schema with row level security
```

## Phase 1 status

Done in this first pass (sample data, no backend yet):

- [x] Design system: white, soft purple, gray
- [x] Client home: this week's classes from followed instructors, day picker, search by name, studio, neighborhood or style
- [x] Follow and unfollow, and a follow adds the client to the instructor's list
- [x] Instructor profile with weekly schedule across studios and a feed (updates, recipes, playlist links)
- [x] Premium posts locked for non-subscribers
- [x] Book at studio (links out) and add to calendar (.ics on web, Google Calendar on phones)
- [x] Class tracker by instructor and by studio, with "I went"
- [x] Instructor week view: add a class, mark "need a sub", cancel
- [x] Birthday alerts on the instructor's week
- [x] Client list with class counts, premium and birthday tags
- [x] Private client notes for instructors
- [x] DMs
- [x] Supabase schema with row level security

Still to do for Phase 1:

- [ ] Sign up and sign in (Supabase auth), onboarding with role and birthday
- [ ] Swap the in-memory store for Supabase queries
- [ ] Photo posts (Supabase storage)
- [ ] Push notifications for new classes, subs, cancellations and messages
- [ ] Native iPhone calendar and a subscribable calendar feed per instructor
- [ ] Premium subscriptions through RevenueCat and Stripe, server webhooks writing `premium_subscriptions`
- [ ] App icon, splash screen and final name

## Decisions for David to review

1. **Stack.** Everything above. Easier to change now than later.
2. **Privacy.** Birthdays are stored as month and day only, in a private table. Instructors see them only for their own followers, through `instructor_client_list()`. Client notes are visible to the instructor only.
3. **Premium access** is written by the server only (webhooks), never by the app.
4. **Attendance** is self-reported by clients ("I went") or logged by instructors. No studio check-in data until there are API agreements (Mindbody and others).
5. **Instructor billing.** Founding instructors are free (`instructor_plans.plan = 'founding'`) until a date we set, then move to a paid plan.

## Open product questions

- Playlist access sits in premium. Sharing a Spotify or Apple Music link is normal, but putting it behind a paywall needs a closer look against those services' terms before launch.
- Price of client premium, and the instructor's share.
- Final app name.
