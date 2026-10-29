import type { Birthday } from './types';

const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Calendar-day math, safe across daylight saving changes. */
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function dayLabel(d: Date, now = new Date()) {
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, addDays(now, 1))) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function shortDay(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function timeLabel(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function timeRange(start: Date, minutes: number) {
  const end = new Date(start.getTime() + minutes * 60000);
  return `${timeLabel(start)} to ${timeLabel(end)}`;
}

export function relativeTime(iso: string, now = new Date()) {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Days until the next occurrence of a birthday (0 means today). */
export function daysUntilBirthday(b: Birthday, now = new Date()) {
  const today = startOfDay(now);
  let next = new Date(today.getFullYear(), b.month - 1, b.day);
  if (next < today) next = new Date(today.getFullYear() + 1, b.month - 1, b.day);
  return Math.round((next.getTime() - today.getTime()) / DAY);
}

export function birthdayLabel(b: Birthday) {
  return new Date(2000, b.month - 1, b.day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/** "today", "3 days ago", "2 weeks ago", or "on Oct 19" for anything older. */
export function sinceLabel(iso: string, now = new Date()) {
  const days = Math.round((startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 56) return `${Math.round(days / 7)} weeks ago`;
  return `on ${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
