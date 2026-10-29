import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClassCard, PostCard } from '@/components/cards';
import { Screen } from '@/components/screen';
import { Avatar, Button, Card, Chip, EmptyState, Icon, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addDays, dayLabel, isSameDay, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { StyleLabels } from '@/lib/types';

export default function InstructorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
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
          <Avatar name={instructor.name} size={88} ring />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text variant="display" align="center">
              {instructor.name}
            </Text>
            <Text variant="small" color="textSecondary">
              @{instructor.handle} · {instructor.neighborhood}, Denver
            </Text>
          </View>
          <View style={styles.chipRow}>
            {instructor.styles.map((s) => (
              <Chip key={s} label={StyleLabels[s]} />
            ))}
            {instructor.isFounding ? <Chip label="Founding" icon="sparkles" tone="blush" /> : null}
          </View>
          <Text variant="body" color="textSecondary" align="center" style={{ maxWidth: 460 }}>
            {instructor.bio}
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
        </View>

        {isClient && !hasPremium ? (
          <Card tone="purple" style={styles.premium}>
            <Icon name="diamond-outline" size={22} color="primaryDeep" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading" color="primaryDeep">
                Go premium with {instructor.name.split(' ')[0]}
              </Text>
              <Text variant="small" color="textSecondary">
                Class playlists, form tips and one on one time. Coming soon.
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
              <Text variant="bodyStrong" color={tab === t ? 'primaryDeep' : 'textMuted'}>
                {t === 'schedule' ? 'This week' : 'Feed'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'schedule' ? (
          days.length ? (
            days.map((g) => (
              <View key={g.d.toISOString()} style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
                <Text variant="smallStrong" color="textSecondary">
                  {dayLabel(g.d)}
                </Text>
                {g.classes.map((c) => (
                  <ClassCard key={c.id} session={c} showInstructor={false} />
                ))}
              </View>
            ))
          ) : (
            <EmptyState icon="calendar-outline" title="No classes this week" body="Follow to get a ping when new ones drop." />
          )
        ) : posts.length ? (
          <View style={{ gap: Spacing.md }}>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        ) : (
          <EmptyState icon="images-outline" title="Nothing posted yet" body="Recipes, playlists and updates show up here." />
        )}
      </Screen>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text variant="title">{value}</Text>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm, marginBottom: Spacing.xl },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    maxWidth: 360,
  },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  buttons: { flexDirection: 'row', gap: Spacing.sm, width: '100%', maxWidth: 420 },
  premium: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: Colors.primary },
});
