/**
 * Live data for signed-in accounts: loads everything the screens need from
 * Supabase and maps it to the app's types. The store keeps working the same
 * way; for real accounts each action also writes here (see store.tsx).
 *
 * Row level security decides what each person can see, so these queries ask
 * for "everything" and get back only what the signed-in person is allowed.
 */
import { supabase } from './supabase';
import type {
  AttendanceEntry,
  BookingLink,
  ClassSession,
  ClassUpdate,
  Client,
  Conversation,
  Instructor,
  Post,
  Role,
  SpotOffer,
  ReportReason,
  ReportTarget,
  Studio,
  SubRequest,
} from './types';
import { clientName } from './names';

/** Random v4 UUID, so new rows have their real id before the insert finishes. */
export function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string; getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const POST_PHOTOS_BUCKET = 'post-photos';

export function photoUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from(POST_PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export type LiveData = {
  instructors: Instructor[];
  studios: Studio[];
  classes: ClassSession[];
  posts: Post[];
  following: Set<string>;
  premium: Set<string>;
  booked: Set<string>;
  bookers: Record<string, string[]>;
  classUpdates: ClassUpdate[];
  waitlist: Set<string>;
  spotOffers: SpotOffer[];
  attendance: AttendanceEntry[];
  clients: Client[];
  subRequests: SubRequest[];
  conversations: Conversation[];
  /** People I've blocked. */
  blocked: Set<string>;
  /** Display names for everyone we've seen, for messages and spot offers. */
  names: Record<string, string>;
};

type Rows<T> = { data: T[] | null; error: { message: string } | null };
const rows = <T>(r: Rows<T>, what: string): T[] => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data ?? [];
};

