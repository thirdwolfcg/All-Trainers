/**
 * Public web address of the app. For now this is the GitHub Pages preview.
 * TODO before launch: switch to the real domain (and set up universal links
 * so the same URL opens the installed app on phones).
 */
export const PUBLIC_APP_URL = 'https://thirdwolfcg.github.io/All-Trainers';

/** The page a QR code or shared link opens: shows the instructor with a Follow button. */
export function followUrl(handle: string) {
  return `${PUBLIC_APP_URL}/follow/${encodeURIComponent(handle)}`;
}

export function instagramUrl(handle: string) {
  return `https://www.instagram.com/${encodeURIComponent(handle.replace(/^@/, ''))}/`;
}

export function tiktokUrl(handle: string) {
  return `https://www.tiktok.com/@${encodeURIComponent(handle.replace(/^@/, ''))}`;
}

/** What a post's link button should say, based on where the link goes. */
export function linkButton(url: string, kind?: string): { label: string; icon: 'logo-instagram' | 'logo-tiktok' | 'logo-youtube' | 'musical-notes-outline' | 'play-circle-outline' | 'open-outline' } {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    // not a valid URL; fall through to the generic label
  }
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return { label: 'Watch on Instagram', icon: 'logo-instagram' };
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return { label: 'Watch on TikTok', icon: 'logo-tiktok' };
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return { label: 'Watch on YouTube', icon: 'logo-youtube' };
  if (host.endsWith('spotify.com')) return { label: 'Open in Spotify', icon: 'musical-notes-outline' };
  if (host.endsWith('music.apple.com')) return { label: 'Open in Apple Music', icon: 'musical-notes-outline' };
  if (kind === 'playlist') return { label: 'Open playlist', icon: 'musical-notes-outline' };
  if (kind === 'video') return { label: 'Watch video', icon: 'play-circle-outline' };
  return { label: 'Open link', icon: 'open-outline' };
}
