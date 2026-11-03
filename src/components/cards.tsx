import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { addToCalendar } from '@/lib/calendar';
import { relativeTime } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { StyleLabels, type ClassSession, type Instructor, type Post } from '@/lib/types';

import { BookingSheet } from './booking-sheet';
import { Avatar, Button, Chip, Icon, Row, Text, type IconName } from './ui';
import { linkButton } from '@/lib/links';

function clock(d: Date) {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  return { time: `${h}:${m}`, meridiem: d.getHours() < 12 ? 'AM' : 'PM' };
}

/** Follow or unfollow with a confirmation message, and Undo after an unfollow. */
export function useFollowToggle() {
  const store = useStore();
  const toast = useToast();
  return (instructor: Instructor) => {
    const first = instructor.name.split(' ')[0];
    const wasFollowing = store.following.has(instructor.id);
    store.toggleFollow(instructor.id);
    if (wasFollowing) {
      toast(`Unfollowed ${first}`, { label: 'Undo', onPress: () => store.toggleFollow(instructor.id) });
    } else {
      toast(`Following ${first}. Their classes show up on your home screen now.`);
    }
  };
}

/** Book it, Add to cal, or I went, depending on whether the class has started. Used on cards and the class page. */
export function ClassActions({ session, size = 'sm' }: { session: ClassSession; size?: 'sm' | 'md' }) {
  const store = useStore();
  const toast = useToast();
  const [booking, setBooking] = useState(false);
  const instructor = store.instructor(session.instructorId);
  const studio = store.studio(session.studioId);
  if (!instructor || !studio || store.role !== 'client' || session.status === 'cancelled') return null;

  const hasStarted = new Date(session.startsAt).getTime() <= Date.now();
  const went = store.attended(session.id);
  const first = instructor.name.split(' ')[0];

  return (
    <View style={styles.actions}>
      {hasStarted ? (
        <Button
          size={size}
          kind={went ? 'soft' : 'outline'}
          icon={went ? 'checkmark-circle' : 'checkmark-circle-outline'}
          label={went ? 'You went' : 'I went'}
          onPress={() => {
            store.toggleAttended(session);
            if (!went) {
              const total = store.attendance.filter((a) => a.clientId === 'me' && a.instructorId === instructor.id).length + 1;
              toast(`Logged. That's ${total} with ${first}.`, { label: 'Undo', onPress: () => store.toggleAttended(session) });
            }
          }}
        />
      ) : (
        <>
          <Button size={size} kind="ink" label="Book it" onPress={() => setBooking(true)} />
          <Button
            size={size}
            kind="outline"
            label="Add to cal"
            onPress={async () => {
              await addToCalendar(session, instructor, studio);
              toast(Platform.OS === 'web' ? 'Calendar file downloaded. Open it to add the class.' : 'Opening your calendar…');
            }}
          />
        </>
      )}
      {booking ? (
        <BookingSheet open={booking} onClose={() => setBooking(false)} session={session} instructor={instructor} studio={studio} />
      ) : null}
    </View>
  );
}

function subLabel(session: ClassSession, ownerName: string, store: ReturnType<typeof useStore>) {
  if (session.status !== 'subbed') {
    if (store.role === 'instructor' && store.meId === session.instructorId) return 'Looking for a sub';
    return session.note ?? 'Might have a sub';
  }
  const sub = session.subInstructorId ? store.instructor(session.subInstructorId) : undefined;
  if (!sub) return 'Sub locked in';
  if (store.role === 'instructor' && store.meId === sub.id) return `You're covering for ${ownerName.split(' ')[0]}`;
  return `${sub.name.split(' ')[0]} is subbing`;
}

/* ---------- One class in a schedule ---------- */

export function ClassCard({ session, showInstructor = true }: { session: ClassSession; showInstructor?: boolean }) {
  const store = useStore();
  const instructor = store.instructor(session.instructorId);
  const studio = store.studio(session.studioId);
  if (!instructor || !studio) return null;

  const start = new Date(session.startsAt);
  const { time, meridiem } = clock(start);
  const cancelled = session.status === 'cancelled';

  return (
    <Row
      onPress={() => router.push({ pathname: '/class/[id]', params: { id: session.id } })}
      style={[styles.classRow, cancelled && { opacity: 0.55 }]}>
      <View style={styles.timeCol}>
        <Text variant="title" style={cancelled && styles.struck}>
          {time}
        </Text>
        <Text variant="eyebrow" color="textSecondary">
          {meridiem} · {session.durationMin}M
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="heading" style={cancelled && styles.struck}>
          {session.title}
        </Text>
        <Text variant="small" color="textSecondary">
          {showInstructor ? (
            <>
              with{' '}
              <Text
                variant="smallStrong"
                color="primary"
                onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })}>
                {instructor.name}
              </Text>{' '}
              at{' '}
            </>
          ) : null}
          {studio.name} · {StyleLabels[session.style]}
        </Text>
        {session.description && !cancelled ? (
          <Text variant="small" color="textSecondary" numberOfLines={2}>
            {session.description}
          </Text>
        ) : null}
        {!cancelled ? (
          <Text
            variant="smallStrong"
            color="primary"
            accessibilityRole="link"
            accessibilityLabel={`Class details for ${session.title}`}
            onPress={() => router.push({ pathname: '/class/[id]', params: { id: session.id } })}>
            Class details ›
          </Text>
        ) : null}

        {session.status !== 'scheduled' ? (
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <Chip
              tone={session.status === 'subbed' ? 'mint' : 'warn'}
              icon={cancelled ? 'close-circle-outline' : 'swap-horizontal'}
              label={cancelled ? (session.note ?? 'Cancelled') : subLabel(session, instructor.name, store)}
            />
          </View>
        ) : null}

        <ClassActions session={session} />
      </View>
    </Row>
  );
}

