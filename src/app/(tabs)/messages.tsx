import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NewMessageSheet } from '@/components/new-message-sheet';
import { Screen } from '@/components/screen';
import { Avatar, Button, Icon, Row, EmptyState, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { relativeTime } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { clientName } from '@/lib/names';
import { Tip } from '@/components/tip';

export default function MessagesScreen() {
  const store = useStore();
  const isInstructor = store.role === 'instructor';
  const [composing, setComposing] = useState(false);

  const mine = store.conversations
    .filter((c) => (isInstructor ? c.instructorId === store.meId : c.clientId === store.meId))
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => (b.messages.at(-1)?.sentAt ?? '').localeCompare(a.messages.at(-1)?.sentAt ?? ''));

  const nameFor = (otherId: string) =>
    isInstructor
      ? clientName(store.clients.find((c) => c.id === otherId)?.name ?? 'Client')
      : (store.instructor(otherId)?.name ?? 'Instructor');

  return (
    <Screen
      eyebrow="DMs"
      title="Messages"
      subtitle={isInstructor ? 'Your followers, all in one inbox.' : 'Slide into your instructor’s DMs. Respectfully.'}
      right={
        <Pressable onPress={() => setComposing(true)} style={styles.compose} accessibilityRole="button" accessibilityLabel="New message">
          <Icon name="create-outline" size={22} color="onPrimary" />
        </Pressable>
      }>
      <NewMessageSheet open={composing} onClose={() => setComposing(false)} />
      <Tip id="tip-message" text="Tap the pencil (top right) to start a new message." pointer="none" />
      {mine.length === 0 ? (
        <>
          <EmptyState
            icon="chatbubbles-outline"
            title="Quiet in here"
            body={isInstructor ? 'Message a follower to say hi, or wait for them to slide in.' : "Message an instructor you follow. They don't bite."}
          />
          <Button icon="create-outline" label="New message" onPress={() => setComposing(true)} />
        </>
      ) : (
        <View>
          {mine.map((c) => {
            const otherId = isInstructor ? c.clientId : c.instructorId;
            const last = c.messages.at(-1)!;
            const unread = last.senderId !== store.meId;
            return (
              <Row
                key={c.id}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
                style={styles.row}>
                <Avatar name={nameFor(otherId)} size={48} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.top}>
                    <Text variant="heading" style={{ flex: 1 }}>
                      {nameFor(otherId)}
                    </Text>
                    <Text variant="small" color="textSecondary">
                      {relativeTime(last.sentAt)}
                    </Text>
                  </View>
                  <Text variant={unread ? 'smallStrong' : 'small'} color={unread ? 'text' : 'textSecondary'} numberOfLines={1}>
                    {last.senderId === store.meId ? 'You: ' : ''}
                    {last.body}
                  </Text>
                </View>
              </Row>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  compose: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
