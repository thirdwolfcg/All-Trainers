/**
 * App state for the clickable build. Everything lives in memory and resets
 * on reload. When Supabase is connected, each action here becomes a query
 * against the tables in supabase/migrations/0001_initial.sql.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
  studios,
} from '@/data/sample';

import { useAuth } from './auth';
import type { AttendanceEntry, ClassSession, Client, Conversation, Instructor, Post, Role, Studio, SubRequest } from './types';

type Store = {
  role: Role;
  setRole: (r: Role) => void;
  meId: string;

  instructors: Instructor[];
  studios: Studio[];
  classes: ClassSession[];
  posts: Post[];
  clients: Client[]; // the signed-in instructor's client list
  attendance: AttendanceEntry[];
  conversations: Conversation[];

  instructorByHandle: (handle: string) => Instructor | undefined;
  updateInstructor: (id: string, patch: Partial<Omit<Instructor, 'id' | 'isFounding'>>) => void;
  /** Someone scanned an instructor's QR code before signing in: follow them once inside. */
  pendingFollow: string | null;
  setPendingFollow: (instructorId: string | null) => void;
  /** Set by the instructor landing page so onboarding starts on "I teach classes". */
  pendingRole: Role | null;
  setPendingRole: (r: Role | null) => void;

  following: Set<string>;
  premium: Set<string>; // instructors the client has premium with
  toggleFollow: (instructorId: string) => void;

  attended: (classId: string) => boolean;
  toggleAttended: (session: ClassSession) => void;

  addClass: (c: Omit<ClassSession, 'id' | 'status'>) => void;
  addPost: (p: Omit<Post, 'id' | 'createdAt' | 'instructorId'>) => void;
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
  const [classes, setClasses] = useState(() => buildClasses(now));
  const [posts, setPosts] = useState(() => buildPosts(now));
  const [clients, setClients] = useState(() => buildMayaClients(now));
  const [attendance, setAttendance] = useState(() => buildAttendance(now));
  const [conversations, setConversations] = useState(() => buildConversations(now));
  const [following, setFollowing] = useState(() => new Set(['maya', 'jordan', 'priya']));
  const [premium, setPremium] = useState(() => new Set(['maya']));
  const [subRequests, setSubRequests] = useState(() => buildSubRequests(now));
  const [pendingFollow, setPendingFollow] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const meId = role === 'client' ? ME_CLIENT_ID : ME_INSTRUCTOR_ID;

  // A real account starts fresh: no sample follows, classes, clients or messages
  // tied to "me". Other sample instructors stay so there is someone to discover.
  // (Until screens read live data, "me" keeps its sample id internally.)
  const { session, profile, demo } = useAuth();
  const liveKey = !demo && session && profile ? `${profile.id}:${profile.role}` : null;
  useEffect(() => {
    if (!liveKey || !profile) return;
    const me = profile.role === 'client' ? ME_CLIENT_ID : ME_INSTRUCTOR_ID;
    const notMine = <T extends Record<string, unknown>>(rows: T[], keys: (keyof T)[]) => rows.filter((r) => !keys.some((k) => r[k] === me));
    setFollowing(new Set());
    setPremium(new Set());
    setAttendance((prev) => notMine(prev, ['clientId', 'instructorId']));
    setConversations((prev) => notMine(prev, ['clientId', 'instructorId']));
    if (profile.role === 'instructor') {
      setInstructors((prev) =>
        prev.map((i) =>
          i.id === me
            ? {
                ...i,
                name: profile.display_name,
                handle: profile.handle ?? i.handle,
                bio: profile.bio ?? '',
                styles: profile.styles ?? [],
                neighborhood: profile.neighborhood ?? '',
                instagram: profile.instagram_handle ?? undefined,
                tiktok: profile.tiktok_handle ?? undefined,
                isFounding: true,
              }
            : i,
        ),
      );
      setClasses((prev) => prev.filter((c) => c.instructorId !== me && c.subInstructorId !== me));
      setPosts((prev) => prev.filter((p) => p.instructorId !== me));
      setClients([]);
      setSubRequests((prev) => notMine(prev, ['fromInstructorId', 'toInstructorId']));
    }
    // Only when a different real account signs in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKey]);

  const store = useMemo<Store>(() => {
    const instructorById = new Map(instructors.map((i) => [i.id, i]));
    const studioById = new Map(studios.map((s) => [s.id, s]));

    return {
      role,
      setRole,
      meId,
      instructors,
      studios,
      classes,
      updateInstructor(id, patch) {
        setInstructors((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      },
      instructorByHandle: (handle) => instructors.find((i) => i.handle.toLowerCase() === handle.replace(/^@/, '').toLowerCase()),
      pendingFollow,
      pendingRole,
      setPendingRole,
      setPendingFollow,
      posts,
      clients,
      attendance,
      conversations,
      following,
      premium,

      toggleFollow(instructorId) {
        setFollowing((prev) => {
          const next = new Set(prev);
          if (next.has(instructorId)) {
            next.delete(instructorId);
          } else {
            next.add(instructorId);
            // A follow adds the client to the instructor's list automatically.
            if (instructorId === ME_INSTRUCTOR_ID) {
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

      attended(classId) {
        return attendance.some((a) => a.classId === classId && a.clientId === ME_CLIENT_ID);
      },

      toggleAttended(session) {
        setAttendance((prev) => {
          const existing = prev.find((a) => a.classId === session.id && a.clientId === ME_CLIENT_ID);
          if (existing) return prev.filter((a) => a !== existing);
          return [
            ...prev,
            {
              id: `a${Date.now()}`,
              clientId: ME_CLIENT_ID,
              instructorId: session.instructorId,
              studioId: session.studioId,
              classId: session.id,
              date: session.startsAt,
              source: 'client',
            },
          ];
        });
      },

      addClass(c) {
        setClasses((prev) =>
          [...prev, { ...c, id: `c${Date.now()}`, status: 'scheduled' as const }].sort(
            (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          ),
        );
      },

      addPost(p) {
        setPosts((prev) => [{ ...p, id: `p${Date.now()}`, instructorId: meId, createdAt: new Date().toISOString() }, ...prev]);
      },

      deletePost(id) {
        const found = posts.find((x) => x.id === id);
        setPosts((prev) => prev.filter((x) => x.id !== id));
        return found;
      },

      restorePost(p) {
        setPosts((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]));
      },

      setClassStatus(id, status) {
        setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
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
        setSubRequests((prev) =>
          prev.some((r) => r.classId === classId && r.toInstructorId === toInstructorId && r.status === 'pending')
            ? prev
            : [
                ...prev,
                {
                  id: `sr${Date.now()}`,
                  classId,
                  fromInstructorId: session.instructorId,
                  toInstructorId,
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                },
              ],
        );
        setClasses((prev) => prev.map((c) => (c.id === classId && c.status === 'scheduled' ? { ...c, status: 'sub_needed' } : c)));
        return {};
      },

      respondToSub(requestId, accept) {
        const req = subRequests.find((r) => r.id === requestId);
        if (!req) return;
        const cls = classes.find((c) => c.id === req.classId);
        if (accept && cls && cls.status !== 'scheduled' && cls.status !== 'sub_needed') return;
        setSubRequests((prev) =>
          prev.map((r) => {
            if (r.id === requestId) return { ...r, status: accept ? 'accepted' : 'declined' };
            // Once someone says yes, the other asks for that class close out.
            if (accept && r.classId === req.classId && r.status === 'pending') return { ...r, status: 'cancelled' };
            return r;
          }),
        );
        if (accept) {
          setClasses((prev) =>
            prev.map((c) => (c.id === req.classId ? { ...c, status: 'subbed', subInstructorId: req.toInstructorId, note: undefined } : c)),
          );
        }
      },

      undoSubDecline(requestId) {
        const req = subRequests.find((r) => r.id === requestId);
        const cls = req ? classes.find((c) => c.id === req.classId) : undefined;
        if (!req || req.status !== 'declined' || cls?.status !== 'sub_needed') return;
        setSubRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: 'pending' } : r)));
      },

      withdrawSub(classId) {
        setSubRequests((prev) => prev.map((r) => (r.classId === classId && r.status === 'pending' ? { ...r, status: 'cancelled' } : r)));
        setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, status: 'scheduled', note: undefined } : c)));
      },

      conversationWith(instructorId, clientId) {
        const found = conversations.find((c) => c.instructorId === instructorId && c.clientId === clientId);
        if (found) return found;
        const fresh: Conversation = { id: `conv-${instructorId}-${clientId}`, instructorId, clientId, messages: [] };
        setConversations((prev) => (prev.some((c) => c.id === fresh.id) ? prev : [...prev, fresh]));
        return fresh;
      },

      sendMessage(conversationId, body) {
        const text = body.trim();
        if (!text) return;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, { id: `m${Date.now()}`, senderId: meId, body: text, sentAt: new Date().toISOString() }],
                }
              : c,
          ),
        );
      },

      instructor: (id) => instructorById.get(id),
      studio: (id) => studioById.get(id),
    };
  }, [role, meId, instructors, classes, posts, clients, attendance, conversations, following, premium, subRequests, pendingFollow, pendingRole]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
