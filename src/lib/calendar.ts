import { Linking, Platform } from 'react-native';

import type { ClassSession, Instructor, Studio } from './types';

function stamp(d: Date) {
  // 20261102T130000Z
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function details(session: ClassSession, instructor: Instructor, studio: Studio) {
  const start = new Date(session.startsAt);
  const end = new Date(start.getTime() + session.durationMin * 60000);
  return {
    title: `${session.title} with ${instructor.name}`,
    location: `${studio.name}, ${studio.address}`,
    description: `Booked through ${studio.name}. Found on All Trainers.`,
    start,
    end,
  };
}

export function googleCalendarUrl(session: ClassSession, instructor: Instructor, studio: Studio) {
  const d = details(session, instructor, studio);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: d.title,
    dates: `${stamp(d.start)}/${stamp(d.end)}`,
    location: d.location,
    details: d.description,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function icsFile(session: ClassSession, instructor: Instructor, studio: Studio) {
  const d = details(session, instructor, studio);
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//All Trainers//EN',
    'BEGIN:VEVENT',
    `UID:${session.id}@alltrainers.app`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(d.start)}`,
    `DTEND:${stamp(d.end)}`,
    `SUMMARY:${esc(d.title)}`,
    `LOCATION:${esc(d.location)}`,
    `DESCRIPTION:${esc(d.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Add one class to the user's calendar.
 * Web: downloads an .ics file (opens in Apple Calendar, Outlook or Google).
 * Phones: opens Google Calendar's add-event page for now.
 * TODO(phase 1): native iPhone calendar via expo-calendar, plus a subscribable
 * feed per instructor so new classes appear automatically.
 */
export async function addToCalendar(session: ClassSession, instructor: Instructor, studio: Studio) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([icsFile(session, instructor, studio)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '-').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Linking.openURL(googleCalendarUrl(session, instructor, studio));
}
