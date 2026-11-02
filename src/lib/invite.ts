import { Linking, Platform, Share } from 'react-native';

import { PUBLIC_APP_URL, followUrl } from './links';

/**
 * Invite links open the app's web address (see links.ts). With an instructor,
 * they open that instructor's follow page. The ref parameter credits whoever
 * sent the invite, for example toward a founding-instructor perk or a client reward.
 */
export function inviteLink(params: { ref: string; instructor?: string }) {
  const q = new URLSearchParams({ ref: params.ref }).toString();
  return params.instructor ? `${followUrl(params.instructor)}?${q}` : `${PUBLIC_APP_URL}/welcome?${q}`;
}

const first = (name: string) => name.split(' ')[0];

/** Instructor to a coworker at the same studio. */
export function coworkerInviteMessage(opts: { fromName: string; fromHandle: string; studioName: string }) {
  return (
    `Hey! It's ${first(opts.fromName)}. I'm on All Trainers, where my clients follow my schedule across every studio I teach at. ` +
    `It's also how ${opts.studioName} instructors find subs for each other. Founding instructors are free right now, join me: ` +
    inviteLink({ ref: opts.fromHandle })
  );
}

/** Client to a friend. */
export function friendInviteMessage(opts: { fromName: string; refId: string }) {
  return (
    `Ok you need this. All Trainers shows you where your favorite instructors are teaching all week, every studio, one app. ` +
    `No more digging through IG stories. Come work out with me: ${inviteLink({ ref: opts.refId })}`
  );
}

/** Client to a friend, about one instructor's classes. */
export function bringAFriendMessage(opts: { fromName: string; refId: string; instructorName: string; instructorHandle: string }) {
  return (
    `Take a class with me?? ${first(opts.instructorName)} is my favorite instructor in Denver. ` +
    `Follow ${first(opts.instructorName)} on All Trainers to see where they're teaching this week: ` +
    inviteLink({ ref: opts.refId, instructor: opts.instructorHandle })
  );
}

/** Client to an instructor who isn't on the app yet. */
export function instructorInviteMessage(opts: { fromName: string; refId: string }) {
  return (
    `Hi! It's ${first(opts.fromName)} from your class. I'd follow you everywhere if you were on All Trainers, ` +
    `it's an app where clients can see your schedule across every studio you teach at, no more hunting for IG stories. ` +
    `It's free for founding instructors right now: ${inviteLink({ ref: opts.refId })}`
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
