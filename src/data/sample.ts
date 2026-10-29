/**
 * Sample data so the app can be clicked through before Supabase is connected.
 * Every person and studio here is made up. Dates are generated relative to
 * today so the schedule always looks current.
 */
import { addDays, startOfDay } from '@/lib/dates';
import type {
  AttendanceEntry,
  Birthday,
  ClassSession,
  Client,
  Conversation,
  Instructor,
  Post,
  Studio,
  Style,
} from '@/lib/types';

export const ME_CLIENT_ID = 'me';
export const ME_INSTRUCTOR_ID = 'maya';

export const studios: Studio[] = [
  { id: 'lumen', name: 'Lumen Reformer', neighborhood: 'LoHi', address: '1550 Boulder St', bookingUrl: 'https://example.com/lumen' },
  { id: 'spoke', name: 'Spoke & Spin', neighborhood: 'RiNo', address: '3200 Larimer St', bookingUrl: 'https://example.com/spoke' },
  { id: 'still', name: 'Stillwater Yoga', neighborhood: 'Wash Park', address: '700 S Downing St', bookingUrl: 'https://example.com/still' },
  { id: 'forge', name: 'The Forge', neighborhood: 'Highlands', address: '3400 W 32nd Ave', bookingUrl: 'https://example.com/forge' },
  { id: 'pointe', name: 'Pointe Barre Co.', neighborhood: 'Cherry Creek', address: '250 Columbine St', bookingUrl: 'https://example.com/pointe' },
];

export const instructors: Instructor[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    handle: 'mayamoves',
    bio: 'Reformer girlie with a soft spot for slow burns and loud playlists. Teaching all over Denver, come find me.',
    styles: ['pilates', 'barre'],
    neighborhood: 'LoHi',
    isFounding: true,
  },
  {
    id: 'jordan',
    name: 'Jordan Ellis',
    handle: 'jordanrides',
    bio: 'Rhythm rides, 2000s throwbacks and zero judgment. If you leave dry, I did it wrong.',
    styles: ['cycle', 'hiit'],
    neighborhood: 'RiNo',
    isFounding: true,
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    handle: 'priya.flows',
    bio: 'Vinyasa and yin. Breath first, shapes second. Ask me about the Sunday candlelight flow.',
    styles: ['yoga'],
    neighborhood: 'Wash Park',
    isFounding: true,
  },
  {
    id: 'theo',
    name: 'Theo Marquez',
    handle: 'theolifts',
    bio: 'Strength coach. Form over ego, always. Privates available for lifting basics.',
    styles: ['strength', 'hiit'],
    neighborhood: 'Highlands',
    isFounding: false,
  },
  {
    id: 'sasha',
    name: 'Sasha Bloom',
    handle: 'sashabarre',
    bio: 'Barre and sculpt. Tiny movements, big shakes. Former dancer, current pop music evangelist.',
    styles: ['barre', 'dance'],
    neighborhood: 'Cherry Creek',
    isFounding: false,
  },
];

type Slot = { instructorId: string; studioId: string; title: string; style: Style; dayOffset: number; hour: number; minute?: number; duration?: number; status?: ClassSession['status']; note?: string };

