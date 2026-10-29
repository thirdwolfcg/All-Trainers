import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { addToCalendar } from '@/lib/calendar';
import { relativeTime, timeLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { StyleLabels, type ClassSession, type Instructor, type Post } from '@/lib/types';

import { Avatar, Button, Card, Chip, Icon, Text, type IconName } from './ui';

/* ---------- One class in a schedule ---------- */

export function ClassCard({ session, showInstructor = true }: { session: ClassSession; showInstructor?: boolean }) {
  const store = useStore();
  const instructor = store.instructor(session.instructorId);
  const studio = store.studio(session.studioId);
  if (!instructor || !studio) return null;

  const start = new Date(session.startsAt);
  const hasStarted = start.getTime() <= Date.now();
  const cancelled = session.status === 'cancelled';
  const went = store.attended(session.id);
  const isClient = store.role === 'client';

  return (
    <Card tone="plain" style={[styles.classCard, cancelled && { opacity: 0.6 }]}>
      <View style={styles.classTop}>
        <View style={styles.timeCol}>
          <Text variant="bodyStrong">{timeLabel(start)}</Text>
          <Text variant="small" color="textMuted">
            {session.durationMin} min
          </Text>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="heading" style={cancelled && { textDecorationLine: 'line-through' }}>
            {session.title}
          </Text>
          <View style={styles.metaRow}>
            <Icon name="location-outline" size={14} color="textSecondary" />
            <Text variant="small" color="textSecondary">
              {studio.name} · {studio.neighborhood}
            </Text>
          </View>
          {showInstructor ? (
            <Pressable
              style={styles.metaRow}
              onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })}>
              <Avatar name={instructor.name} size={20} />
              <Text variant="smallStrong" color="primaryDeep">
                {instructor.name}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Chip label={StyleLabels[session.style]} />
      </View>

      {session.status !== 'scheduled' ? (
        <View style={{ flexDirection: 'row' }}>
          <Chip
            tone={cancelled ? 'warn' : session.status === 'subbed' ? 'mint' : 'warn'}
            icon={cancelled ? 'close-circle-outline' : 'swap-horizontal'}
            label={session.note ?? (cancelled ? 'Cancelled' : session.status === 'subbed' ? 'Sub confirmed' : 'Sub needed')}
          />
        </View>
      ) : null}

      {isClient && !cancelled ? (
        <View style={styles.actions}>
          {hasStarted ? (
            <Button
              size="sm"
              kind={went ? 'soft' : 'outline'}
              icon={went ? 'checkmark-circle' : 'checkmark-circle-outline'}
              label={went ? 'You went' : 'I went'}
              onPress={() => store.toggleAttended(session)}
            />
          ) : (
            <>
              <Button
                size="sm"
                kind="primary"
                icon="open-outline"
                label="Book at studio"
                onPress={() => studio.bookingUrl && Linking.openURL(studio.bookingUrl)}
              />
              <Button
                size="sm"
                kind="outline"
                icon="calendar-outline"
                label="Add to calendar"
                onPress={() => addToCalendar(session, instructor, studio)}
              />
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
}

/* ---------- Instructor result row ---------- */

export function InstructorRow({ instructor }: { instructor: Instructor }) {
  const store = useStore();
  const isFollowing = store.following.has(instructor.id);
  const upcoming = store.classes.filter(
    (c) => c.instructorId === instructor.id && c.status !== 'cancelled' && new Date(c.startsAt).getTime() > Date.now(),
  ).length;

  return (
    <Card onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })} style={styles.instructorRow}>
      <Avatar name={instructor.name} size={52} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.metaRow}>
          <Text variant="heading">{instructor.name}</Text>
          {instructor.isFounding ? <Icon name="sparkles" size={14} color="primary" /> : null}
        </View>
        <Text variant="small" color="textSecondary">
          {instructor.styles.map((s) => StyleLabels[s]).join(' · ')} · {instructor.neighborhood}
        </Text>
        <Text variant="small" color="textMuted">
          {upcoming} {upcoming === 1 ? 'class' : 'classes'} this week
        </Text>
      </View>
      <Button
        size="sm"
        kind={isFollowing ? 'soft' : 'primary'}
        label={isFollowing ? 'Following' : 'Follow'}
        onPress={() => store.toggleFollow(instructor.id)}
      />
    </Card>
  );
}

/* ---------- Feed post ---------- */

const postIcons: Record<Post['kind'], IconName> = {
  photo: 'image-outline',
  recipe: 'restaurant-outline',
  playlist: 'musical-notes-outline',
  note: 'chatbubble-ellipses-outline',
};

const postKindLabel: Record<Post['kind'], string> = {
  photo: 'Photo',
  recipe: 'Recipe',
  playlist: 'Playlist',
  note: 'Update',
};

export function PostCard({ post }: { post: Post }) {
  const store = useStore();
  const instructor = store.instructor(post.instructorId);
  if (!instructor) return null;

  const isOwner = store.role === 'instructor' && store.meId === post.instructorId;
  const unlocked = !post.isPremium || isOwner || (store.role === 'client' && store.premium.has(post.instructorId));

  return (
    <Card tone="plain" style={{ gap: Spacing.md }}>
      <View style={styles.metaRow}>
        <View style={styles.postIcon}>
          <Icon name={postIcons[post.kind]} size={16} color="primaryDeep" />
        </View>
        <Text variant="smallStrong" color="textSecondary">
          {postKindLabel[post.kind]} · {relativeTime(post.createdAt)}
        </Text>
        <View style={{ flex: 1 }} />
        {post.isPremium ? <Chip label="Premium" icon="diamond-outline" tone="blush" /> : null}
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
              kind="soft"
              icon="open-outline"
              label={post.kind === 'playlist' ? 'Open playlist' : 'Open link'}
              onPress={() => Linking.openURL(post.linkUrl!)}
              style={{ alignSelf: 'flex-start' }}
            />
          ) : null}
        </>
      ) : (
        <View style={styles.locked}>
          <Icon name="lock-closed" size={18} color="primaryDeep" />
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong" color="primaryDeep">
              For {instructor.name.split(' ')[0]}&apos;s premium crew
            </Text>
            <Text variant="small" color="textSecondary">
              Unlock playlists, form tips and one on one access.
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  classCard: { gap: Spacing.md },
  classTop: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  timeCol: { width: 74 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingLeft: 74 + Spacing.md },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  postIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
});
