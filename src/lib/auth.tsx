import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { friendlyError, supabase } from './supabase';
import type { Role, Style } from './types';

export type Profile = {
  id: string;
  role: Role;
  display_name: string;
  handle: string | null;
  bio: string | null;
  styles: Style[];
  neighborhood: string | null;
};

export type NewProfile = {
  role: Role;
  displayName: string;
  handle?: string;
  bio?: string;
  styles?: Style[];
  neighborhood?: string;
  birthday?: { month: number; day: number };
};

type Result = { error?: string; needsConfirmation?: boolean };

type Auth = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  demo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  createProfile: (p: NewProfile) => Promise<Result>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, role, display_name, handle, bio, styles, neighborhood')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Load outside the callback to avoid Supabase's auth lock.
      setTimeout(() => loadProfile(next?.user.id), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<Auth>(
    () => ({
      loading,
      session,
      profile,
      demo,
      enterDemo: () => setDemo(true),
      exitDemo: () => setDemo(false),

      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) return { error: friendlyError(error.message) };
        return { needsConfirmation: !data.session };
      },

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return error ? { error: friendlyError(error.message) } : {};
      },

      async signOut() {
        await supabase.auth.signOut();
        setProfile(null);
      },

      async createProfile(p) {
        const userId = session?.user.id;
        if (!userId) return { error: 'Please sign in again.' };

        const { error } = await supabase.from('profiles').insert({
          id: userId,
          role: p.role,
          display_name: p.displayName.trim(),
          handle: p.handle?.trim().toLowerCase() || null,
          bio: p.bio?.trim() || null,
          styles: p.styles ?? [],
          neighborhood: p.neighborhood?.trim() || null,
        });
        if (error) return { error: friendlyError(error.message) };

        if (p.birthday) {
          const { error: bdayError } = await supabase.from('profile_private').upsert({
            user_id: userId,
            birthday_month: p.birthday.month,
            birthday_day: p.birthday.day,
          });
          if (bdayError) return { error: friendlyError(bdayError.message) };
        }

        await loadProfile(userId);
        return {};
      },
    }),
    [loading, session, profile, demo, loadProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const a = useContext(Ctx);
  if (!a) throw new Error('useAuth must be used inside AuthProvider');
  return a;
}