/* ---------- Instructor result row ---------- */

export function InstructorRow({ instructor }: { instructor: Instructor }) {
  const store = useStore();
  const toggleFollow = useFollowToggle();
  const isFollowing = store.following.has(instructor.id);
  const upcoming = store.classes.filter(
    (c) => c.instructorId === instructor.id && c.status !== 'cancelled' && new Date(c.startsAt).getTime() > Date.now(),
  ).length;

  return (
    <Row
      onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })}
      style={styles.instructorRow}>
      <Avatar name={instructor.name} size={52} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.inline}>
          <Text variant="heading">{instructor.name}</Text>
          {instructor.isFounding ? <Icon name="sparkles" size={13} color="primary" /> : null}
        </View>
        <Text variant="small" color="textSecondary">
          {instructor.styles.map((s) => StyleLabels[s]).join(' · ')} · {instructor.neighborhood}
        </Text>
        <Text variant="small" color="textSecondary">
          {upcoming} {upcoming === 1 ? 'class' : 'classes'} this week
        </Text>
      </View>
      <Button
        size="sm"
        kind={isFollowing ? 'soft' : 'primary'}
        label={isFollowing ? 'Following' : 'Follow'}
        onPress={() => toggleFollow(instructor)}
        accessibilityLabel={isFollowing ? `Unfollow ${instructor.name}` : `Follow ${instructor.name}`}
      />
    </Row>
  );
}

/* ---------- Feed post ---------- */

const postIcons: Record<Post['kind'], IconName> = {
  photo: 'image-outline',
  video: 'play-circle-outline',
  recipe: 'restaurant-outline',
  playlist: 'musical-notes-outline',
  note: 'chatbubble-ellipses-outline',
};

const postKindLabel: Record<Post['kind'], string> = {
  photo: 'Photo',
  video: 'Video',
  recipe: 'Recipe',
  playlist: 'Playlist',
  note: 'Update',
};

export function PostCard({ post }: { post: Post }) {
  const store = useStore();
  const toast = useToast();
  const instructor = store.instructor(post.instructorId);
  if (!instructor) return null;

  const isOwner = store.role === 'instructor' && store.meId === post.instructorId;
  const unlocked = !post.isPremium || isOwner || (store.role === 'client' && store.premium.has(post.instructorId));

  return (
    <Row style={{ gap: Spacing.sm }}>
      <View style={styles.inline}>
        <Icon name={postIcons[post.kind]} size={14} color="primary" />
        <Text variant="eyebrow" color="textSecondary">
          {postKindLabel[post.kind]} · {relativeTime(post.createdAt)}
        </Text>
        <View style={{ flex: 1 }} />
        {post.isPremium ? <Chip label="Premium" icon="diamond-outline" tone="blush" /> : null}
        {isOwner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete post ${post.title}`}
            hitSlop={10}
            onPress={() => {
              const removed = store.deletePost(post.id);
              if (removed) toast('Post deleted.', { label: 'Undo', onPress: () => store.restorePost(removed) });
            }}>
            <Icon name="trash-outline" size={18} color="textSecondary" />
          </Pressable>
        ) : null}
      </View>

      <Text variant="heading">{post.title}</Text>

      {unlocked ? (
        <>
          <Text variant="body" color="textSecondary">
            {post.body}
          </Text>
          {post.linkUrl ? (
            <Button
              size="sm"
              kind="outline"
              icon={linkButton(post.linkUrl, post.kind).icon}
              label={linkButton(post.linkUrl, post.kind).label}
              onPress={() => Linking.openURL(post.linkUrl!)}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            />
          ) : null}
        </>
      ) : (
        <Pressable style={styles.locked} accessibilityRole="button">
          <Icon name="lock-closed" size={16} color="primaryDeep" />
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong" color="primaryDeep">
              For {instructor.name.split(' ')[0]}&apos;s inner circle
            </Text>
            <Text variant="small" color="textSecondary">
              Go premium for form tips, extras and one on one time.
            </Text>
          </View>
        </Pressable>
      )}
    </Row>
  );
}

const styles = StyleSheet.create({
  classRow: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start' },
  timeCol: { width: 64, gap: 2 },
  struck: { textDecorationLine: 'line-through' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  locked: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    padding: Spacing.md,
    borderRadius: Radius.sm,
  },
});
