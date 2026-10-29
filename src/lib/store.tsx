/**
 * App state for the clickable build. Everything lives in memory and resets
 * on reload. When Supabase is connected, each action here becomes a query
 * against the tables in supabase/migrations/0001_initial.sql.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  ME_CLIENT_ID,
  ME_INSTRUCTOR_ID,
  buildAttendance,
  buildClasses,
  buildConversations,
  buildMayaClients,
  buildPosts,
  instructors,
  studios,
} from '@/data/sample';

import type { AttendanceEntry, ClassSession, Client, Conversation, Instructor, Post, Role, Studio } from './types';

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

  following: Set<string>;
  premium: Set<string>; // instructors the client has premium with
  toggleFollow: (instructorId: string) => void;

  attended: (classId: string) => boolean;
  toggleAttended: (session: ClassSession) => void;

  addClass: (c: Omit<ClassSession, 'id' | 'status'>) => void;
  setClassStatus: (id: string, status: ClassSession['status']) => void;

  conversationWith: (instructorId: string, clientId: string) => Conversation;
  sendMessage: (conversationId: string, body: string) => void;

  instructor: (id: string) => Instructor | undefined;
  studio: (id: string) => Studio | undefined;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [now] = useState(() => new Date());
  const [role, setRole] = useState<Role>('client');
  const [classes, setClasses] = useState(() => buildClasses(now));
  const [posts] = useState(() => buildPosts(now));
  const [clients, setClients] = useState(() => buildMayaClients(now));
  const [attendance, setAttendance] = useState(() => buildAttendance(now));
  const [conversations, setConversations] = useState(() => buildConversations(now));
  const [following, setFollowing] = useState(() => new Set(['maya', 'jordan', 'priya']));
  const [premium] = useState(() => new Set(['maya']));

  const meId = role === 'client' ? ME_CLIENT_ID : ME_INSTRUCTOR_ID;

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

      setClassStatus(id, status) {
        setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
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
  }, [role, meId, classes, posts, clients, attendance, conversations, following, premium]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