const slots: Slot[] = [
  { instructorId: 'maya', studioId: 'lumen', title: 'Reformer Flow', style: 'pilates', dayOffset: 0, hour: 17, minute: 30 },
  { instructorId: 'maya', studioId: 'pointe', title: 'Barre Burn', style: 'barre', dayOffset: 1, hour: 6 },
  { instructorId: 'maya', studioId: 'lumen', title: 'Jumpboard Cardio', style: 'pilates', dayOffset: 2, hour: 12, duration: 45 },
  { instructorId: 'maya', studioId: 'lumen', title: 'Reformer Flow', style: 'pilates', dayOffset: 4, hour: 18, status: 'sub_needed', note: 'Looking for a sub, may change' },
  { instructorId: 'maya', studioId: 'pointe', title: 'Sculpt + Stretch', style: 'barre', dayOffset: 5, hour: 9, minute: 30 },
  { instructorId: 'jordan', studioId: 'spoke', title: 'Throwback Ride', style: 'cycle', dayOffset: 0, hour: 18, duration: 45 },
  { instructorId: 'jordan', studioId: 'spoke', title: 'Rhythm 45', style: 'cycle', dayOffset: 2, hour: 6, duration: 45 },
  { instructorId: 'jordan', studioId: 'forge', title: 'HIIT Express', style: 'hiit', dayOffset: 3, hour: 12, duration: 30 },
  { instructorId: 'jordan', studioId: 'spoke', title: 'Pop Diva Ride', style: 'cycle', dayOffset: 5, hour: 10, duration: 45, status: 'cancelled', note: 'Cancelled, see you next week' },
  { instructorId: 'priya', studioId: 'still', title: 'Vinyasa 60', style: 'yoga', dayOffset: 1, hour: 7 },
  { instructorId: 'priya', studioId: 'still', title: 'Yin + Sound', style: 'yoga', dayOffset: 3, hour: 19, minute: 30, duration: 75 },
  { instructorId: 'priya', studioId: 'still', title: 'Candlelight Flow', style: 'yoga', dayOffset: 6, hour: 18 },
  { instructorId: 'theo', studioId: 'forge', title: 'Lift Lab', style: 'strength', dayOffset: 1, hour: 17, minute: 30 },
  { instructorId: 'theo', studioId: 'forge', title: 'Full Body Strength', style: 'strength', dayOffset: 4, hour: 6, minute: 30 },
  { instructorId: 'sasha', studioId: 'pointe', title: 'Barre Classic', style: 'barre', dayOffset: 2, hour: 9 },
  { instructorId: 'sasha', studioId: 'pointe', title: 'Pop Sculpt', style: 'dance', dayOffset: 4, hour: 12, duration: 45 },
];

export function buildClasses(now = new Date()): ClassSession[] {
  const today = startOfDay(now);
  return slots.map((s, i) => {
    const d = addDays(today, s.dayOffset);
    d.setHours(s.hour, s.minute ?? 0, 0, 0);
    return {
      id: `c${i + 1}`,
      instructorId: s.instructorId,
      studioId: s.studioId,
      title: s.title,
      style: s.style,
      startsAt: d.toISOString(),
      durationMin: s.duration ?? 50,
      status: s.status ?? 'scheduled',
      note: s.note,
    };
  });
}

function daysAgo(n: number, now = new Date()) {
  return addDays(startOfDay(now), -n).toISOString();
}

export function buildPosts(now = new Date()): Post[] {
  const hrs = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();
  return [
    { id: 'p1', instructorId: 'maya', kind: 'note', title: 'Schedule drop', body: 'New Wednesday jumpboard class at Lumen starting this week. 45 minutes, bring water and your best attitude.', isPremium: false, createdAt: hrs(3) },
    { id: 'p2', instructorId: 'maya', kind: 'recipe', title: 'Post-reformer protein oats', body: 'Rolled oats, a scoop of vanilla protein, cinnamon, almond milk, top with berries. Five minutes, no excuses.', isPremium: false, createdAt: hrs(26) },
    { id: 'p3', instructorId: 'maya', kind: 'playlist', title: "This week's class playlist", body: 'All the songs from Reformer Flow, in order.', linkUrl: 'https://open.spotify.com', isPremium: true, createdAt: hrs(30) },
    { id: 'p4', instructorId: 'maya', kind: 'note', title: 'Form check: footwork', body: 'A 3 minute breakdown of footwork on the reformer, plus the cue I give when your knees start drifting.', isPremium: true, createdAt: hrs(72) },
    { id: 'p5', instructorId: 'jordan', kind: 'playlist', title: 'Throwback Ride setlist', body: "Britney, Usher, a little Nelly. You know what it is.", linkUrl: 'https://open.spotify.com', isPremium: true, createdAt: hrs(5) },
    { id: 'p6', instructorId: 'jordan', kind: 'note', title: 'Saturday ride is off', body: 'Pop Diva Ride is cancelled this week. Back next Saturday with double the key changes.', isPremium: false, createdAt: hrs(20) },
    { id: 'p7', instructorId: 'priya', kind: 'recipe', title: 'Golden milk for yin nights', body: 'Warm oat milk, turmeric, ginger, black pepper, a drizzle of honey.', isPremium: false, createdAt: hrs(40) },
  ];
}

function bdayIn(days: number, now = new Date()): Birthday {
  const d = addDays(now, days);
  return { month: d.getMonth() + 1, day: d.getDate() };
}

