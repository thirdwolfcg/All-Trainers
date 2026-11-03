/**
 * How instructors see a client's name: first name and last initial.
 * "Kendall Brooks" -> "Kendall B.", "Lo S." stays "Lo S.", "Amara" stays "Amara".
 */
export function clientName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? '';
  const last = parts[parts.length - 1].replace(/\.$/, '');
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}
