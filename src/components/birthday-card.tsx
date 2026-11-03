import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Icon, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { daysUntilBirthday } from '@/lib/dates';
import { clientName } from '@/lib/names';
import { useStore } from '@/lib/store';

/** Clients with a birthday in the next week. Shows nothing when there are none. */
export function BirthdayCard() {
  const store = useStore();
  const soon = store.clients
    .filter((c) => c.birthday && daysUntilBirthday(c.birthday) <= 7)
    .sort((a, b) => daysUntilBirthday(a.birthday!) - daysUntilBirthday(b.birthday!));
  if (!soon.length) return null;

  return (
    <Card tone="gray" style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
      <View style={styles.inline}>
        <Icon name="gift-outline" size={18} color="primary" />
        <Text variant="eyebrow" color="primary">
          Birthday szn
        </Text>
      </View>
      {soon.map((c) => {
        const n = daysUntilBirthday(c.birthday!);
        return (
          <View key={c.id} style={styles.inline}>
            <Pressable
              style={[styles.inline, { flex: 1 }]}
              onPress={() => router.push({ pathname: '/client/[id]', params: { id: c.id } })}
              accessibilityRole="link"
              accessibilityLabel={`Open ${clientName(c.name)}'s profile`}>
              <Avatar name={c.name} size={32} plain />
              <Text variant="body" style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={{ textDecorationLine: 'underline' }}>
                  {clientName(c.name)}
                </Text>
                {n === 0 ? ' is celebrating today' : n === 1 ? ' tomorrow' : ` in ${n} days`}
              </Text>
            </Pressable>
            <Button
              size="sm"
              kind="outline"
              label="Send love"
              onPress={() => {
                const conv = store.conversationWith(store.meId, c.id);
                router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
              }}
            />
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
