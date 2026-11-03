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

/**
 * First name for a greeting: first word, trailing dots or commas dropped,
 * first letter capitalized. "lo s." -> "Lo", "l." -> "L".
 */
export function greetName(full: string) {
  const first = full.trim().split(/\s+/)[0]?.replace(/[.,]+$/, '') ?? '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'there';
}
