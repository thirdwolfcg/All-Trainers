import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY. Check the .env file.');
}

const isServer = typeof window === 'undefined';

export const supabase = createClient(url, key, {
  auth: {
    // Phones keep the session in AsyncStorage; the web uses localStorage by default.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: !isServer,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Refresh tokens only while the app is open, as Supabase recommends for mobile.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Turn Supabase errors into something a person can read. */
export function friendlyError(message: string | undefined) {
  if (!message) return 'Something went wrong. Try again?';
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return "That email and password don't match. Try again?";
  if (m.includes('already registered') || m.includes('already been registered')) return 'That email already has an account. Try signing in.';
  if (m.includes('password') && m.includes('6')) return 'Passwords need at least 6 characters.';
  if (m.includes('email not confirmed')) return 'Check your inbox and confirm your email first.';
  if (m.includes('profiles_handle_key') || m.includes('duplicate key')) return 'That handle is taken. Try another one.';
  if (m.includes('profiles_handle_check')) return 'Handles are 3 to 30 characters: lowercase letters, numbers, dots or underscores.';
  if (m.includes('network') || m.includes('fetch')) return "Can't reach the server. Check your connection.";
  return message;
}
