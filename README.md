# All Trainers (working name)

An instructor-first fitness app. Clients follow their favorite instructors and see where they're teaching this week, across every studio. Instructors get one schedule, an automatic client list, birthday reminders, a class tracker and DMs.

Launch market is Denver.

## Run it

```bash
npm install
npx expo start          # press w for web, i for iOS simulator, a for Android
```

On a phone, install Expo Go and scan the QR code.

Accounts are real (Supabase). The screens after sign-in still show sample data from `src/data/sample.ts` until the live data step is done. Tap **Peek at the demo first** on the welcome screen to click around without an account, and use **Me, then Preview mode** to switch between the client and instructor views.

The `.env` file holds the Supabase project URL and publishable key. Both are meant to ship inside the app. Never add the service_role or secret key to this repo.

## Web preview

The latest build runs at **https://thirdwolfcg.github.io/All-Trainers/** (GitHub Pages, `gh-pages` branch). To update it, run `scripts/deploy-web-preview.sh`.

## AI writing help

Instructors can tap "Help me write it" when adding a class. The app calls the
`describe-class` Edge Function, which calls Claude (claude-haiku-5-5) with the
key stored only as the Supabase secret `ANTHROPIC_API_KEY`. Each instructor is
capped at 25 drafts per 24 hours (table `ai_usage`, migration 0006). Preview
mode uses a built-in template writer instead of the AI.

Deploy: `supabase functions deploy describe-class` and
`supabase secrets set ANTHROPIC_API_KEY=...` (or paste the function into the
dashboard's Edge Functions editor and add the secret under Edge Functions, Secrets).

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
supabase/migrations/     database schema with row level security (run 0001 through 0006 in order)
supabase/functions/       Edge Functions (describe-class: AI writing help for class descriptions)
supabase/seed.sql        test accounts and data (run after the migrations)
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
- [x] Sign up, sign in and sign out (Supabase auth), onboarding with role, profile and birthday
- [x] Studio Editorial look (Fraunces and Inter, plum, hairline rows) with a playful Gen Z voice
- [x] Book it opens a choice of where to book: the studio's own app or site, Mindbody or ClassPass (`studio_booking_links`)
- [x] Sub requests: ask only instructors who teach at the same studio (enforced in the database), accept or decline, class shows who is covering
- [x] Invite coworkers by text message or share sheet when no one from the studio is on the app
- [x] Client invites: invite a friend, invite an instructor who isn't on the app, and "bring a friend" from any instructor's profile
- [x] Instructor QR code (follow page at `/follow/<handle>`, works signed out and follows after sign up)
- [x] Discover tab for clients: search by name, @handle, studio, neighborhood or style
- [x] Instagram and TikTok on instructor profiles
- [x] Class detail page with "what to expect" descriptions
- [x] Undo for unfollow, "I went", cancelled classes and "can't" on a sub ask; confirmation before cancelling a class or accepting a sub
- [x] Demo mode from the welcome screen, so anyone can click around without an account

Still to do for Phase 1:

- [ ] Swap the in-memory store for Supabase queries
- [ ] Photo posts (Supabase storage)
- [ ] Push notifications for new classes, subs, cancellations and messages
- [ ] Native iPhone calendar and a subscribable calendar feed per instructor
- [ ] Premium subscriptions through RevenueCat and Stripe, server webhooks writing `premium_subscriptions`
- [ ] App icon, splash screen and final name
- [ ] Real domain for invite and QR links (`PUBLIC_APP_URL` in `src/lib/links.ts` points at the GitHub Pages preview) and push notifications for sub asks

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
