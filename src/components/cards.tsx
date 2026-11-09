import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { addToCalendar } from '@/lib/calendar';
import { relativeTime } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useMe } from '@/lib/me';
import { useToast } from '@/lib/toast';
import { styleLabel, type ClassSession, type Instructor, type Post } from '@/lib/types';

import { BookingSheet } from './booking-sheet';
import { ConfirmSheet } from './confirm-sheet';
import { Avatar, Button, Chip, Icon, Row, Text, type IconName } from './ui';
import { SafetyMenu } from './safety-menu';
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

/** Waitlist, open spots and "offer my spot" for a client on an upcoming class. */
function SpotRow({ session }: { session: ClassSession }) {
  const store = useStore();
  const toast = useToast();
  const me = useMe();
  const [confirmOffer, setConfirmOffer] = useState(false);
  const instructor = store.instructor(session.instructorId);
  const hasStarted = new Date(session.startsAt).getTime() <= Date.now();
  if (store.role !== 'client' || hasStarted || session.status === 'cancelled' || !instructor) return null;

  const booked = store.booked.has(session.id);
  const offers = store.spotOffers.filter((o) => o.classId === session.id && o.status === 'open');
  const mine = offers.find((o) => o.fromClientId === store.meId);
  const theirs = offers.find((o) => o.fromClientId !== store.meId);
  const waiting = store.waitlist.has(session.id);
  const first = instructor.name.split(' ')[0];

  return (
    <View style={styles.spot}>
      {mine ? (
        <View style={styles.spotBanner}>
          <Icon name="swap-horizontal" size={16} color="primaryDeep" />
          <Text variant="small" style={{ flex: 1 }}>
            You offered your spot. We&apos;ll tell you when someone claims it.
          </Text>
          <Text variant="smallStrong" color="primary" accessibilityRole="button" onPress={() => store.cancelOffer(mine.id)}>
            Take it back
          </Text>
        </View>
      ) : !booked && theirs ? (
        <View style={styles.spotBanner}>
          <Icon name="sparkles" size={16} color="primaryDeep" />
          <Text variant="small" style={{ flex: 1 }}>
            <Text variant="smallStrong">Spot open!</Text> {theirs.fromName} can&apos;t make it.
          </Text>
          <Button
            size="sm"
            label="Claim it"
            onPress={() => {
              store.claimSpot(theirs.id);
              toast(`It's yours! ${theirs.fromName} will move the booking to your name. ${session.title} is on your week.`);
            }}
          />
        </View>
      ) : booked ? (
        <Pressable onPress={() => setConfirmOffer(true)} accessibilityRole="button" style={styles.spotLink}>
          <Text variant="smallStrong" color="primary">
            Can&apos;t make it? Offer your spot ›
          </Text>
          <Chip label="Premium" icon="diamond-outline" tone="plum" />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {
            store.toggleWaitlist(session.id);
            toast(waiting ? 'Off the waitlist.' : `You're on the waitlist. If someone offers their spot in ${session.title}, you'll hear first.`);
          }}
          accessibilityRole="button"
          style={styles.spotLink}>
          <Icon name={waiting ? 'notifications' : 'notifications-outline'} size={14} color="primary" />
          <Text variant="smallStrong" color="primary">
            {waiting ? "You're on the waitlist · Leave" : 'Class full? Get alerted if a spot opens ›'}
          </Text>
        </Pressable>
      )}

      <ConfirmSheet
        open={confirmOffer}
        title="Offer your spot?"
        body={`We'll tell people waiting for this class and ${first}'s followers. When someone claims it, move your booking to their name with the studio (or where you booked) so you skip the late cancel fee.`}
        confirmLabel="Offer my spot"
        cancelLabel="Keep my spot"
        onConfirm={() => {
          store.offerSpot(session.id, me.name);
          toast('Your spot is up for grabs. We’ll let you know when someone claims it.');
        }}
        onClose={() => setConfirmOffer(false)}
      />
    </View>
  );
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
              const total = store.attendance.filter((a) => a.clientId === store.meId && a.instructorId === instructor.id).length + 1;
              toast(`Logged. That's ${total} with ${first}.`, { label: 'Undo', onPress: () => store.toggleAttended(session) });
            }
          }}
        />
      ) : store.booked.has(session.id) ? (
        <>
          <Button
            size={size}
            kind="primary"
            icon="checkmark-circle"
            label="I'm booked"
            accessibilityLabel={`You're booked for ${session.title}. Tap to undo.`}
            onPress={() => {
              store.toggleBooked(session.id);
              toast(`Took ${session.title} off your week.`, { label: 'Undo', onPress: () => store.toggleBooked(session.id) });
            }}
          />
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
      ) : (
        <>
          <Button size={size} kind="ink" label="Book it" onPress={() => setBooking(true)} />
          <Button
            size={size}
            kind="outline"
            icon="checkmark"
            label="Booked it"
            accessibilityLabel={`I already booked ${session.title}`}
            onPress={() => {
              store.toggleBooked(session.id);
              toast(`${session.title} is on your week. See you there!`, { label: 'Undo', onPress: () => store.toggleBooked(session.id) });
            }}
          />
        </>
      )}
      <SpotRow session={session} />
      {booking ? (
        <BookingSheet
          open={booking}
          onClose={() => setBooking(false)}
          session={session}
          instructor={instructor}
          studio={studio}
          onOpened={() =>
            toast('Got your spot? Add it to your week.', {
              label: 'Booked it',
              onPress: () => {
                if (!store.booked.has(session.id)) store.toggleBooked(session.id);
              },
            })
          }
        />
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

  const isBooked = store.role === 'client' && store.booked.has(session.id) && !cancelled;

  return (
    <Row
      onPress={() => router.push({ pathname: '/class/[id]', params: { id: session.id } })}
      style={[styles.classRow, cancelled && { opacity: 0.55 }, isBooked && styles.bookedRow]}>
      <View style={styles.timeCol}>
        <Text variant="title" style={cancelled && styles.struck}>
          {time}
        </Text>
        <Text variant="eyebrow" color="textSecondary">
          {meridiem} · {session.durationMin}M
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        {isBooked ? (
          <Text variant="eyebrow" color="primary">
            ✓ You&apos;re booked
          </Text>
        ) : null}
        <Text variant="heading" style={cancelled && styles.struck}>
          {session.title}
        </Text>
        <Text variant="small" color="textSecondary">
          {showInstructor ? (
            <>
              with{' '}
              <Text variant="smallStrong" color="primary" onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })}>
                {instructor.name}
              </Text>{' '}
              at{' '}
            </>
          ) : null}
          {studio.name} · {styleLabel(session.style)}
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
    <Row onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })} style={styles.instructorRow}>
      <Avatar name={instructor.name} size={52} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.inline}>
          <Text variant="heading">{instructor.name}</Text>
          {instructor.isFounding ? <Icon name="sparkles" size={13} color="primary" /> : null}
        </View>
        <Text variant="small" color="textSecondary">
          {instructor.styles.map(styleLabel).join(' · ')} · {instructor.neighborhood}
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

