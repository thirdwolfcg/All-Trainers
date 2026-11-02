import { Linking, Platform, Share } from 'react-native';

/**
 * TODO before launch: replace with the real sign-up link (web page or app store
 * link) once the app has a domain. The ref parameter lets us credit whoever
 * sent the invite, for example toward a founding-instructor perk.
 */
export const INVITE_BASE_URL = 'https://example.com/join';

export function inviteLink(fromHandle: string) {
  return `${INVITE_BASE_URL}?ref=${encodeURIComponent(fromHandle)}`;
}

export function inviteMessage(opts: { fromName: string; fromHandle: string; studioName: string }) {
  return (
    `Hey! It's ${opts.fromName.split(' ')[0]}. I'm on All Trainers, where my clients follow my schedule across every studio I teach at. ` +
    `It's also how ${opts.studioName} instructors find subs for each other. Founding instructors are free right now, join me: ` +
    inviteLink(opts.fromHandle)
  );
}

/** iPhone, Android and browsers each spell the "new text message" link a little differently. */
function smsUrl(body: string) {
  const text = encodeURIComponent(body);
  if (Platform.OS === 'ios') return `sms:&body=${text}`;
  if (Platform.OS === 'android') return `sms:?body=${text}`;
  return `sms:?&body=${text}`;
}

/** Opens the Messages app with the invite typed out. Falls back to the share sheet. */
export async function textInvite(message: string) {
  const url = smsUrl(message);
  try {
    if (Platform.OS === 'web' || (await Linking.canOpenURL(url))) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // fall through to the share sheet
  }
  await shareInvite(message);
}

/** The system share sheet: WhatsApp, Instagram DMs, email, copy, and so on. */
export async function shareInvite(message: string) {
  try {
    await Share.share({ message });
  } catch {
    // The person closed the sheet or the browser has no share support; nothing to do.
  }
}
