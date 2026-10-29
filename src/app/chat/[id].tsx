import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Icon, Text } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { timeLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const conv = store.conversations.find((c) => c.id === id);
  if (!conv) {
    return <EmptyState icon="chatbubble-outline" title="Chat not found" body="Head back and try again." />;
  }

  const isInstructor = store.role === 'instructor';
  const otherName = isInstructor
    ? (store.clients.find((c) => c.id === conv.clientId)?.name ?? 'Client')
    : (store.instructor(conv.instructorId)?.name ?? 'Instructor');

  const send = () => {
    store.sendMessage(conv.id, draft);
    setDraft('');
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Stack.Screen options={{ title: otherName }} />
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        {conv.messages.length === 0 ? (
          <EmptyState icon="hand-left-outline" title={`Say hi to ${otherName.split(' ')[0]}`} body="Messages stay between the two of you." />
        ) : (
          conv.messages.map((m) => {
            const mine = m.senderId === store.meId;
            return (
              <View key={m.id} style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text variant="body" color={mine ? 'onPrimary' : 'text'}>
                    {m.body}
                  </Text>
                </View>
                <Text variant="small" color="textMuted" style={{ marginTop: 2 }}>
                  {timeLabel(new Date(m.sentAt))}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.inputWrap}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={[styles.send, !draft.trim() && { opacity: 0.4 }]}>
            <Icon name="arrow-up" size={18} color="onPrimary" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  bubbleWrap: { maxWidth: '80%' },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.lg },
  mine: { backgroundColor: Colors.primary, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: Colors.surface, borderBottomLeftRadius: 6 },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingLeft: Spacing.lg,
    padding: 6,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, maxHeight: 120, paddingVertical: 8 },
  send: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
