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
2. **Done: screens use live Supabase data.** (Was: Connect screens to live Supabase data.) After sign in, every screen still reads the in-memory sample store (`src/lib/store.tsx`). Classes, posts, follows, messages, sub requests, attendance and bookings need to read and write the real tables. Real accounts already start with empty follows, bookings and messages; the store keeps "me" under its sample id until this is done.
3. **"Booked it" for real accounts.** Clients mark classes they booked elsewhere; they show in "Your week" on Home. Table `class_bookings` (migration 0010) is ready, the screens still use the sample store. The class's instructor can see who's coming, which could become a "who's coming" list on their week.
4. **Push notifications.** Needed for sub asks, new messages, client birthdays and "your instructor added a class." `push_tokens` table exists. Needs Expo push setup for iPhone and Android, and a settings screen (Me, Notifications says "Soon").
5. **Calendar sync.** A subscribable calendar link (an iCal feed per client) that keeps their booked classes up to date, served by an Edge Function. One-tap "Add to cal" per class already works. Me, Calendar sync says "Soon."
6. **Premium and payments.** Client premium subscriptions with the instructor's share: App Store and Google Play in-app purchases (Apple requires them for digital content), Stripe for instructor payouts, webhooks that write `premium_subscriptions`. Me, Premium says "Soon." Decide pricing and the open questions below first.
7. **Founding plan to paid plan.** When founding instructors start paying, and how (`instructor_plans`).
8. **Instructors edit or delete a class**, and **add a new studio** (today they can only cancel, and pick from existing studios).
9. **Delete account.** Built (Me, Privacy, Delete my account) with `delete_my_account()` from migration 0009, and run in Supabase. Test with a throwaway account. Messages the person sent go with their conversations, so the other side loses that history too.
10. **Photo uploads.** Instructors can pick a photo for a post (expo-image-picker, photo library permission in app.json). It only lives on the device for now: upload it to Supabase Storage and save the path in `posts.media_path`.
11. **Real domain.** QR codes and invite links point at the GitHub Pages address (`src/lib/links.ts`). Change before anyone prints a QR code.
12. **App Store and Google Play release.** Set up and ready except for the steps in "Releasing to the stores" below: the app config and `eas.json` are done, and the listing copy, privacy answers, review notes and screenshots are in `docs/store-listing.md` and `docs/store-screenshots/`. Two things block the first submission: #22 (report and block) and #23 (public web pages).
13. **Repeating classes in the database.** Migration 0011 (`class_series`, `classes.series_id`, `playlist_url`, `recipe_post_id`) has been run. Save repeating classes as one `class_series` row plus the generated `classes` rows. The app already builds them (Add class, How often).
14. **Possible addition: merch and other sales.** Instructors selling merch, programs or class packs. Decide between linking out (Shopify, Instagram shop) and selling in the app (Stripe; Apple's in-app purchase rules apply to digital goods, not physical merch).
15. **Possible addition: virtual classes.** A class with a join link (Zoom, YouTube Live, Instagram Live) instead of a studio, free or paid. Paid virtual classes count as digital content, so Apple and Google in-app purchase rules apply.
16. **Class updates, waitlist and offer my spot (migration 0013).** Built in the demo: instructors message everyone booked into a class (shows on the class, on client Home and in Messages), clients join an in-app waitlist, booked clients offer their spot and others claim it (the claim moves `class_bookings`). Wire the screens to `class_updates`, `class_waitlist`, `spot_offers`. Alerts need push notifications (#4): waitlisted clients first, then the instructor's followers. "Offer my spot" is marked Premium in the app but nothing enforces it yet.
17. **Finish the Zomi rename.** The app shows Zomi everywhere (app.json name, slug and scheme are `zomi`). Still to do: point zomifit.com at the web app and switch `PUBLIC_APP_URL` in `src/lib/links.ts` to `BRAND_DOMAIN` (QR codes and invite links follow it), set bundle ids (for example com.zomifit.app) before the first store build, list the app as "Zomi Fit" in the App Store and Google Play and redeploy the `describe-class` Edge Function so the AI prompt says Zomi. Test accounts keep their @alltrainers.test emails. The Zomi icon, Android adaptive icon, favicon, splash and wordmark are in (`assets/images`, source SVGs in `assets/brand`); the iOS icon is now a plain PNG instead of the Expo `.icon` bundle, so remake it in Icon Composer if you want the iOS 26 glass look.
18. **Sub requests and private sessions.** The instructor landing page (`/teach`) shows example notifications for a sub request ("Kendall needs a sub, can you cover?"), a private session booking ("Sarah booked a private") and a class booking. Sub requests already work in the demo (Need a sub, Can you cover?, table `sub_requests` from migrations 0003 and 0005); they go live with #2, and the ping needs push (#4). Private session booking is not built yet. Build it before launch, or label it coming soon on the landing page so nobody signs up expecting it on day one. Privates: instructors set private availability and price, clients request or book a slot, payment goes through Stripe (in person services are fine outside Apple in-app purchase).

Done since the first list: Dave's review (no birthday in onboarding, Home vs Discover, Discover filters behind a button, My classes lists followed instructors, New message, tips instead of a tour, premium posts removed, Followers tab, repeating classes, photos on posts, playlist and recipe on classes); instructor and client profile editing, birthday add/change/remove (`profile_private`), Privacy screen, role locked in the database (0008), video posts and post titles (0007), instructor landing page at `/teach`.
19. **Post ideas, the AI version.** My Week shows a Post idea card timed around the instructor's classes: in the 6 hours before a class it asks things like "What's in your pre-class drink?" or "Got a quick stretch they can do before class?", in the 4 hours after it suggests a post-class meal, cooldown or shoutout, and otherwise a general idea. "Post this" opens New post with the type picked and the idea shown; "Not today" (the X) hides it until tomorrow. The ideas are a fixed list in `src/lib/post-ideas.ts`. To make it AI: add a `post-ideas` Edge Function like `describe-class` (Haiku, same daily cap in `ai_usage`) that writes 3 ideas from the instructor's upcoming class, styles, recent posts and which post types their followers open most, and fall back to the fixed list when it fails. To reach instructors before class (not just when they open the app), send one as a push notification about 2 hours before their first class of the day (needs push, #4), at most once a day, with a setting to turn it off. Keep the prompts to the instructor's own routine (what they eat, drink, stretch, listen to); don't have the AI suggest supplements, diets or health claims.
20. **Future: import schedules and class descriptions from booking platforms.** Lo wants classes to come straight from Mindbody, ClassPass and the like so instructors don't retype them. The schedule data belongs to the studio, so every route needs the studio's buy-in: Mindbody has a public API, but each studio (site) has to activate access for the app; ClassPass doesn't offer an open API for this (its integrations sync from the studio's booking software, so getting Mindbody, Mariana Tek, Momence, Arketa, Walla or Glofox covers ClassPass studios too). A route that needs no partnership: let an instructor paste their schedule text or upload a screenshot of it and have AI turn it into classes they confirm before posting (same Edge Function pattern as `describe-class`). Start with that, then add platform syncs studio by studio.
21. **Live data, what changed (Nov 2026).** Signed-in accounts load from and save to Supabase through `src/lib/live.ts`; the store (`src/lib/store.tsx`) updates the screen first, saves in the background, and on a failed save shows a toast and reloads. Preview mode still uses `src/data/sample.ts`. Covered: classes (plus `class_series` for repeating ones), studios, posts, follows, bookings, class updates, waitlist, spot offers, attendance, sub requests, client notes and messages. Data reloads when the app comes back to the front; there is no realtime subscription yet, so someone else's change shows after a reload. Each read and write was checked against the row level security rules in the local test database. Known limits: the first load fetches every public profile, studio and class from the last 100 days to a year out, which is fine for launch but should become paged or filtered by follows as Zomi grows; class update messages only reach booked clients who follow the instructor (the database only lets an instructor message followers); deleting a post leaves its photo in storage. Items 3, 8 (edit and delete a class), 10 (photo uploads, migration 0014) and 13 are done as part of this.
22. **Report and block (needed before submitting to either store).** Apple guideline 1.2 and Google's user generated content policy require, for apps where people post or message: a way to report a post, profile or message; a way to block another person (blocked people can't message you and their posts disappear for you); a contact for reports; and Terms that say objectionable content isn't allowed and reports are acted on within 24 hours. Suggested build: a `reports` table (reporter, target type and id, reason, status) only the reporter and an admin can read, a `blocks` table (blocker, blocked) checked in the messages and posts rules, a ⋯ menu on posts, profiles and chats with Report and Block, and an email to support for each new report (Edge Function).
23. **Public web pages for the stores.** zomifit.com/privacy (the Privacy Policy, placeholders filled in), zomifit.com/support (support email), zomifit.com/delete-account (how to delete an account in the app or by email; Google requires this page). Also fill in the Terms placeholders and add the 24 hour line from #22.

