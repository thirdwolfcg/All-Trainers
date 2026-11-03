import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ClassActions, PostCard, useFollowToggle } from '@/components/cards';
import { InstructorClassActions } from '@/components/instructor-class-actions';
import { Screen } from '@/components/screen';
import { Avatar, Button, Chip, EmptyState, Icon, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { dayLabel, timeRange } from '@/lib/dates';
import { linkButton } from '@/lib/links';
import { useStore } from '@/lib/store';
import { StyleLabels } from '@/lib/types';

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const toggleFollow = useFollowToggle();
  const session = store.classes.find((c) => c.id === id);
  const instructor = session ? store.instructor(session.instructorId) : undefined;
  const recipe = session?.recipePostId ? store.posts.find((p) => p.id === session.recipePostId) : undefined;
  const studio = session ? store.studio(session.studioId) : undefined;

  if (!session || !instructor || !studio) {
    return (
      <Screen padTop={false}>
        <EmptyState icon="calendar-outline" title="Class not found" body="It may have been removed from the schedule." />
      </Screen>
    );
  }

  const start = new Date(session.startsAt);
  const sub = session.subInstructorId ? store.instructor(session.subInstructorId) : undefined;
  const isOwner = store.role === 'instructor' && store.meId === session.instructorId;
  const isClient = store.role === 'client';
  const following = store.following.has(instructor.id);

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <Screen padTop={false}>
        <View style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
          <Text variant="eyebrow" color="textSecondary">
            {dayLabel(start)} · {StyleLabels[session.style]}
          </Text>
          <Text variant="display">{session.title}</Text>
          {session.status === 'cancelled' ? (
            <View style={{ flexDirection: 'row' }}>
              <Chip tone="warn" icon="close-circle-outline" label={session.note ?? 'Cancelled'} />
            </View>
          ) : session.status === 'subbed' && sub ? (
            <View style={{ flexDirection: 'row' }}>
              <Chip tone="mint" icon="swap-horizontal" label={`${sub.name} is subbing`} />
            </View>
          ) : session.status === 'sub_needed' ? (
            <View style={{ flexDirection: 'row' }}>
              <Chip tone="warn" icon="swap-horizontal" label={isOwner ? 'Looking for a sub' : 'Might have a sub'} />
            </View>
          ) : null}
        </View>

        <View style={styles.facts}>
          <Fact icon="time-outline" title={timeRange(start, session.durationMin)} sub={`${session.durationMin} minutes`} />
          <Fact icon="location-outline" title={studio.name} sub={`${studio.address} · ${studio.neighborhood}`} />
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: instructor.id } })}
          style={styles.instructor}
          accessibilityRole="link"
          accessibilityLabel={`See ${instructor.name}'s profile`}>
          <Avatar name={instructor.name} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="eyebrow" color="textSecondary">
              Your instructor
            </Text>
            <Text variant="heading">{instructor.name}</Text>
          </View>
          {isClient ? (
            <Button
              size="sm"
              kind={following ? 'soft' : 'primary'}
              label={following ? 'Following' : 'Follow'}
              onPress={() => toggleFollow(instructor)}
            />
          ) : (
            <Icon name="chevron-forward" size={18} color="textSecondary" />
          )}
        </Pressable>

        <View style={{ gap: Spacing.sm, marginVertical: Spacing.xl }}>
          <Text variant="eyebrow" color="textSecondary">
            What to expect
          </Text>
          <Text variant="body">
            {session.description ?? `${instructor.name.split(' ')[0]} hasn't added a description yet. Slide into their DMs if you have questions.`}
          </Text>
        </View>

        {session.playlistUrl || recipe ? (
          <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
            <Text variant="eyebrow" color="textSecondary">
              Extras
            </Text>
            {session.playlistUrl ? (
              <Button
                kind="outline"
                icon={linkButton(session.playlistUrl, 'playlist').icon}
                label={linkButton(session.playlistUrl, 'playlist').label === 'Open playlist' ? 'The class playlist' : linkButton(session.playlistUrl, 'playlist').label}
                onPress={() => Linking.openURL(session.playlistUrl!)}
                style={{ alignSelf: 'flex-start' }}
              />
            ) : null}
            {recipe ? <PostCard post={recipe} /> : null}
          </View>
        ) : null}

        {isClient ? <ClassActions session={session} size="md" /> : null}
        {isOwner ? <InstructorClassActions session={session} align="start" /> : null}

        {isClient ? (
          <Text variant="small" color="textSecondary" style={{ marginTop: Spacing.lg }}>
            Booking, payment and late cancel fees are handled by where you book, not by All Trainers.
          </Text>
        ) : null}
      </Screen>
    </>
  );
}

function Fact({ icon, title, sub }: { icon: React.ComponentProps<typeof Icon>['name']; title: string; sub: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={18} color="primary" />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="small" color="textSecondary">
          {sub}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  facts: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  fact: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
});