export async function loadLive(me: string, role: Role): Promise<LiveData> {
  const since = new Date(Date.now() - 100 * 86400000).toISOString();
  const until = new Date(Date.now() + 400 * 86400000).toISOString();

  const [profilesR, studiosR, linksR, classesR, postsR, followsR, premiumR, bookingsR, updatesR, waitR, offersR, attR, subsR, convR, blocksR] =
    await Promise.all([
      supabase.from('profiles').select('id, role, display_name, handle, bio, styles, neighborhood, instagram_handle, tiktok_handle'),
      supabase.from('studios').select('id, name, neighborhood, address'),
      supabase.from('studio_booking_links').select('studio_id, platform, url, label'),
      supabase
        .from('classes')
        .select(
          'id, instructor_id, studio_id, title, style, starts_at, ends_at, booking_url, status, note, description, sub_instructor_id, series_id, playlist_url, recipe_post_id',
        )
        .gte('starts_at', since)
        .lte('starts_at', until)
        .order('starts_at')
        .limit(5000),
      supabase
        .from('posts')
        .select('id, instructor_id, kind, title, body, media_path, link_url, is_premium, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('follows').select('client_id, instructor_id'),
      supabase.from('premium_subscriptions').select('client_id, instructor_id, status, current_period_end'),
      supabase.from('class_bookings').select('client_id, class_id'),
      supabase.from('class_updates').select('id, class_id, instructor_id, body, created_at').order('created_at', { ascending: false }),
      supabase.from('class_waitlist').select('client_id, class_id'),
      supabase.from('spot_offers').select('id, class_id, from_client_id, status, claimed_by, created_at').order('created_at', { ascending: false }),
      supabase.from('attendance').select('id, client_id, instructor_id, class_id, studio_id, attended_on, source'),
      supabase.from('sub_requests').select('id, class_id, from_instructor_id, to_instructor_id, status, created_at'),
      supabase.from('conversations').select('id, instructor_id, client_id, last_message_at'),
      supabase.from('blocks').select('blocked_id'),
    ]);

  const profiles = rows(profilesR, 'profiles');
  const names: Record<string, string> = {};
  profiles.forEach((p) => (names[p.id] = p.display_name));

  const instructors: Instructor[] = profiles
    .filter((p) => p.role === 'instructor')
    .map((p) => ({
      id: p.id,
      name: p.display_name,
      handle: p.handle ?? '',
      bio: p.bio ?? '',
      styles: p.styles ?? [],
      neighborhood: p.neighborhood ?? '',
      isFounding: true,
      instagram: p.instagram_handle ?? undefined,
      tiktok: p.tiktok_handle ?? undefined,
    }));

  const linksByStudio: Record<string, BookingLink[]> = {};
  rows(linksR, 'booking links').forEach((l) => {
    (linksByStudio[l.studio_id] ??= []).push({ platform: l.platform, url: l.url, label: l.label ?? undefined });
  });
  const studios: Studio[] = rows(studiosR, 'studios').map((s) => ({
    id: s.id,
    name: s.name,
    neighborhood: s.neighborhood ?? '',
    address: s.address ?? '',
    bookingLinks: linksByStudio[s.id] ?? [],
  }));

  const classes: ClassSession[] = rows(classesR, 'classes').map((c) => ({
    id: c.id,
    instructorId: c.instructor_id,
    studioId: c.studio_id ?? '',
    title: c.title,
    style: c.style ?? 'pilates',
    startsAt: new Date(c.starts_at).toISOString(),
    durationMin: Math.max(1, Math.round((new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 60000)),
    status: c.status,
    note: c.note ?? undefined,
    description: c.description ?? undefined,
    bookingUrl: c.booking_url ?? undefined,
    subInstructorId: c.sub_instructor_id ?? undefined,
    seriesId: c.series_id ?? undefined,
    playlistUrl: c.playlist_url ?? undefined,
    recipePostId: c.recipe_post_id ?? undefined,
  }));

  const posts: Post[] = rows(postsR, 'posts').map((p) => ({
    id: p.id,
    instructorId: p.instructor_id,
    kind: p.kind,
    title: p.title ?? '',
    body: p.body ?? '',
    linkUrl: p.link_url ?? undefined,
    imageUrl: photoUrl(p.media_path),
    isPremium: p.is_premium,
    createdAt: new Date(p.created_at).toISOString(),
  }));

  const follows = rows(followsR, 'follows');
  const following = new Set(follows.filter((f) => f.client_id === me).map((f) => f.instructor_id));
  const now = Date.now();
  const premium = new Set(
    rows(premiumR, 'premium')
      .filter((p) => p.client_id === me && p.status === 'active' && (!p.current_period_end || new Date(p.current_period_end).getTime() > now))
      .map((p) => p.instructor_id),
  );

  const bookings = rows(bookingsR, 'bookings');
  const booked = new Set(bookings.filter((b) => b.client_id === me).map((b) => b.class_id));
  const bookers: Record<string, string[]> = {};
  bookings.forEach((b) => (bookers[b.class_id] ??= []).push(b.client_id));

  const classUpdates: ClassUpdate[] = rows(updatesR, 'class updates').map((u) => ({
    id: u.id,
    classId: u.class_id,
    instructorId: u.instructor_id,
    body: u.body,
    createdAt: new Date(u.created_at).toISOString(),
  }));

  const waitlist = new Set(
    rows(waitR, 'waitlist')
      .filter((w) => w.client_id === me)
      .map((w) => w.class_id),
  );

  const spotOffers: SpotOffer[] = rows(offersR, 'spot offers').map((o) => ({
    id: o.id,
    classId: o.class_id,
    fromClientId: o.from_client_id,
    fromName: clientName(names[o.from_client_id] ?? 'Someone'),
    status: o.status,
    claimedBy: o.claimed_by ?? undefined,
    createdAt: new Date(o.created_at).toISOString(),
  }));

  const attendance: AttendanceEntry[] = rows(attR, 'attendance').map((a) => ({
    id: a.id,
    clientId: a.client_id,
    instructorId: a.instructor_id,
    studioId: a.studio_id ?? '',
    classId: a.class_id ?? undefined,
    date: a.attended_on,
    source: a.source,
  }));

  const subRequests: SubRequest[] = rows(subsR, 'sub requests').map((r) => ({
    id: r.id,
    classId: r.class_id,
    fromInstructorId: r.from_instructor_id,
    toInstructorId: r.to_instructor_id,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  const convRows = rows(convR, 'conversations');
  const msgRows = convRows.length
    ? rows(
        await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, body, created_at')
          .in(
            'conversation_id',
            convRows.map((c) => c.id),
          )
          .order('created_at'),
        'messages',
      )
    : [];
  const conversations: Conversation[] = convRows.map((c) => ({
    id: c.id,
    instructorId: c.instructor_id,
    clientId: c.client_id,
    messages: msgRows
      .filter((m) => m.conversation_id === c.id)
      .map((m) => ({ id: m.id, senderId: m.sender_id, body: m.body, sentAt: new Date(m.created_at).toISOString() })),
  }));

  let clients: Client[] = [];
  if (role === 'instructor') {
    const [listR, notesR] = await Promise.all([supabase.rpc('instructor_client_list'), supabase.from('client_notes').select('client_id, notes, preferences')]);
    const notes: Record<string, string> = {};
    rows(notesR, 'client notes').forEach((n) => (notes[n.client_id] = n.notes ?? n.preferences ?? ''));
    clients = rows(listR as Rows<Record<string, never>>, 'client list').map((c: Record<string, never>) => ({
      id: c.client_id,
      name: c.display_name,
      birthday: c.birthday_month && c.birthday_day ? { month: c.birthday_month, day: c.birthday_day } : undefined,
      followedAt: new Date(c.followed_at).toISOString(),
      isPremium: !!c.is_premium,
      preferences: notes[c.client_id] || undefined,
    }));
  }

  return {
    instructors,
    studios,
    classes,
    posts,
    following,
    premium,
    booked,
    bookers,
    classUpdates,
    waitlist,
    spotOffers,
    attendance,
    clients,
    subRequests,
    conversations,
    names,
    blocked: new Set(rows(blocksR, 'blocks').map((b) => b.blocked_id)),
  };
}

/* ---------- photos ---------- */

/** Uploads a picked photo to post-photos/<me>/<random>.<ext> and returns the storage path. */
export async function uploadPostPhoto(me: string, uri: string): Promise<{ path?: string; error?: string }> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const type = blob.type || 'image/jpeg';
    if (!type.startsWith('image/')) return { error: 'That file isn’t a photo.' };
    if (blob.size > 5 * 1024 * 1024) return { error: 'That photo is over 5 MB. Try a smaller one.' };
    const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const path = `${me}/${uuid()}.${ext}`;
    const body = await blob.arrayBuffer();
    const { error } = await supabase.storage.from(POST_PHOTOS_BUCKET).upload(path, body, { contentType: type, upsert: false });
    return error ? { error: error.message } : { path };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed.' };
  }
}

/* ---------- writes ---------- */

const toRow = (c: ClassSession) => ({
  id: c.id,
  instructor_id: c.instructorId,
  studio_id: c.studioId || null,
  title: c.title,
  style: c.style,
  starts_at: c.startsAt,
  ends_at: new Date(new Date(c.startsAt).getTime() + c.durationMin * 60000).toISOString(),
  booking_url: c.bookingUrl ?? null,
  status: c.status,
  note: c.note ?? null,
  description: c.description ?? null,
  series_id: c.seriesId ?? null,
  playlist_url: c.playlistUrl ?? null,
  recipe_post_id: c.recipePostId ?? null,
});

export type SeriesInfo = {
  repeat: 'weekly' | 'biweekly';
  /** weekday (0 = Sunday) to "HH:MM" */
  schedule: Record<number, string>;
  durationMin: number;
  startsOn: string; // YYYY-MM-DD
  endsOn?: string;
};

type Err = string | undefined;
const err = (r: { error: { message: string } | null }): Err => r.error?.message;

export const db = {
  async addStudio(id: string, me: string, name: string, neighborhood: string): Promise<Err> {
    return err(await supabase.from('studios').insert({ id, name, neighborhood: neighborhood || null, created_by: me }));
  },
  async addClasses(cs: ClassSession[], series?: { id: string; me: string; studioId: string; title: string } & SeriesInfo): Promise<Err> {
    if (series) {
      const e = err(
        await supabase.from('class_series').insert({
          id: series.id,
          instructor_id: series.me,
          studio_id: series.studioId || null,
          title: series.title,
          repeat: series.repeat,
          schedule: series.schedule,
          duration_min: series.durationMin,
          starts_on: series.startsOn,
          ends_on: series.endsOn ?? null,
        }),
      );
      if (e) return e;
    }
    return err(await supabase.from('classes').insert(cs.map(toRow)));
  },
  async updateClass(c: ClassSession): Promise<Err> {
    const { id, instructor_id: _i, ...rest } = toRow(c);
    return err(await supabase.from('classes').update(rest).eq('id', id));
  },
  async deleteClasses(ids: string[]): Promise<Err> {
    return err(await supabase.from('classes').delete().in('id', ids));
  },
  async setClassStatus(id: string, status: ClassSession['status'], clearNote = false): Promise<Err> {
    return err(
      await supabase
        .from('classes')
        .update(clearNote ? { status, note: null } : { status })
        .eq('id', id),
    );
  },
  async addPost(p: Post, mediaPath?: string): Promise<Err> {
    return err(
      await supabase.from('posts').insert({
        id: p.id,
        instructor_id: p.instructorId,
        kind: p.kind,
        title: p.title || null,
        body: p.body || null,
        link_url: p.linkUrl ?? null,
        media_path: mediaPath ?? null,
        is_premium: p.isPremium,
        created_at: p.createdAt,
      }),
    );
  },
  async deletePost(id: string): Promise<Err> {
    return err(await supabase.from('posts').delete().eq('id', id));
  },
  async follow(me: string, instructorId: string, on: boolean): Promise<Err> {
    return on
      ? err(await supabase.from('follows').insert({ client_id: me, instructor_id: instructorId }))
      : err(await supabase.from('follows').delete().eq('client_id', me).eq('instructor_id', instructorId));
  },
  async book(me: string, classId: string, on: boolean): Promise<Err> {
    return on
      ? err(await supabase.from('class_bookings').insert({ client_id: me, class_id: classId }))
      : err(await supabase.from('class_bookings').delete().eq('client_id', me).eq('class_id', classId));
  },
  async waitlist(me: string, classId: string, on: boolean): Promise<Err> {
    return on
      ? err(await supabase.from('class_waitlist').insert({ client_id: me, class_id: classId }))
      : err(await supabase.from('class_waitlist').delete().eq('client_id', me).eq('class_id', classId));
  },
  async classUpdate(u: ClassUpdate): Promise<Err> {
    return err(
      await supabase.from('class_updates').insert({ id: u.id, class_id: u.classId, instructor_id: u.instructorId, body: u.body, created_at: u.createdAt }),
    );
  },
  async offerSpot(id: string, me: string, classId: string): Promise<Err> {
    return err(await supabase.from('spot_offers').insert({ id, class_id: classId, from_client_id: me, status: 'open' }));
  },
  async cancelOffer(id: string): Promise<Err> {
    return err(await supabase.from('spot_offers').update({ status: 'cancelled' }).eq('id', id));
  },
  async claimSpot(id: string, me: string): Promise<Err> {
    return err(await supabase.from('spot_offers').update({ status: 'claimed', claimed_by: me }).eq('id', id));
  },
  async attend(a: AttendanceEntry, on: boolean): Promise<Err> {
    if (!on) return err(await supabase.from('attendance').delete().eq('id', a.id));
    return err(
      await supabase.from('attendance').insert({
        id: a.id,
        client_id: a.clientId,
        instructor_id: a.instructorId,
        class_id: a.classId ?? null,
        studio_id: a.studioId || null,
        attended_on: a.date.slice(0, 10),
        source: a.source,
      }),
    );
  },
  async updateProfile(me: string, patch: Partial<Instructor>): Promise<Err> {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.display_name = patch.name;
    if (patch.handle !== undefined) row.handle = patch.handle || null;
    if (patch.bio !== undefined) row.bio = patch.bio || null;
    if (patch.styles !== undefined) row.styles = patch.styles;
    if (patch.neighborhood !== undefined) row.neighborhood = patch.neighborhood || null;
    if (patch.instagram !== undefined) row.instagram_handle = patch.instagram || null;
    if (patch.tiktok !== undefined) row.tiktok_handle = patch.tiktok || null;
    if (!Object.keys(row).length) return undefined;
    return err(await supabase.from('profiles').update(row).eq('id', me));
  },
  async saveNotes(me: string, clientId: string, notes: string): Promise<Err> {
    return err(
      await supabase
        .from('client_notes')
        .upsert(
          { instructor_id: me, client_id: clientId, notes: notes || null, updated_at: new Date().toISOString() },
          { onConflict: 'instructor_id,client_id' },
        ),
    );
  },
  async requestSub(r: SubRequest): Promise<Err> {
    return err(
      await supabase
        .from('sub_requests')
        .insert({ id: r.id, class_id: r.classId, from_instructor_id: r.fromInstructorId, to_instructor_id: r.toInstructorId, status: 'pending' }),
    );
  },
  async setSubStatus(id: string, status: SubRequest['status']): Promise<Err> {
    return err(await supabase.from('sub_requests').update({ status }).eq('id', id));
  },
  async startConversation(c: Conversation): Promise<Err> {
    return err(await supabase.from('conversations').insert({ id: c.id, instructor_id: c.instructorId, client_id: c.clientId }));
  },
  async block(me: string, other: string, on: boolean): Promise<Err> {
    return on
      ? err(await supabase.from('blocks').insert({ blocker_id: me, blocked_id: other }))
      : err(await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', other));
  },
  async report(me: string, r: { targetType: ReportTarget; targetId: string; targetUserId?: string; reason: ReportReason; details?: string }): Promise<Err> {
    const res = await supabase.from('reports').insert({
      reporter_id: me,
      target_type: r.targetType,
      target_id: r.targetId,
      target_user_id: r.targetUserId ?? null,
      reason: r.reason,
      details: r.details || null,
    });
    // Reporting the same thing twice is fine: the first report already counts.
    if (res.error?.message.includes('duplicate')) return undefined;
    return err(res);
  },
  async sendMessage(id: string, conversationId: string, me: string, body: string): Promise<Err> {
    return err(await supabase.from('messages').insert({ id, conversation_id: conversationId, sender_id: me, body }));
  },
};
