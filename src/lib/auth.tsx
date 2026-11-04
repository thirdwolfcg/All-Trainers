import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { friendlyError, supabase } from './supabase';
import type { Birthday, Role, Style } from './types';

export type Profile = {
  id: string;
  role: Role;
  display_name: string;
  handle: string | null;
  bio: string | null;
  styles: Style[];
  neighborhood: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
};

export type NewProfile = {
  role: Role;
  displayName: string;
  handle?: string;
  bio?: string;
  styles?: Style[];
  neighborhood?: string;
  instagram?: string;
  tiktok?: string;
  birthday?: { month: number; day: number };
};

export type ProfileEdits = {
  displayName: string;
  handle?: string;
  bio?: string;
  styles?: Style[];
  neighborhood?: string;
  instagram?: string;
  tiktok?: string;
};

type Result = { error?: string; needsConfirmation?: boolean };

type Auth = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Month and day from profile_private, for signed-in accounts. */
  birthday: Birthday | null;
  demo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  createProfile: (p: NewProfile) => Promise<Result>;
  updateProfile: (p: ProfileEdits) => Promise<Result>;
  saveBirthday: (b: Birthday | null) => Promise<Result>;
  deleteAccount: () => Promise<Result>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [birthday, setBirthday] = useState<Birthday | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setBirthday(null);
      return;
    }
    const { data: priv } = await supabase.from('profile_private').select('birthday_month, birthday_day, share_birthday').eq('user_id', userId).maybeSingle();
    setBirthday(priv?.share_birthday && priv?.birthday_month && priv?.birthday_day ? { month: priv.birthday_month, day: priv.birthday_day } : null);
    const { data } = await supabase
      .from('profiles')
      .select('id, role, display_name, handle, bio, styles, neighborhood, instagram_handle, tiktok_handle')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      // A saved login can outlive its account (for example after test data is reset).
      // Ask the server whether the user still exists; if not, sign out cleanly.
      if (data.session) {
        const { error: userError } = await supabase.auth.getUser();
        if (userError && userError.status !== undefined && userError.status >= 400 && userError.status < 500) {
          await supabase.auth.signOut({ scope: 'local' });
          if (!active) return;
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }
      }
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
      birthday,
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
          instagram_handle: p.instagram?.trim().replace(/^@/, '') || null,
          tiktok_handle: p.tiktok?.trim().replace(/^@/, '') || null,
        });
        if (error) {
          if (error.message.includes('profiles_id_fkey')) {
            // The account behind this login no longer exists. Start over at sign in.
            await supabase.auth.signOut({ scope: 'local' });
            setProfile(null);
          }
          return { error: friendlyError(error.message) };
        }

        if (p.birthday) {
          const { error: bdayError } = await supabase.from('profile_private').upsert({
            user_id: userId,
            birthday_month: p.birthday.month,
            birthday_day: p.birthday.day,
            share_birthday: true,
            birthday_shared_at: new Date().toISOString(),
          });
          if (bdayError) return { error: friendlyError(bdayError.message) };
        }

        await loadProfile(userId);
        return {};
      },

      async saveBirthday(b) {
        const userId = session?.user.id;
        if (!userId) return { error: 'Please sign in again.' };
        // Only stored when the person chose to share it. Saying no clears it.
        const { error } = await supabase.from('profile_private').upsert({
          user_id: userId,
          birthday_month: b?.month ?? null,
          birthday_day: b?.day ?? null,
          share_birthday: !!b,
          birthday_shared_at: b ? new Date().toISOString() : null,
        });
        if (error) return { error: friendlyError(error.message) };
        setBirthday(b);
        return {};
      },

      async deleteAccount() {
        const { error } = await supabase.rpc('delete_my_account');
        if (error) return { error: friendlyError(error.message) };
        await supabase.auth.signOut({ scope: 'local' });
        setProfile(null);
        setBirthday(null);
        return {};
      },

      async updateProfile(p) {
        const userId = session?.user.id;
        if (!userId) return { error: 'Please sign in again.' };
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: p.displayName.trim(),
            handle: p.handle?.trim().toLowerCase() || null,
            bio: p.bio?.trim() || null,
            styles: p.styles ?? [],
            neighborhood: p.neighborhood?.trim() || null,
            instagram_handle: p.instagram?.trim().replace(/^@/, '') || null,
            tiktok_handle: p.tiktok?.trim().replace(/^@/, '') || null,
          })
          .eq('id', userId);
        if (error) return { error: friendlyError(error.message) };
        await loadProfile(userId);
        return {};
      },
    }),
    [loading, session, profile, birthday, demo, loadProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const a = useContext(Ctx);
  if (!a) throw new Error('useAuth must be used inside AuthProvider');
  return a;
}