## Releasing to the stores

Everything below happens on David's computer with his own logins; nothing here needs a secret in the repo. The app's IDs are `com.zomifit.app` on both stores, the store name is Zomi Fit and the home screen name is Zomi.

**Once**
1. Make the developer accounts in the company's name: Apple Developer Program (organization, needs a D-U-N-S number, $99 a year) and Google Play Console (organization, $25 once; organization accounts skip the 12 tester closed test).
2. `npm install -g eas-cli`, then `eas login` with the Expo account that will own the app, then `eas init` in this folder (it links the project and adds `extra.eas.projectId` to app.json; commit that).
3. Run `npx expo-doctor` and fix anything it flags (it needs the internet, so it couldn't fully run where this was set up).
4. App Store Connect: create the app (name Zomi Fit, bundle ID com.zomifit.app, SKU zomifit-ios-1) and paste its Apple ID number into `eas.json` → `submit.production.ios.ascAppId`.
5. Google Play Console: create the app (Zomi Fit), then make a service account with release access and save its key as `google-play-service-account.json` in this folder. It's in .gitignore; never commit it.

**Try it on phones first**
- `eas build --profile preview --platform all` makes an install link for iPhones you register (`eas device:create`) and an Android APK anyone can install. Check photo posts, sharing the QR link, links into Instagram, TikTok and Spotify, sign in and out, and delete account.

**Each release**
1. `eas build --profile production --platform all` (build numbers go up by themselves).
2. `eas submit --profile production --platform ios` sends it to TestFlight; `eas submit --profile production --platform android` puts it on Play's internal testing track as a draft.
3. Fill in the listing from `docs/store-listing.md`, upload `docs/store-screenshots/ios-6.9/` to App Store Connect and `docs/store-screenshots/android-phone/`, `play-icon-512.png` and `play-feature-graphic.png` to Play, add the reviewer test accounts, then submit for review.

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
