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
