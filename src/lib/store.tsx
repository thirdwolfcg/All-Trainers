/**
 * App state. Preview mode runs on sample data in memory. Signed-in accounts
 * load their real data from Supabase (src/lib/live.ts) and every action is
 * saved there too: the screen updates right away, the write happens in the
 * background, and if it fails we say so and reload what the database has.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import {
  ME_CLIENT_ID,
  ME_INSTRUCTOR_ID,
  buildAttendance,
  buildClasses,
  buildConversations,
  buildMayaClients,
  buildPosts,
  buildSubRequests,
  instructors as sampleInstructors,
  studios as sampleStudios,
} from '@/data/sample';

import { useAuth } from './auth';
import { db, loadLive, uuid, type SeriesInfo } from './live';
import { friendlyError as friendly } from './supabase';
import type { AttendanceEntry, ClassSession, ClassUpdate, Client, Conversation, Instructor, Post, Role, SpotOffer, Studio, SubRequest } from './types';

type Store = {
  role: Role;
  setRole: (r: Role) => void;
  meId: string;

  instructors: Instructor[];
  studios: Studio[];
  /** True for a signed-in account (real data), false in preview mode. */
  live: boolean;
  /** Live accounts: true while the first load is running. */
  loading: boolean;
  /** Live accounts: the last save that failed, for a toast. Cleared by clearSyncError. */
  syncError: string | null;
  clearSyncError: () => void;
  /** Live accounts: fetch everything again. */
  refresh: () => Promise<void>;
  /** Anyone's display name by id (clients included), when we have it. */
  nameOf: (id: string) => string | undefined;
  /** Adds a studio the instructor teaches at and returns its id. */
  addStudio: (s: { name: string; neighborhood: string }) => string;
  classes: ClassSession[];
  posts: Post[];
  clients: Client[]; // the signed-in instructor's client list
  attendance: AttendanceEntry[];
  conversations: Conversation[];

  instructorByHandle: (handle: string) => Instructor | undefined;
  updateInstructor: (id: string, patch: Partial<Omit<Instructor, 'id' | 'isFounding'>>) => void;
  updateClient: (id: string, patch: Partial<Omit<Client, 'id'>>) => void;
  /** Someone scanned an instructor's QR code before signing in: follow them once inside. */
  pendingFollow: string | null;
  setPendingFollow: (instructorId: string | null) => void;
  /** Set by the instructor landing page so onboarding starts on "I teach classes". */
  pendingRole: Role | null;
  setPendingRole: (r: Role | null) => void;
  /** One-time tips (and nudges) the person has closed. */
  dismissedTips: Set<string>;
  dismissTip: (id: string) => void;
  /** Tips show on the real screens after onboarding or entering preview, until each is dismissed. */
  /** Set when someone finishes sign up, so Home opens the welcome tour once. */
  tourPending: boolean;
  setTourPending: (v: boolean) => void;
  tipsOn: boolean;
  showTips: () => void;

  following: Set<string>;
  premium: Set<string>; // instructors the client has premium with
  toggleFollow: (instructorId: string) => void;

  /** Classes the client says they're booked into (they book outside the app). */
  booked: Set<string>;
  toggleBooked: (classId: string) => void;
  /** Client ids booked into a class through the app (the instructor's view). */
  bookersOf: (classId: string) => string[];
  classUpdates: ClassUpdate[];
  /** Instructor: send an update to everyone booked. Also lands in each client's Messages. */
  postClassUpdate: (classId: string, body: string) => number;
  /** Classes the client is on the waitlist for (in the app). */
  waitlist: Set<string>;
  toggleWaitlist: (classId: string) => void;
  spotOffers: SpotOffer[];
  offerSpot: (classId: string, fromName: string) => void;
  cancelOffer: (offerId: string) => void;
  claimSpot: (offerId: string) => void;
  attended: (classId: string) => boolean;
  toggleAttended: (session: ClassSession) => void;

  addClass: (c: Omit<ClassSession, 'id' | 'status'>) => void;
  /** Add many classes at once (a repeating series). Pass `series` so it's saved as one series. */
  addClasses: (cs: Omit<ClassSession, 'id' | 'status' | 'seriesId'>[], series?: SeriesInfo) => void;
  /** Change a class the instructor owns. */
  updateClass: (id: string, patch: Partial<Omit<ClassSession, 'id' | 'instructorId'>>) => void;
  /** Delete a class, or with `wholeSeries` this one and every later class in its series. Returns how many were removed. */
  deleteClass: (id: string, wholeSeries?: boolean) => number;
  /** `mediaPath` is the uploaded photo's path in storage, for live accounts. */
  addPost: (p: Omit<Post, 'id' | 'createdAt' | 'instructorId'>, mediaPath?: string) => void;
  deletePost: (id: string) => Post | undefined;
  restorePost: (p: Post) => void;
  setClassStatus: (id: string, status: ClassSession['status']) => void;

  subRequests: SubRequest[];
  /** Instructors who teach at a studio (from their schedules), never including `excludeId`. */
  teachersAt: (studioId: string, excludeId?: string) => Instructor[];
  /** Ask another instructor to cover a class. Only allowed when they teach at the same studio. */
  requestSub: (classId: string, toInstructorId: string) => { error?: string };
  respondToSub: (requestId: string, accept: boolean) => void;
  /** Take back a "can't": the ask goes back to waiting, as long as the class still needs a sub. */
  undoSubDecline: (requestId: string) => void;
  /** Stop looking for a sub: cancels pending asks and puts the class back to normal. */
  withdrawSub: (classId: string) => void;

  conversationWith: (instructorId: string, clientId: string) => Conversation;
  sendMessage: (conversationId: string, body: string) => void;

  instructor: (id: string) => Instructor | undefined;
  studio: (id: string) => Studio | undefined;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [now] = useState(() => new Date());
  const [role, setRole] = useState<Role>('client');
  const [instructors, setInstructors] = useState(sampleInstructors);
  const [studios, setStudios] = useState<Studio[]>(sampleStudios);
  const [classes, setClasses] = useState(() => buildClasses(now));
  const [posts, setPosts] = useState(() => buildPosts(now));
  const [clients, setClients] = useState(() => buildMayaClients(now));
  const [attendance, setAttendance] = useState(() => buildAttendance(now));
  const [conversations, setConversations] = useState(() => buildConversations(now));
  const [following, setFollowing] = useState(() => new Set(['maya', 'jordan', 'priya']));
  const [premium, setPremium] = useState(() => new Set(['maya']));
  // Demo: Lo is booked into the next two upcoming classes from people she follows.
  const [booked, setBooked] = useState(() => {
    const upcoming = buildClasses(now)
      .filter((c) => ['maya', 'jordan', 'priya'].includes(c.instructorId) && c.status !== 'cancelled' && new Date(c.startsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return new Set(upcoming.filter((_, i) => i === 0 || i === 3).map((c) => c.id));
  });
  // Demo: other followers booked into Maya's classes, so her "message everyone booked" has people to reach.
  const [bookers, setBookers] = useState<Record<string, string[]>>(() => {
    const m: Record<string, string[]> = {};
    buildClasses(now)
      .filter((c) => c.instructorId === 'maya')
      .forEach((c, i) => (m[c.id] = i % 2 ? ['k1', 'k3'] : ['k1', 'k2', 'k4']));
    return m;
  });
  const [classUpdates, setClassUpdates] = useState<ClassUpdate[]>(() => {
    // Demo: Lo's first booked class has a heads-up from the instructor.
    const first = buildClasses(now)
      .filter((c) => ['maya', 'jordan', 'priya'].includes(c.instructorId) && c.status !== 'cancelled' && new Date(c.startsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    return first
      ? [
          {
            id: 'u1',
            classId: first.id,
            instructorId: first.instructorId,
            body: 'Heads up, the heat at the studio is on the fritz tonight. Bring a layer, we warm up fast!',
            createdAt: new Date(now.getTime() - 40 * 60000).toISOString(),
          },
        ]
      : [];
  });
  const [waitlist, setWaitlist] = useState<Set<string>>(() => new Set());
  const [spotOffers, setSpotOffers] = useState<SpotOffer[]>(() => {
    // Demo: Kendall can't make an upcoming Jordan class and offered her spot.
    const jordan = buildClasses(now)
      .filter((c) => c.instructorId === 'jordan' && c.status !== 'cancelled' && new Date(c.startsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    return jordan
      ? [
          {
            id: 'o1',
            classId: jordan.id,
            fromClientId: 'k1',
            fromName: 'Kendall B.',
            status: 'open',
            createdAt: new Date(now.getTime() - 25 * 60000).toISOString(),
          },
        ]
      : [];
  });
  const [subRequests, setSubRequests] = useState(() => buildSubRequests(now));
  const [pendingFollow, setPendingFollow] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [tipsOn, setTipsOn] = useState(false);
  const [tourPending, setTourPending] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => new Set());

  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  // Conversations that exist in the database (new ones are saved with their first message).
  const savedConversations = useRef<Set<string>>(new Set());

  const { session, profile, demo } = useAuth();
  const liveKey = !demo && session && profile ? `${profile.id}:${profile.role}` : null;
  const live = !!liveKey;
  const meId = live && profile ? profile.id : role === 'client' ? ME_CLIENT_ID : ME_INSTRUCTOR_ID;

  const refresh = useCallback(async () => {
    if (!profile || demo || !session) return;
    try {
      const d = await loadLive(profile.id, profile.role);
      setInstructors(d.instructors);
      setStudios(d.studios);
      setClasses(d.classes);
      setPosts(d.posts);
      setFollowing(d.following);
      setPremium(d.premium);
      setBooked(d.booked);
      setBookers(d.bookers);
      setClassUpdates(d.classUpdates);
      setWaitlist(d.waitlist);
      setSpotOffers(d.spotOffers);
      setAttendance(d.attendance);
      setClients(d.clients);
      setSubRequests(d.subRequests);
      setConversations(d.conversations);
      setNames(d.names);
      savedConversations.current = new Set(d.conversations.map((c) => c.id));
    } catch (e) {
      console.warn('Loading live data failed', e);
      setSyncError("Couldn't load your latest data. Check your connection and try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKey]);

  // A real account sees only real data: load it on sign in, and again whenever the app comes back to the front.
  useEffect(() => {
    if (!liveKey) return;
    let gone = false;
    setLoading(true);
    // Clear sample data right away so it never flashes on a real account.
    setInstructors([]);
    setStudios([]);
    setClasses([]);
    setPosts([]);
    setClients([]);
    setConversations([]);
    setSubRequests([]);
    setFollowing(new Set());
    setBooked(new Set());
    setBookers({});
    refresh().finally(() => !gone && setLoading(false));
    const sub = AppState.addEventListener('change', (st) => st === 'active' && refresh());
    return () => {
      gone = true;
      sub.remove();
    };
  }, [liveKey, refresh]);


  const store = useMemo<Store>(() => {
    const instructorById = new Map(instructors.map((i) => [i.id, i]));
    const studioById = new Map(studios.map((s) => [s.id, s]));
    const newId = (prefix: string) => (live ? uuid() : `${prefix}${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    /** Saves a message, creating the conversation first if this is its first message. */
    const sendInConversation = async (conv: Conversation, msgId: string, body: string) => {
      if (!savedConversations.current.has(conv.id)) {
        const e = await db.startConversation(conv);
        if (e) return e;
        savedConversations.current.add(conv.id);
      }
      return db.sendMessage(msgId, conv.id, meId, body);
    };
    /** Save in the background (live accounts only). On failure, tell the person and reload the truth. */
    const save = (write: () => Promise<string | undefined>, what: string) => {
      if (!live) return;
      write()
        .then((e) => {
          if (!e) return;
          console.warn(`Saving ${what} failed:`, e);
          setSyncError(`Couldn't save ${what}. ${friendly(e)}`);
          refresh();
        })
        .catch((e) => {
          console.warn(`Saving ${what} failed:`, e);
          setSyncError(`Couldn't save ${what}. Check your connection and try again.`);
          refresh();
        });
    };

    return {
      role,
      setRole,
      meId,
      live,
      loading,
      syncError,
      clearSyncError: () => setSyncError(null),
      refresh,
      nameOf: (id) => names[id] ?? instructorById.get(id)?.name ?? clients.find((c) => c.id === id)?.name,
      instructors,
      studios,
      addStudio({ name, neighborhood }) {
        const existing = studios.find((x) => x.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (existing) return existing.id;
        const id = newId('st');
        setStudios((prev) => [...prev, { id, name: name.trim(), neighborhood: neighborhood.trim(), address: '', bookingLinks: [] }]);
        save(() => db.addStudio(id, meId, name.trim(), neighborhood.trim()), 'the studio');
        return id;
      },
      classes,
      updateClient(id, patch) {
        setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        if (patch.preferences !== undefined) save(() => db.saveNotes(meId, id, patch.preferences ?? ''), 'your notes');
      },

      updateInstructor(id, patch) {
        setInstructors((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
        if (id === meId) save(() => db.updateProfile(meId, patch), 'your profile');
      },
      instructorByHandle: (handle) => instructors.find((i) => i.handle.toLowerCase() === handle.replace(/^@/, '').toLowerCase()),
      pendingFollow,
      pendingRole,
      setPendingRole,
      tourPending,
      setTourPending,
      tipsOn,
      showTips() {
        setDismissedTips((prev) => new Set([...prev].filter((t) => !t.startsWith('tip-'))));
        setTipsOn(true);
      },
      dismissedTips,
      dismissTip(id) {
        setDismissedTips((prev) => new Set(prev).add(id));
      },
      setPendingFollow,
      posts,
      clients,
      attendance,
      conversations,
      following,
      premium,

      toggleFollow(instructorId) {
        save(() => db.follow(meId, instructorId, !following.has(instructorId)), following.has(instructorId) ? 'the unfollow' : 'the follow');
        setFollowing((prev) => {
          const next = new Set(prev);
          if (next.has(instructorId)) {
            next.delete(instructorId);
          } else {
            next.add(instructorId);
            // A follow adds the client to the instructor's list automatically.
            if (!live && instructorId === ME_INSTRUCTOR_ID) {
              setClients((cs) =>
                cs.some((c) => c.id === ME_CLIENT_ID)
                  ? cs
                  : [...cs, { id: ME_CLIENT_ID, name: 'Lo S.', followedAt: new Date().toISOString(), isPremium: false }],
              );
            }
          }
          return next;
        });
      },

      booked,

      toggleBooked(classId) {
        save(() => db.book(meId, classId, !booked.has(classId)), 'your booking');
        setBookers((prev) => {
          const list = prev[classId] ?? [];
          return { ...prev, [classId]: booked.has(classId) ? list.filter((x) => x !== meId) : [...list.filter((x) => x !== meId), meId] };
        });
        setBooked((prev) => {
          const next = new Set(prev);
          if (next.has(classId)) next.delete(classId);
          else next.add(classId);
          return next;
        });
      },

      bookersOf(classId) {
        const list = bookers[classId] ?? [];
        if (live) return list;
        return booked.has(classId) && role === 'client' && !list.includes(ME_CLIENT_ID) ? [...list, ME_CLIENT_ID] : list.filter((x) => x !== ME_CLIENT_ID || booked.has(classId));
      },

      classUpdates,

      postClassUpdate(classId, body) {
        const text = body.trim();
        const cls = classes.find((c) => c.id === classId);
        if (!text || !cls) return 0;
        const people = (bookers[classId] ?? []).filter((x) => x !== meId);
        const sentAt = new Date().toISOString();
        const update = { id: newId('u'), classId, instructorId: meId, body: text, createdAt: sentAt };
        setClassUpdates((prev) => [update, ...prev]);
        save(() => db.classUpdate(update), 'the class update');
        // Each booked client also gets it as a message from the instructor. In the database a
        // conversation needs the client to follow the instructor, so live messages go to followers only.
        const followerIds = new Set(clients.map((c) => c.id));
        const messageable = live ? people.filter((id) => followerIds.has(id)) : people;
        const writes: (() => Promise<string | undefined>)[] = [];
        setConversations((prev) => {
          const next = [...prev];
          messageable.forEach((clientId) => {
            const msg = { id: newId('m'), senderId: meId, body: `${cls.title} update: ${text}`, sentAt };
            const i = next.findIndex((c) => c.instructorId === meId && c.clientId === clientId);
            if (i >= 0) {
              next[i] = { ...next[i], messages: [...next[i].messages, msg] };
              const conv = next[i];
              writes.push(() => sendInConversation(conv, msg.id, msg.body));
            } else {
              const conv = { id: newId('conv'), instructorId: meId, clientId, messages: [msg] };
              next.push(conv);
              writes.push(() => sendInConversation(conv, msg.id, msg.body));
            }
          });
          return next;
        });
        writes.forEach((w) => save(w, 'a message'));
        return people.length;
      },

      waitlist,

      toggleWaitlist(classId) {
        save(() => db.waitlist(meId, classId, !waitlist.has(classId)), 'the waitlist');
        setWaitlist((prev) => {
          const next = new Set(prev);
          if (next.has(classId)) next.delete(classId);
          else next.add(classId);
          return next;
        });
      },

      spotOffers,

      offerSpot(classId, fromName) {
        const id = newId('o');
        save(() => db.offerSpot(id, meId, classId), 'your spot offer');
        setBooked((prev) => {
          const next = new Set(prev);
          next.delete(classId);
          return next;
        });
        setSpotOffers((prev) => [
          { id, classId, fromClientId: meId, fromName, status: 'open', createdAt: new Date().toISOString() },
          ...prev,
        ]);
      },

      cancelOffer(offerId) {
        const offer = spotOffers.find((o) => o.id === offerId);
        save(() => db.cancelOffer(offerId), 'that change');
        setSpotOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'cancelled' } : o)));
        if (offer?.fromClientId === meId) setBooked((prev) => new Set(prev).add(offer.classId));
      },

      claimSpot(offerId) {
        const offer = spotOffers.find((o) => o.id === offerId && o.status === 'open');
        if (!offer) return;
        save(() => db.claimSpot(offerId, meId), 'the spot');
        setSpotOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'claimed', claimedBy: meId } : o)));
        setBooked((prev) => new Set(prev).add(offer.classId));
        setWaitlist((prev) => {
          const next = new Set(prev);
          next.delete(offer.classId);
          return next;
        });
      },

      attended(classId) {
        return attendance.some((a) => a.classId === classId && a.clientId === meId);
      },

      toggleAttended(session) {
        const existing = attendance.find((a) => a.classId === session.id && a.clientId === meId);
        if (existing) {
          setAttendance((prev) => prev.filter((a) => a.id !== existing.id));
          save(() => db.attend(existing, false), 'that change');
          return;
        }
        const entry: AttendanceEntry = {
          id: newId('a'),
          clientId: meId,
          instructorId: session.subInstructorId ?? session.instructorId,
          studioId: session.studioId,
          classId: session.id,
          date: session.startsAt,
          source: 'client',
        };
        setAttendance((prev) => [...prev, entry]);
        save(() => db.attend(entry, true), 'your class');
      },

      addClasses(cs, series) {
        const seriesId = series ? newId('s') : undefined;
        const made: ClassSession[] = cs.map((c) => ({ ...c, id: newId('c'), status: 'scheduled' as const, seriesId }));
        setClasses((prev) => [...prev, ...made].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
        save(
          () =>
            db.addClasses(made, series && seriesId && made[0] ? { ...series, id: seriesId, me: meId, studioId: made[0].studioId, title: made[0].title } : undefined),
          made.length === 1 ? 'the class' : 'your classes',
        );
      },

      addClass(c) {
        const made: ClassSession = { ...c, id: newId('c'), status: 'scheduled' };
        setClasses((prev) => [...prev, made].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
        save(() => db.addClasses([made]), 'the class');
      },

      updateClass(id, patch) {
        const current = classes.find((c) => c.id === id);
        if (!current) return;
        const next = { ...current, ...patch };
        setClasses((prev) => prev.map((c) => (c.id === id ? next : c)).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
        save(() => db.updateClass(next), 'the class');
      },

      deleteClass(id, wholeSeries) {
        const cls = classes.find((c) => c.id === id);
        if (!cls) return 0;
        const ids =
          wholeSeries && cls.seriesId ? classes.filter((c) => c.seriesId === cls.seriesId && c.startsAt >= cls.startsAt).map((c) => c.id) : [id];
        const gone = new Set(ids);
        setClasses((prev) => prev.filter((c) => !gone.has(c.id)));
        save(() => db.deleteClasses(ids), ids.length === 1 ? 'that' : 'those classes');
        return ids.length;
      },

      addPost(p, mediaPath) {
        const post: Post = { ...p, id: newId('p'), instructorId: meId, createdAt: new Date().toISOString() };
        setPosts((prev) => [post, ...prev]);
        save(() => db.addPost(post, mediaPath), 'your post');
      },

      deletePost(id) {
        const found = posts.find((x) => x.id === id);
        setPosts((prev) => prev.filter((x) => x.id !== id));
        if (found) save(() => db.deletePost(id), 'that');
        return found;
      },

      restorePost(p) {
        setPosts((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
        // The photo file stays in storage until the post is gone for good, so the same path works.
        const path = p.imageUrl?.split(`/post-photos/`)[1];
        save(() => db.addPost(p, path), 'your post');
      },

      setClassStatus(id, status) {
        setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
        save(() => db.setClassStatus(id, status), 'the class');
      },

      subRequests,

      teachersAt(studioId, excludeId) {
        const ids = new Set(classes.filter((c) => c.studioId === studioId).map((c) => c.instructorId));
        if (excludeId) ids.delete(excludeId);
        return instructors.filter((i) => ids.has(i.id));
      },

      requestSub(classId, toInstructorId) {
        const session = classes.find((c) => c.id === classId);
        if (!session) return { error: 'Class not found.' };
        // Same rule the database enforces: only instructors who teach at this studio.
        const eligible = classes.some((c) => c.studioId === session.studioId && c.instructorId === toInstructorId);
        if (!eligible || toInstructorId === session.instructorId) {
          return { error: 'You can only ask instructors who teach at this studio.' };
        }
        if (subRequests.some((r) => r.classId === classId && r.toInstructorId === toInstructorId && r.status === 'pending')) return {};
        const req: SubRequest = {
          id: newId('sr'),
          classId,
          fromInstructorId: session.instructorId,
          toInstructorId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        setSubRequests((prev) => [...prev, req]);
        save(() => db.requestSub(req), 'your sub request');
        setClasses((prev) => prev.map((c) => (c.id === classId && c.status === 'scheduled' ? { ...c, status: 'sub_needed' } : c)));
        return {};
      },

      respondToSub(requestId, accept) {
        const req = subRequests.find((r) => r.id === requestId);
        if (!req) return;
        const cls = classes.find((c) => c.id === req.classId);
        if (accept && cls && cls.status !== 'scheduled' && cls.status !== 'sub_needed') return;
        save(() => db.setSubStatus(requestId, accept ? 'accepted' : 'declined'), 'your answer');
        setSubRequests((prev) =>
          prev.map((r) => {
            if (r.id === requestId) return { ...r, status: accept ? 'accepted' : 'declined' };
            // Once someone says yes, the other asks for that class close out.
            if (accept && r.classId === req.classId && r.status === 'pending') return { ...r, status: 'cancelled' };
            return r;
          }),
        );
        if (accept) {
          setClasses((prev) => prev.map((c) => (c.id === req.classId ? { ...c, status: 'subbed', subInstructorId: req.toInstructorId, note: undefined } : c)));
        }
      },

      undoSubDecline(requestId) {
        const req = subRequests.find((r) => r.id === requestId);
        const cls = req ? classes.find((c) => c.id === req.classId) : undefined;
        if (!req || req.status !== 'declined' || cls?.status !== 'sub_needed') return;
        save(() => db.setSubStatus(requestId, 'pending'), 'that change');
        setSubRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: 'pending' } : r)));
      },

      withdrawSub(classId) {
        const pending = subRequests.filter((r) => r.classId === classId && r.status === 'pending' && r.fromInstructorId === meId);
        save(async () => {
          for (const r of pending) {
            const e = await db.setSubStatus(r.id, 'cancelled');
            if (e) return e;
          }
          return db.setClassStatus(classId, 'scheduled', true);
        }, 'that change');
        setSubRequests((prev) => prev.map((r) => (r.classId === classId && r.status === 'pending' ? { ...r, status: 'cancelled' } : r)));
        setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, status: 'scheduled', note: undefined } : c)));
      },

      conversationWith(instructorId, clientId) {
        const found = conversations.find((c) => c.instructorId === instructorId && c.clientId === clientId);
        if (found) return found;
        const fresh: Conversation = { id: live ? uuid() : `conv-${instructorId}-${clientId}`, instructorId, clientId, messages: [] };
        setConversations((prev) => (prev.some((c) => c.instructorId === instructorId && c.clientId === clientId) ? prev : [...prev, fresh]));
        return fresh;
      },

      sendMessage(conversationId, body) {
        const text = body.trim();
        if (!text) return;
        const conv = conversations.find((c) => c.id === conversationId);
        const msgId = newId('m');
        if (conv) save(() => sendInConversation(conv, msgId, text), 'your message');
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, { id: msgId, senderId: meId, body: text, sentAt: new Date().toISOString() }],
                }
              : c,
          ),
        );
      },

      instructor: (id) => instructorById.get(id),
      studio: (id) => studioById.get(id),
    };
  }, [
    role,
    meId,
    live,
    loading,
    syncError,
    refresh,
    names,
    instructors,
    studios,
    booked,
    bookers,
    classUpdates,
    waitlist,
    spotOffers,
    classes,
    posts,
    clients,
    attendance,
    conversations,
    following,
    premium,
    subRequests,
    pendingFollow,
    pendingRole,
    tipsOn,
    tourPending,
    dismissedTips,
  ]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