export function PostCard({ post, showAuthor = false }: { post: Post; showAuthor?: boolean }) {
  const store = useStore();
  const toast = useToast();
  const instructor = store.instructor(post.instructorId);
  if (!instructor) return null;

  const isOwner = store.role === 'instructor' && store.meId === post.instructorId;

  return (
    <Row style={{ gap: Spacing.sm }}>
      {showAuthor ? (
        <Pressable style={styles.inline} onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })} accessibilityRole="link">
          <Avatar name={instructor.name} size={24} />
          <Text variant="smallStrong" color="primary">
            {instructor.name}
          </Text>
        </Pressable>
      ) : null}
      <View style={styles.inline}>
        <Icon name={postIcons[post.kind]} size={14} color="primary" />
        <Text variant="eyebrow" color="textSecondary">
          {postKindLabel[post.kind]} · {relativeTime(post.createdAt)}
        </Text>
        <View style={{ flex: 1 }} />
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
        ) : post.instructorId !== store.meId ? (
          <SafetyMenu targetType="post" targetId={post.id} personId={instructor.id} personName={instructor.name} size={18} />
        ) : null}
      </View>

      <Text variant="heading">{post.title}</Text>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" accessibilityLabel={`Photo for ${post.title}`} />
      ) : null}
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
    </Row>
  );
}

const styles = StyleSheet.create({
  classRow: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start' },
  timeCol: { width: 64, gap: 2 },
  struck: { textDecorationLine: 'line-through' },
  spot: { marginTop: Spacing.sm },
  spotLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  spotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  bookedRow: { borderLeftWidth: 3, borderLeftColor: Colors.primary, paddingLeft: Spacing.md, backgroundColor: Colors.primarySoft },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  postImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.sm, backgroundColor: Colors.surface },
});
