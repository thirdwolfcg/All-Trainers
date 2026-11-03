import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { clientName } from '@/lib/names';
import { useStore } from '@/lib/store';

import { Avatar, Icon, Text } from './ui';

/** Pick who to message: instructors you follow, or your followers if you teach. */
export function NewMessageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [query, setQuery] = useState('');
  const isInstructor = store.role === 'instructor';

  const people = isInstructor
    ? store.clients.map((c) => ({ id: c.id, name: clientName(c.name), sub: c.isPremium ? 'Premium' : undefined }))
    : store.instructors
        .filter((i) => store.following.has(i.id))
        .map((i) => ({ id: i.id, name: i.name, sub: `@${i.handle}` }));
  const q = query.trim().toLowerCase();
  const shown = people.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sub?.toLowerCase().includes(q));

  const start = (otherId: string) => {
    const conv = isInstructor ? store.conversationWith(store.meId, otherId) : store.conversationWith(otherId, store.meId);
    onClose();
    setQuery('');
    router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
        <View style={styles.inner}>
          <View style={styles.handle} />
          <Text variant="title">New message</Text>
          <Text variant="small" color="textSecondary" style={{ marginBottom: Spacing.md }}>
            {isInstructor ? 'Message anyone who follows you.' : 'Message an instructor you follow.'}
          </Text>
          <View style={styles.search}>
            <Icon name="search" size={16} color="textSecondary" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={isInstructor ? 'Search followers' : 'Search instructors'}
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              accessibilityLabel="Search people to message"
            />
          </View>
          <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
            {shown.length ? (
              shown.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => start(p.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${p.name}`}
                  style={({ pressed }) => [styles.person, pressed && { backgroundColor: Colors.surface }]}>
                  <Avatar name={p.name} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{p.name}</Text>
                    {p.sub ? (
                      <Text variant="small" color="textSecondary">
                        {p.sub}
                      </Text>
                    ) : null}
                  </View>
                  <Icon name="chatbubble-outline" size={18} color="primary" />
                </Pressable>
              ))
            ) : (
              <Text variant="body" color="textSecondary" style={{ paddingVertical: Spacing.lg }}>
                {people.length
                  ? 'No one by that name.'
                  : isInstructor
                    ? 'No followers yet. Share your QR code after class to grow your crew.'
                    : 'Follow an instructor first, then you can message them.'}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28,26,34,0.35)' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.xl, paddingTop: Spacing.md },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: Colors.text },
  person: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: 4, borderRadius: Radius.sm },
});
