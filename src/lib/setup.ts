/**
 * Setup progress for the "Get set up" checklist: the few steps the app can't
 * see in the data (opened the QR page, looked at the feed, decided about
 * birthdays, hid the checklist). Saved on the device per person, so a new
 * phone shows the checklist again until it's hidden there too.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type SetupFlag = 'openedQr' | 'openedFeed' | 'birthdayDecided' | 'hidden';
type Flags = Partial<Record<SetupFlag, boolean>>;

const key = (who: string) => `zomi-setup-${who}`;

async function read(who: string): Promise<Flags> {
  try {
    const raw = await AsyncStorage.getItem(key(who));
    return raw ? (JSON.parse(raw) as Flags) : {};
  } catch {
    return {};
  }
}

/** Marks one setup step done for this person. Safe to call again. */
export async function markSetup(who: string, flag: SetupFlag, value = true) {
  try {
    const flags = await read(who);
    if (flags[flag] === value) return;
    await AsyncStorage.setItem(key(who), JSON.stringify({ ...flags, [flag]: value }));
  } catch {
    // Not being able to save a checklist tick is never worth bothering anyone about.
  }
}

/** The person's setup flags, re-read whenever the screen comes back into view. */
export function useSetupFlags(who: string) {
  const [flags, setFlags] = useState<Flags>({});
  const [loaded, setLoaded] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      read(who).then((f) => {
        if (!live) return;
        setFlags(f);
        setLoaded(true);
      });
      return () => {
        live = false;
      };
    }, [who]),
  );
  const set = (flag: SetupFlag, value = true) => {
    setFlags((f) => ({ ...f, [flag]: value }));
    markSetup(who, flag, value);
  };
  return { flags, loaded, set };
}
