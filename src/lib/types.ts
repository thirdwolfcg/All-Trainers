export type Role = 'client' | 'instructor';

export type Style = 'pilates' | 'yoga' | 'cycle' | 'barre' | 'strength' | 'hiit' | 'dance';

export const StyleLabels: Record<Style, string> = {
  pilates: 'Pilates',
  yoga: 'Yoga',
  cycle: 'Cycle',
  barre: 'Barre',
  strength: 'Strength',
  hiit: 'HIIT',
  dance: 'Dance',
};

export type Instructor = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  styles: Style[];
  neighborhood: string;
  isFounding: boolean;
};

export type Studio = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  bookingUrl?: string;
};

export type ClassStatus = 'scheduled' | 'cancelled' | 'sub_needed' | 'subbed';

export type ClassSession = {
  id: string;
  instructorId: string;
  studioId: string;
  title: string;
  style: Style;
  startsAt: string; // ISO
  durationMin: number;
  status: ClassStatus;
  note?: string;
};

export type PostKind = 'photo' | 'recipe' | 'playlist' | 'note';

export type Post = {
  id: string;
  instructorId: string;
  kind: PostKind;
  title: string;
  body: string;
  linkUrl?: string;
  isPremium: boolean;
  createdAt: string; // ISO
};

export type Birthday = { month: number; day: number };

export type Client = {
  id: string;
  name: string;
  birthday?: Birthday;
  followedAt: string; // ISO
  isPremium: boolean;
  preferences?: string;
};

export type AttendanceEntry = {
  id: string;
  clientId: string;
  instructorId: string;
  studioId: string;
  classId?: string;
  date: string; // ISO date
  source: 'client' | 'instructor';
};

export type Message = {
  id: string;
  senderId: string;
  body: string;
  sentAt: string; // ISO
};

export type Conversation = {
  id: string;
  instructorId: string;
  clientId: string;
  messages: Message[];
};
