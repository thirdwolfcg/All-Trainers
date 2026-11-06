# Zomi

The app is called **Zomi** (what people see and say). The domain, social handles and app store listing are **Zomi Fit**: zomifit.com, @zomifit. The repo keeps its old name, All-Trainers, so the test link keeps working.

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
supabase/migrations/     database schema with row level security (run 0001 through 0013 in order; all have been run in Supabase)
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

## To-do for David

1. **Turn on AI writing help.** The `describe-class` Edge Function is deployed and migration 0006 has been run. Remaining:
   - In Supabase, Edge Functions, describe-class, Settings: switch off "Verify JWT with legacy secret" and save. The project signs user tokens with an ECC (P-256) key, so the legacy check rejects every signed-in user. The function verifies the user itself with `auth.getUser()` (see `supabase/config.toml`).
   - Create an Anthropic API key at console.anthropic.com. Add a small credit balance and set a monthly spend limit.
   - Add it in Supabase under Edge Functions, Secrets as `ANTHROPIC_API_KEY`. Never commit it or put it in the app.
   - Test: sign in as maya@alltrainers.test, Add class, type a name, tap Help me write it. Check the function logs and the `ai_usage` table. Until this is done, instructors see "Writing help isn't switched on yet."
   - Lo will add Anthropic to the Privacy Policy as an AI service provider.
