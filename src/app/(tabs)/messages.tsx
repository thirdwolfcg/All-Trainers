import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Avatar, Card, EmptyState, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { relativeTime } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function MessagesScreen() {
  const store = useStore();
  const isInstructor = store.role === 'instructor';

  const mine = store.conversations
    .filter((c) => (isInstructor ? c.instructorId === store.meId : c.clientId === store.meId))
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => (b.messages.at(-1)?.sentAt ?? '').localeCompare(a.messages.at(-1)?.sentAt ?? ''));

  const nameFor = (otherId: string) =>
    isInstructor
      ? (store.clients.find((c) => c.id === otherId)?.name ?? 'Client')
      : (store.instructor(otherId)?.name ?? 'Instructor');

  return (
    <Screen title="Messages" subtitle={isInstructor ? 'Your clients, all in one inbox.' : 'Slide into your instructor’s DMs. Respectfully.'}>
      {mine.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No messages yet" body="Start a chat from an instructor's profile." />
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {mine.map((c) => {
            const otherId = isInstructor ? c.clientId : c.instructorId;
            const last = c.messages.at(-1)!;
            const unread = last.senderId !== store.meId;
            return (
              <Card
                key={c.id}
                tone="plain"
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
                style={styles.row}>
                <Avatar name={nameFor(otherId)} size={48} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.top}>
                    <Text variant="heading" style={{ flex: 1 }}>
                      {nameFor(otherId)}
                    </Text>
                    <Text variant="small" color="textMuted">
                      {relativeTime(last.sentAt)}
                    </Text>
                  </View>
                  <Text variant={unread ? 'smallStrong' : 'small'} color={unread ? 'text' : 'textSecondary'} numberOfLines={1}>
                    {last.senderId === store.meId ? 'You: ' : ''}
                    {last.body}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
