import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useFollowToggle } from '@/components/cards';
import { Screen } from '@/components/screen';
import { SocialLinks } from '@/components/social-links';
import { Avatar, Button, EmptyState, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { addDays, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { StyleLabels } from '@/lib/types';

/**
 * Where an instructor's QR code or shared link lands. Open to everyone,
 * signed in or not, so a scan always shows something useful.
 */
export default function FollowLanding() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const store = useStore();
  const auth = useAuth();
  const toggleFollow = useFollowToggle();
  const instructor = handle ? store.instructorByHandle(handle) : undefined;

  if (!instructor) {
    return (
      <Screen>
        <EmptyState icon="search" title="Can't find that instructor" body="The code may be old. Ask them to show you their QR code again." />
        <Button label="Go to All Trainers" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const first = instructor.name.split(' ')[0];
  const inApp = auth.demo || (!!auth.session && !!auth.profile);
  const isClient = inApp && store.role === 'client';
  const following = store.following.has(instructor.id);
  const today = startOfDay(new Date());
  const thisWeek = store.classes.filter(
    (c) => c.instructorId === instructor.id && c.status !== 'cancelled' && new Date(c.startsAt) >= today && new Date(c.startsAt) < addDays(today, 7),
  );
  const studioNames = [...new Set(thisWeek.map((c) => store.studio(c.studioId)?.name).filter(Boolean))];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <View style={styles.card}>
          <Text variant="eyebrow" color="primary">
            All Trainers
          </Text>
          <Avatar name={instructor.name} size={88} ring />
          <Text variant="display" align="center">
            {instructor.name}
          </Text>
          <Text variant="small" color="textSecondary" align="center">
            {instructor.styles.map((s) => StyleLabels[s]).join(' and ')} · {instructor.neighborhood}, Denver
          </Text>
          <SocialLinks instructor={instructor} />
          <Text variant="quote" align="center" style={{ marginTop: Spacing.sm }}>
            “{instructor.bio}”
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {thisWeek.length} {thisWeek.length === 1 ? 'class' : 'classes'} this week
            {studioNames.length ? ` at ${studioNames.join(', ')}` : ''}
            {/* avoid a double period after names like "Pointe Barre Co." */}
            {studioNames.at(-1)?.endsWith('.') ? '' : '.'}
          </Text>
        </View>

        {isClient ? (
          following ? (
            <View style={{ gap: Spacing.sm }}>
              <Text variant="bodyStrong" align="center">
                You follow {first}. Their classes are on your home screen.
              </Text>
              <Button label={`See ${first}'s week`} onPress={() => router.replace({ pathname: '/instructor/[id]', params: { id: instructor.id } })} />
            </View>
          ) : (
            <Button
              icon="add"
              label={`Follow ${first}`}
              onPress={() => {
                toggleFollow(instructor);
                router.replace({ pathname: '/instructor/[id]', params: { id: instructor.id } });
              }}
            />
          )
        ) : inApp ? (
          <Button label={`See ${first}'s profile`} onPress={() => router.replace({ pathname: '/instructor/[id]', params: { id: instructor.id } })} />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            <Button
              icon="add"
              label={`Follow ${first}`}
              onPress={() => {
                // Remember who they wanted to follow, then follow right after sign up.
                store.setPendingFollow(instructor.id);
                router.replace('/sign-up');
              }}
            />
            <Text variant="small" color="textSecondary" align="center">
              Free account, takes a sec. You&apos;ll see every class {first} teaches, at every studio.
            </Text>
            <Button
              kind="ghost"
              label="I already have an account"
              onPress={() => {
                store.setPendingFollow(instructor.id);
                router.replace('/sign-in');
              }}
            />
          </View>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
});
