import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Avatar, Button, Card, Chip, EmptyState, Icon, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { birthdayLabel, daysUntilBirthday, sinceLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const client = store.clients.find((c) => c.id === id);
  const [notes, setNotes] = useState(client?.preferences ?? '');

  if (!client) {
    return (
      <Screen padTop={false}>
        <EmptyState icon="person-outline" title="Client not found" body="They may have unfollowed." />
      </Screen>
    );
  }

  const visits = store.attendance
    .filter((a) => a.clientId === client.id && a.instructorId === store.meId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const byStudio = new Map<string, number>();
  visits.forEach((v) => byStudio.set(v.studioId, (byStudio.get(v.studioId) ?? 0) + 1));
  const bday = client.birthday ? daysUntilBirthday(client.birthday) : null;

  return (
    <>
      <Stack.Screen options={{ title: client.name }} />
      <Screen padTop={false}>
        <View style={styles.header}>
          <Avatar name={client.name} size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{client.name}</Text>
            <Text variant="small" color="textSecondary">
              Followed you {sinceLabel(client.followedAt)}
            </Text>
            <View style={styles.chips}>
              {client.isPremium ? <Chip label="Premium" icon="diamond-outline" tone="blush" /> : null}
              {client.birthday ? (
                <Chip
                  label={bday === 0 ? 'Birthday today' : birthdayLabel(client.birthday)}
                  icon="gift-outline"
                  tone={bday !== null && bday <= 7 ? 'warn' : 'default'}
                />
              ) : null}
            </View>
          </View>
        </View>

        <Button
          icon="chatbubble-outline"
          label={`Message ${client.name.split(' ')[0]}`}
          onPress={() => {
            const conv = store.conversationWith(store.meId, client.id);
            router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
          }}
          style={{ marginBottom: Spacing.xl }}
        />

        <View style={styles.stats}>
          <Card tone="purple" style={{ flex: 1 }}>
            <Text variant="display" color="primaryDeep">
              {visits.length}
            </Text>
            <Text variant="smallStrong" color="primaryDeep">
              classes with you
            </Text>
          </Card>
          <Card tone="surface" style={{ flex: 1 }}>
            <Text variant="title">{visits[0] ? sinceLabel(visits[0].date) : 'Not yet'}</Text>
            <Text variant="smallStrong" color="textSecondary">
              last class
            </Text>
          </Card>
        </View>

        {byStudio.size ? (
          <Card tone="plain" style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <Text variant="heading">Where they take your class</Text>
            {[...byStudio.entries()].map(([sid, n]) => (
              <View key={sid} style={styles.row}>
                <Icon name="location-outline" size={16} color="textSecondary" />
                <Text variant="body" style={{ flex: 1 }}>
                  {store.studio(sid)?.name}
                </Text>
                <Text variant="bodyStrong">{n}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Text variant="heading" style={{ marginBottom: Spacing.sm }}>
          Your notes
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Favorite spot, goals, music taste, anything to remember"
          placeholderTextColor={Colors.textMuted}
          multiline
          style={styles.notes}
        />
        <View style={styles.row}>
          <Icon name="lock-closed-outline" size={14} color="textMuted" />
          <Text variant="small" color="textMuted" style={{ flex: 1 }}>
            Only you can see these notes. {client.name.split(' ')[0]} can&apos;t.
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xl, paddingTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  stats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notes: {
    minHeight: 110,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    fontSize: 15,
    color: Colors.text,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
});
