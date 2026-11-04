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
  /** Handles without the @ */
  instagram?: string;
  tiktok?: string;
};

export type BookingPlatform = 'studio' | 'mindbody' | 'classpass' | 'other';

export type BookingLink = {
  platform: BookingPlatform;
  url: string;
  /** Shown instead of the default name, e.g. "Lumen app" */
  label?: string;
};

export type Studio = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  /** Where clients can book this studio's classes. Entered once, shared by every instructor who teaches there. */
  bookingLinks: BookingLink[];
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
  /** What the class is about: vibe, level, what to bring. */
  description?: string;
  /** Optional deep link to this exact class, shown first when present. */
  bookingUrl?: string;
  /** The instructor covering this class once a sub is confirmed. */
  subInstructorId?: string;
  /** Classes made together as a repeating series share this id. */
  seriesId?: string;
  /** The class playlist (Spotify, Apple Music…). */
  playlistUrl?: string;
  /** One of the instructor's recipe posts, attached to the class. */
  recipePostId?: string;
};

export type SubRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type SubRequest = {
  id: string;
  classId: string;
  fromInstructorId: string;
  toInstructorId: string;
  status: SubRequestStatus;
  createdAt: string; // ISO
};

export type PostKind = 'photo' | 'video' | 'recipe' | 'playlist' | 'note';

export type Post = {
  id: string;
  instructorId: string;
  kind: PostKind;
  title: string;
  body: string;
  linkUrl?: string;
  /** Local or storage URL of an attached photo. */
  imageUrl?: string;
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

/** A note from the instructor to everyone booked into a class ("Heat's out, bring layers"). */
export type ClassUpdate = {
  id: string;
  classId: string;
  instructorId: string;
  body: string;
  createdAt: string; // ISO
};

/** A booked client offering their spot to someone else on the app. */
export type SpotOffer = {
  id: string;
  classId: string;
  fromClientId: string;
  fromName: string;
  status: 'open' | 'claimed' | 'cancelled';
  claimedBy?: string;
  createdAt: string; // ISO
};