2. **Connect screens to live Supabase data.** After sign in, every screen still reads the in-memory sample store (`src/lib/store.tsx`). Classes, posts, follows, messages, sub requests, attendance and bookings need to read and write the real tables. Real accounts already start with empty follows, bookings and messages; the store keeps "me" under its sample id until this is done.
3. **"Booked it" for real accounts.** Clients mark classes they booked elsewhere; they show in "Your week" on Home. Table `class_bookings` (migration 0010) is ready, the screens still use the sample store. The class's instructor can see who's coming, which could become a "who's coming" list on their week.
4. **Push notifications.** Needed for sub asks, new messages, client birthdays and "your instructor added a class." `push_tokens` table exists. Needs Expo push setup for iPhone and Android, and a settings screen (Me, Notifications says "Soon").
5. **Calendar sync.** A subscribable calendar link (an iCal feed per client) that keeps their booked classes up to date, served by an Edge Function. One-tap "Add to cal" per class already works. Me, Calendar sync says "Soon."
6. **Premium and payments.** Client premium subscriptions with the instructor's share: App Store and Google Play in-app purchases (Apple requires them for digital content), Stripe for instructor payouts, webhooks that write `premium_subscriptions`. Me, Premium says "Soon." Decide pricing and the open questions below first.
7. **Founding plan to paid plan.** When founding instructors start paying, and how (`instructor_plans`).
8. **Instructors edit or delete a class**, and **add a new studio** (today they can only cancel, and pick from existing studios).
9. **Delete account.** Built (Me, Privacy, Delete my account) with `delete_my_account()` from migration 0009, and run in Supabase. Test with a throwaway account. Messages the person sent go with their conversations, so the other side loses that history too.
10. **Photo uploads.** Instructors can pick a photo for a post (expo-image-picker, photo library permission in app.json). It only lives on the device for now: upload it to Supabase Storage and save the path in `posts.media_path`.
11. **Real domain.** QR codes and invite links point at the GitHub Pages address (`src/lib/links.ts`). Change before anyone prints a QR code.
12. **App Store and Google Play release.** EAS builds, store listings, privacy labels, and review notes (test account for Apple).
13. **Repeating classes in the database.** Migration 0011 (`class_series`, `classes.series_id`, `playlist_url`, `recipe_post_id`) has been run. Save repeating classes as one `class_series` row plus the generated `classes` rows. The app already builds them (Add class, How often).
14. **Possible addition: merch and other sales.** Instructors selling merch, programs or class packs. Decide between linking out (Shopify, Instagram shop) and selling in the app (Stripe; Apple's in-app purchase rules apply to digital goods, not physical merch).
15. **Possible addition: virtual classes.** A class with a join link (Zoom, YouTube Live, Instagram Live) instead of a studio, free or paid. Paid virtual classes count as digital content, so Apple and Google in-app purchase rules apply.
16. **Class updates, waitlist and offer my spot (migration 0013).** Built in the demo: instructors message everyone booked into a class (shows on the class, on client Home and in Messages), clients join an in-app waitlist, booked clients offer their spot and others claim it (the claim moves `class_bookings`). Wire the screens to `class_updates`, `class_waitlist`, `spot_offers`. Alerts need push notifications (#4): waitlisted clients first, then the instructor's followers. "Offer my spot" is marked Premium in the app but nothing enforces it yet.
17. **Finish the Zomi rename.** The app shows Zomi everywhere (app.json name, slug and scheme are `zomi`). Still to do: point zomifit.com at the web app and switch `PUBLIC_APP_URL` in `src/lib/links.ts` to `BRAND_DOMAIN` (QR codes and invite links follow it), set bundle ids (for example com.zomifit.app) before the first store build, list the app as "Zomi Fit" in the App Store and Google Play and redeploy the `describe-class` Edge Function so the AI prompt says Zomi. Test accounts keep their @alltrainers.test emails. The Zomi icon, Android adaptive icon, favicon, splash and wordmark are in (`assets/images`, source SVGs in `assets/brand`); the iOS icon is now a plain PNG instead of the Expo `.icon` bundle, so remake it in Icon Composer if you want the iOS 26 glass look.
18. **Sub requests and private sessions.** The instructor landing page (`/teach`) shows example notifications for a sub request ("Kendall needs a sub, can you cover?"), a private session booking ("Sarah booked a private") and a class booking. Class bookings exist; sub requests between instructors and booking a private session in the app are not built yet. Build both before launch, or label them coming soon on the landing page so nobody signs up expecting them on day one. Sub requests: an instructor posts a class that needs covering, instructors at the same studio get a ping, one accepts, and the class moves to them with followers notified (needs push, #4). Privates: instructors set private availability and price, clients request or book a slot, payment goes through Stripe (in person services are fine outside Apple in-app purchase).

Done since the first list: Dave's review (no birthday in onboarding, Home vs Discover, Discover filters behind a button, My classes lists followed instructors, New message, tips instead of a tour, premium posts removed, Followers tab, repeating classes, photos on posts, playlist and recipe on classes); instructor and client profile editing, birthday add/change/remove (`profile_private`), Privacy screen, role locked in the database (0008), video posts and post titles (0007), instructor landing page at `/teach`.

## Decisions for David to review

1. **Stack.** Everything above. Easier to change now than later.
2. **Privacy.** Birthdays are stored as month and day only, in a private table. Instructors see them only for their own followers, through `instructor_client_list()`. Client notes are visible to the instructor only.
3. **Premium access** is written by the server only (webhooks), never by the app.
4. **Attendance** is self-reported by clients ("I went") or logged by instructors. No studio check-in data until there are API agreements (Mindbody and others).
5. **Instructor billing.** Founding instructors are free (`instructor_plans.plan = 'founding'`) until a date we set, then move to a paid plan.

## Open product questions

- **Offer my spot needs studio buy-in.** The app can match a giver and a taker, but the reservation itself lives with the studio, ClassPass or Mindbody, and many of those bookings are non-transferable (ClassPass in particular ties the reservation to the member). Options: studios agree to swap names at the front desk for Zomi transfers, or an API partnership later. Until then it's a coordination tool, not a guaranteed way to avoid the late cancel fee.
- **True waitlist alerts need booking data.** The in-app waitlist only covers spots offered on Zomi. Alerts for a studio's own waitlist (a spot opening in Mindbody or ClassPass) need an integration with those systems.
- **Which premium?** "Offer my spot" is meant for a client premium subscription to the app, while the earlier premium idea was per instructor (one on one access). Decide whether there is one app-wide client premium, per-instructor premium, or both.

- **Premium posts:** removed for now (Dave: showing locked posts to followers made no sense). All posts are free to followers. Revisit when premium is designed.
- Playlist access sits in premium. Sharing a Spotify or Apple Music link is normal, but putting it behind a paywall needs a closer look against those services' terms before launch.
- Price of client premium, and the instructor's share.
- Final app name.
