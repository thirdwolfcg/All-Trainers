# Zomi Fit: App Store and Google Play listing

Everything to paste into App Store Connect and the Google Play Console. Character limits are noted; the counts below fit them. Copy is in Zomi's voice: warm, short, never studio versus instructor.

## Names and IDs

| Field | Value |
| --- | --- |
| Store name (both stores) | Zomi Fit |
| Name on the phone's home screen | Zomi |
| iOS bundle ID and Android package | com.zomifit.app |
| SKU (App Store Connect, never shown) | zomifit-ios-1 |
| Primary category | Health & Fitness |
| Secondary category (Apple only) | Lifestyle |
| Price | Free |
| Availability | United States to start (Denver launch) |

## Apple App Store

**Subtitle** (30 max, 28 used)
Follow your fave instructors

**Promotional text** (170 max; can be changed any time without a new review)
Your favorite instructors teach all over town. Zomi puts every class they teach, at every studio, in one place, so you never miss one again.

**Keywords** (100 max, 98 used, comma separated, no spaces; avoid other companies' names, Apple rejects them)
pilates,yoga,cycle,barre,HIIT,instructor,trainer,class schedule,studio,workout,Denver,fitness,spin

**Description** (4000 max)

Never miss a class with your faves.

Your favorite instructors don't just teach at one studio. They're at a reformer studio Monday, a cycle studio Wednesday and subbing somewhere new on Saturday, and the only place it's posted is an Instagram story that disappears in 24 hours. Zomi fixes that.

FOR PEOPLE WHO TAKE CLASSES
• Follow the instructors you love, not just the studios
• See every class they're teaching this week, at every studio, in one place
• Tap Booked it to keep track of your week (you still book through the studio's own app)
• Get their playlists, post-class recipes, videos and updates on your Home
• Find new instructors by name, style or neighborhood
• Join the waitlist on a full class, or offer your spot to someone who wants it
• Share your birthday if you want to, so your instructors can celebrate you

FOR INSTRUCTORS
• Post your classes once, at any studio, and make them weekly
• Flash your QR code after class. One scan and they follow you
• Share playlists, recipes, videos and updates with your people
• See your regulars, their birthdays and your private notes in one place
• Need a sub? Ask the instructors you trust right in the app
• Message the people booked in your class when plans change

Zomi is free for clients. Booking and payment still happen with each studio.

Made in Denver for the instructors who make the workout worth it.

**What's New in This Version** (first release)
Hiii, welcome to Zomi. Follow your faves, see where they're teaching and never miss a class.

**URLs** (all three must be live, public pages before submitting)
- Privacy Policy URL: https://zomifit.com/privacy (publish the Zomi Privacy Policy there first)
- Support URL: https://zomifit.com/support (a simple page with the support email is enough)
- Marketing URL (optional): https://zomifit.com

**Age rating questionnaire**
Answer Yes to: user-generated content, messaging and chat (people can message each other), and unrestricted web access only if asked about links opening in the browser (posts can link to Instagram, TikTok, Spotify and YouTube). Answer No or None to everything else (violence, mature themes, gambling, contests, medical treatment info). Expect a 13+ rating.

**App Privacy ("nutrition label")** — Data used to track you: none. Data linked to you:

| Apple category | What Zomi stores | Purpose |
| --- | --- | --- |
| Contact Info: Name | Display name | App functionality |
| Contact Info: Email Address | Sign-in email | App functionality |
| User Content: Photos or Videos | Post photos (instructors) | App functionality |
| User Content: Emails or Text Messages | In-app messages | App functionality |
| User Content: Other User Content | Posts, classes, client notes, class updates | App functionality |
| Identifiers: User ID | Account ID | App functionality |
| Other Data | Birthday month and day (optional, only if shared), neighborhood, social handles, classes followed, booked and attended | App functionality |

No analytics, advertising or third-party tracking SDKs are in the app. If analytics or crash reporting is added later, update this.

**Sign in for App Review** (App Review Information → Sign-in required: Yes)
- Instructor test account: maya@alltrainers.test
- Client test account: kendall@alltrainers.test
- Password: the shared test password in `supabase/seed.sql` (paste it into App Store Connect, never into the listing)

Notes for the reviewer:
> Zomi lets fitness clients follow their favorite instructors across studios. Sign in as the client account to see Home (classes from followed instructors and their posts), Discover and Messages. Sign in as the instructor account to see My Week, Add class, posting, Followers and the QR code. "Book it" links open each studio's own booking website; Zomi does not sell classes or take payments. Accounts can be deleted in Me → Privacy → Delete my account. Users can report posts and messages and block other users from the ⋯ menu on a post, profile or chat.

(The last sentence is true only once reporting and blocking are built. See "Before you submit".)

**Screenshots**: `docs/store-screenshots/ios-6.9/` (1320 × 2868). Apple scales these down for smaller iPhones. iPad is turned off, so no iPad screenshots are needed.

## Google Play

**App name** (30 max): Zomi Fit

**Short description** (80 max, 77 used)
Follow your favorite fitness instructors at every studio. Never miss a class.

**Full description** (4000 max): use the Apple description above.

**App category**: Health & Fitness. **Tags**: Fitness, Yoga, Pilates, Workout tracker (pick up to five that the console offers).

**Contact details**: support email (required), website https://zomifit.com, privacy policy https://zomifit.com/privacy.

**Content rating questionnaire (IARC)**: category "Social or communication". Users can interact or exchange content: Yes. Shares the user's location: No (Zomi only stores a neighborhood the person types in). Digital purchases: No. Expect Teen.

**Target audience**: 18 and over (choose 16+ at the youngest). Choosing under 13 brings in the Families policy, which Zomi isn't built for.

**Data safety form**

| Data type | Collected | Shared | Purpose | Optional |
| --- | --- | --- | --- | --- |
| Personal info: Name | Yes | No | App functionality, Account management | No |
| Personal info: Email address | Yes | No | Account management | No |
| Personal info: User IDs | Yes | No | App functionality, Account management | No |
| Personal info: Other info (birthday month and day, neighborhood, social handles) | Yes | No | App functionality | Yes |
| Photos and videos: Photos | Yes | No | App functionality | Yes |
| Messages: Other in-app messages | Yes | No | App functionality | Yes |
| App activity: Other user-generated content (posts, classes, notes) | Yes | No | App functionality | Yes |
| App activity: Other actions (follows, Booked it, classes attended) | Yes | No | App functionality | Yes |

Also answer: data is encrypted in transit, Yes. People can ask for their data to be deleted, Yes (in the app: Me → Privacy → Delete my account; also by emailing support). Account deletion URL: https://zomifit.com/delete-account (Google requires a web page explaining how to delete an account, even when it can be done in the app).

**Graphics**
- App icon 512 × 512: `docs/store-screenshots/play-icon-512.png`
- Feature graphic 1024 × 500: `docs/store-screenshots/play-feature-graphic.png`
- Phone screenshots: `docs/store-screenshots/android-phone/` (1080 × 2340)

**App access** (Policy → App content): "All or some functionality is restricted", with the same two test accounts and the reviewer note above.

## Before you submit

1. **Reporting and blocking (Apple guideline 1.2, Google's UGC policy).** Zomi has posts, photos and messages from users, so both stores require a way to report objectionable content, to block another user, and a promise in the Terms that you remove it within 24 hours. This isn't built yet. It is the one feature most likely to get the first submission rejected.
2. **Public privacy policy, support and account deletion pages** on zomifit.com, with the placeholders in the Privacy Policy and Terms filled in (entity name, support and privacy emails).
3. **Developer accounts in the company's name.** Apple needs a D-U-N-S number for an organization account, which can take a week or two. Google Play organization accounts skip the 12-tester, 14-day closed test that new personal accounts must run before going public.
4. **Test on real phones** with a preview build (`eas build --profile preview`): photo picker, sharing your QR link, links opening Instagram and Spotify, sign in and sign out, delete account.