export function buildMayaClients(now = new Date()): Client[] {
  return [
    { id: 'me', name: 'Lo S.', birthday: bdayIn(48, now), followedAt: daysAgo(60, now), isPremium: true, preferences: 'Loves the jumpboard. Ask about her left shoulder.' },
    { id: 'k1', name: 'Kendall Brooks', birthday: bdayIn(2, now), followedAt: daysAgo(120, now), isPremium: true, preferences: 'Prefers front row, right side.' },
    { id: 'k2', name: 'Marcus Ortiz', birthday: bdayIn(0, now), followedAt: daysAgo(30, now), isPremium: false },
    { id: 'k3', name: 'Tess Nguyen', birthday: bdayIn(19, now), followedAt: daysAgo(200, now), isPremium: false, preferences: 'Training for a half marathon.' },
    { id: 'k4', name: 'Dev Patel', birthday: bdayIn(6, now), followedAt: daysAgo(14, now), isPremium: false },
    { id: 'k5', name: 'Riley Kim', birthday: bdayIn(140, now), followedAt: daysAgo(90, now), isPremium: true },
    { id: 'k6', name: 'Amara Okafor', followedAt: daysAgo(5, now), isPremium: false },
    { id: 'k7', name: 'Jules Romero', birthday: bdayIn(220, now), followedAt: daysAgo(300, now), isPremium: false },
  ];
}

/** Past classes for the tracker. */
export function buildAttendance(now = new Date()): AttendanceEntry[] {
  const rows: [string, string, string, number][] = [
    // clientId, instructorId, studioId, daysAgo
    ['me', 'maya', 'lumen', 2], ['me', 'maya', 'lumen', 5], ['me', 'maya', 'pointe', 9], ['me', 'maya', 'lumen', 12],
    ['me', 'maya', 'lumen', 16], ['me', 'maya', 'pointe', 23], ['me', 'maya', 'lumen', 30], ['me', 'maya', 'lumen', 37],
    ['me', 'jordan', 'spoke', 3], ['me', 'jordan', 'spoke', 10], ['me', 'jordan', 'forge', 17], ['me', 'jordan', 'spoke', 24],
    ['me', 'priya', 'still', 7], ['me', 'priya', 'still', 21],
    ['k1', 'maya', 'lumen', 1], ['k1', 'maya', 'lumen', 4], ['k1', 'maya', 'pointe', 8], ['k1', 'maya', 'lumen', 11], ['k1', 'maya', 'lumen', 15],
    ['k1', 'maya', 'lumen', 18], ['k1', 'maya', 'lumen', 22], ['k1', 'maya', 'lumen', 29], ['k1', 'maya', 'pointe', 36], ['k1', 'maya', 'lumen', 43],
    ['k1', 'maya', 'lumen', 50], ['k1', 'maya', 'lumen', 57],
    ['k2', 'maya', 'lumen', 6], ['k2', 'maya', 'lumen', 13],
    ['k3', 'maya', 'pointe', 3], ['k3', 'maya', 'pointe', 10], ['k3', 'maya', 'lumen', 31], ['k3', 'maya', 'lumen', 45], ['k3', 'maya', 'lumen', 64],
    ['k4', 'maya', 'lumen', 2],
    ['k5', 'maya', 'lumen', 9], ['k5', 'maya', 'lumen', 16], ['k5', 'maya', 'lumen', 23],
    ['k7', 'maya', 'pointe', 75],
  ];
  return rows.map(([clientId, instructorId, studioId, ago], i) => ({
    id: `a${i + 1}`,
    clientId,
    instructorId,
    studioId,
    date: daysAgo(ago, now),
    source: 'client' as const,
  }));
}

export function buildConversations(now = new Date()): Conversation[] {
  const mins = (n: number) => new Date(now.getTime() - n * 60000).toISOString();
  return [
    {
      id: 'conv-maya-me',
      instructorId: 'maya',
      clientId: 'me',
      messages: [
        { id: 'm1', senderId: 'me', body: 'Is the Wednesday jumpboard class ok for beginners?', sentAt: mins(180) },
        { id: 'm2', senderId: 'maya', body: "100%. I'll give you modifications, just grab a spot near the front so I can see you.", sentAt: mins(150) },
        { id: 'm3', senderId: 'me', body: 'Perfect, see you there!', sentAt: mins(140) },
      ],
    },
    {
      id: 'conv-jordan-me',
      instructorId: 'jordan',
      clientId: 'me',
      messages: [{ id: 'm4', senderId: 'jordan', body: 'Missed you Thursday! Throwback Ride is back tonight.', sentAt: mins(60 * 26) }],
    },
    {
      id: 'conv-maya-k1',
      instructorId: 'maya',
      clientId: 'k1',
      messages: [{ id: 'm5', senderId: 'k1', body: 'Can I book a private next week?', sentAt: mins(45) }],
    },
  ];
}
