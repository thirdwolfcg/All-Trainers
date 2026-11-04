import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ClassCard, PostCard, useFollowToggle } from '@/components/cards';
import { SocialLinks } from '@/components/social-links';
import { Screen } from '@/components/screen';
import { Avatar, Button, Card, EmptyState, Icon, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { addDays, dayLabel, isSameDay, startOfDay } from '@/lib/dates';
import { bringAFriendMessage, shareInvite, textInvite } from '@/lib/invite';
import { followUrl } from '@/lib/links';
import { useToast } from '@/lib/toast';
import { useMe } from '@/lib/me';
import { useStore } from '@/lib/store';
import { StyleLabels } from '@/lib/types';
import { Tip } from '@/components/tip';

export default function InstructorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const toast = useToast();
  const toggleFollow = useFollowToggle();
  const me = useMe();
  const [tab, setTab] = useState<'schedule' | 'feed'>('schedule');
  const instructor = store.instructor(id);

  if (!instructor) {
    return (
      <Screen nav padTop={false}>
        <EmptyState icon="alert-circle-outline" title="Instructor not found" body="This profile may have moved." />
      </Screen>
    );
  }

  const isClient = store.role === 'client';
  const isFollowing = store.following.has(instructor.id);
  const today = startOfDay(new Date());
  const upcoming = store.classes.filter(
    (c) => c.instructorId === instructor.id && new Date(c.startsAt) >= today && new Date(c.startsAt) < addDays(today, 7),
  );
  const studioCount = new Set(upcoming.map((c) => c.studioId)).size;
  const posts = store.posts
    .filter((p) => p.instructorId === instructor.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
    .map((d) => ({ d, classes: upcoming.filter((c) => isSameDay(new Date(c.startsAt), d)) }))
    .filter((g) => g.classes.length);

  const hasPremium = store.premium.has(instructor.id);
  const isOwnProfile = store.role === 'instructor' && store.meId === instructor.id;

  return (
    <>
      <Stack.Screen options={{ title: `@${instructor.handle}` }} />
      <Screen nav padTop={false}>
        <View style={styles.header}>
          {instructor.isFounding ? (
            <Text variant="eyebrow" color="primary">
              Founding instructor
            </Text>
          ) : null}
          <View style={styles.identity}>
            <Avatar name={instructor.name} size={76} square />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="display">{instructor.name}</Text>
              <Text variant="small" color="textSecondary">
                {instructor.styles.map((s) => StyleLabels[s]).join(' and ')} · {instructor.neighborhood}
              </Text>
            </View>
          </View>
          <SocialLinks instructor={instructor} />
          <Text variant="quote" color="text">
            “{instructor.bio}”
          </Text>

          <View style={styles.stats}>
            <Stat value={upcoming.filter((c) => c.status !== 'cancelled').length} label="classes this week" />
            <View style={styles.statDivider} />
            <Stat value={studioCount} label={studioCount === 1 ? 'studio' : 'studios'} />
          </View>

          {isClient ? (
            <View style={styles.buttons}>
              <Button
                kind={isFollowing ? 'soft' : 'primary'}
                icon={isFollowing ? 'checkmark' : 'add'}
                label={isFollowing ? 'Following' : 'Follow'}
                onPress={() => toggleFollow(instructor)}
                accessibilityLabel={isFollowing ? `Unfollow ${instructor.name}` : `Follow ${instructor.name}`}
                style={{ flex: 1 }}
              />
              <Button
                kind="outline"
                icon="chatbubble-outline"
                label="Message"
                onPress={() => {
                  // Messaging is for followers, so a message follows them too (and says so).
                  if (!isFollowing) {
                    store.toggleFollow(instructor.id);
                    toast(`Followed ${instructor.name.split(' ')[0]} so you can message them.`);
                  }
                  const conv = store.conversationWith(instructor.id, store.meId);
                  router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
                }}
                style={{ flex: 1 }}
              />
            </View>
          ) : null}

          {isOwnProfile ? (
            <Button kind="outline" icon="create-outline" label="Edit profile" onPress={() => router.push('/profile/edit')} style={{ marginBottom: Spacing.sm }} />
          ) : null}
          {isOwnProfile ? (
            <View style={styles.buttons}>
              <Button kind="primary" icon="qr-code-outline" label="My QR code" onPress={() => router.push('/qr')} style={{ flex: 1 }} />
              <Button
                kind="outline"
                icon="share-outline"
                label="Share my link"
                onPress={() => shareInvite(`Follow me on All Trainers to see where I'm teaching this week: ${followUrl(instructor.handle)}`)}
                style={{ flex: 1 }}
              />
            </View>
          ) : null}

          {isClient ? (
            <View style={styles.friendRow}>
              <Text variant="small" color="textSecondary" style={{ flex: 1 }}>
                Workouts hit different with a friend.
              </Text>
              <Button
                size="sm"
                kind="ghost"
                icon="people-outline"
                label="Bring a friend"
                onPress={() => {
                  const message = bringAFriendMessage({
                    fromName: me.name,
                    refId: me.refId,
                    instructorName: instructor.name,
                    instructorHandle: instructor.handle,
                  });
                  // Phones: open Messages. Web: the share sheet works on laptops too.
                  if (Platform.OS === 'web') shareInvite(message);
                  else textInvite(message);
                }}
              />
            </View>
          ) : null}
        </View>

        {isClient && !hasPremium ? (
          <Card tone="purple" style={styles.premium}>
            <Icon name="diamond-outline" size={22} color="primaryDeep" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading" color="primaryDeep">
                Join {instructor.name.split(' ')[0]}&apos;s inner circle
              </Text>
              <Text variant="small" color="textSecondary">
                Form tips, extras and one on one time. Coming soon.
              </Text>
            </View>
          </Card>
        ) : null}

        {store.role === 'client' ? (
          <Tip id="tip-feed" text="Their playlists, recipes, videos and tips live in Feed." />
        ) : null}
        <View style={styles.tabs}>
          {(['schedule', 'feed'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}>
              <Text variant="eyebrow" color={tab === t ? 'text' : 'textSecondary'}>
                {t === 'schedule' ? 'This week' : 'Feed'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'schedule' ? (
          days.length ? (
            days.map((g) => (
              <View key={g.d.toISOString()} style={{ marginBottom: Spacing.xl }}>
                <Text variant="eyebrow" color="textSecondary">
                  {dayLabel(g.d)}
                </Text>
                {g.classes.map((c) => (
                  <ClassCard key={c.id} session={c} showInstructor={false} />
                ))}
              </View>
            ))
          ) : (
            <EmptyState icon="calendar-outline" title="Nothing on the books" body="Follow to get a ping the second new classes drop." />
          )
        ) : (
          <>
            {isOwnProfile ? (
              <Button icon="create-outline" label="New post" onPress={() => router.push('/post/new')} style={{ marginBottom: Spacing.md }} />
            ) : null}
            {posts.length ? (
              <View>
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="images-outline"
                title="No posts yet"
                body={isOwnProfile ? 'Share an update, a recipe or a playlist. Your followers see it here.' : 'Recipes, playlists and updates land here.'}
              />
            )}
          </>
        )}
      </Screen>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, gap: 2, paddingVertical: Spacing.md }}>
      <Text variant="title">{value}</Text>
      <Text variant="eyebrow" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.lg, paddingTop: Spacing.sm, marginBottom: Spacing.xl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: Colors.border },
  buttons: { flexDirection: 'row', gap: Spacing.sm },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: -Spacing.sm },
  premium: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: Colors.primary },
});
