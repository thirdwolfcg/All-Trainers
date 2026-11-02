import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClassCard, PostCard } from '@/components/cards';
import { Screen } from '@/components/screen';
import { Avatar, Button, Card, EmptyState, Icon, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { addDays, dayLabel, isSameDay, startOfDay } from '@/lib/dates';
import { bringAFriendMessage, shareInvite, textInvite } from '@/lib/invite';
import { useMe } from '@/lib/me';
import { useStore } from '@/lib/store';
import { StyleLabels } from '@/lib/types';

export default function InstructorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const me = useMe();
  const [tab, setTab] = useState<'schedule' | 'feed'>('schedule');
  const instructor = store.instructor(id);

  if (!instructor) {
    return (
      <Screen padTop={false}>
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

  return (
    <>
      <Stack.Screen options={{ title: `@${instructor.handle}` }} />
      <Screen padTop={false}>
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
                onPress={() => store.toggleFollow(instructor.id)}
                style={{ flex: 1 }}
              />
              <Button
                kind="outline"
                icon="chatbubble-outline"
                label="Message"
                disabled={!isFollowing}
                onPress={() => {
                  const conv = store.conversationWith(instructor.id, store.meId);
                  router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
                }}
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
                  // Phones: open Messages. Web: the share sheet is the friendlier default.
                  textInvite(message).catch(() => shareInvite(message));
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
        ) : posts.length ? (
          <View>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        ) : (
          <EmptyState icon="images-outline" title="No posts yet" body="Recipes, playlists and updates land here." />
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
