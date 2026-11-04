import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BirthdayCard } from '@/components/birthday-card';
import { MyClassesPanel } from '@/components/my-classes';
import { Screen } from '@/components/screen';
import { Avatar, Row, Chip, Icon, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { daysUntilBirthday, sinceLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { clientName } from '@/lib/names';
import { Tip } from '@/components/tip';

export default function ActivityScreen() {
  const { role } = useStore();
  return role === 'instructor' ? (
    <ClientList />
  ) : (
    <Screen eyebrow="Your receipts" title="My classes" subtitle="Every class counts. Literally, we count them.">
      <MyClassesPanel />
    </Screen>
  );
}

/* ---------- Instructor: client list ---------- */

function ClientList() {
  const store = useStore();
  const [query, setQuery] = useState('');

  const rows = store.clients
    .map((c) => {
      const visits = store.attendance.filter((a) => a.clientId === c.id && a.instructorId === store.meId);
      const last = visits.map((v) => v.date).sort().at(-1);
      return { client: c, count: visits.length, last };
    })
    .filter((r) => r.client.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.count - a.count);

  return (
    <Screen eyebrow="Your people" title="Followers" subtitle={`${store.clients.length} ${store.clients.length === 1 ? 'person follows' : 'people follow'} you. Everyone who follows you lands here automatically.`}>
      <Tip id="tip-followers" text="Everyone who follows you. Tap a name for their birthday, class history and your private notes." pointer="none" />
      <BirthdayCard />
      <View style={styles.search}>
        <Icon name="search" size={18} color="textMuted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search followers"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <View>
        {rows.map(({ client, count, last }) => {
          const bday = client.birthday ? daysUntilBirthday(client.birthday) : null;
          return (
            <Row
              key={client.id}
              onPress={() => router.push({ pathname: '/client/[id]', params: { id: client.id } })}
              style={styles.clientRow}>
              <Avatar name={client.name} size={46} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="heading">{clientName(client.name)}</Text>
                <Text variant="small" color="textSecondary">
                  {count} {count === 1 ? 'class' : 'classes'} with you
                  {last ? ` · last class ${sinceLabel(last)}` : ' · new follower'}
                </Text>
                <View style={styles.tagRow}>
                  {client.isPremium ? <Chip label="Premium" icon="diamond-outline" tone="blush" /> : null}
                  {bday !== null && bday <= 7 ? (
                    <Chip label={bday === 0 ? 'Birthday today' : `Bday in ${bday}d`} icon="gift-outline" tone="warn" />
                  ) : null}
                </View>
              </View>
              <Icon name="chevron-forward" size={18} color="textMuted" />
            </Row>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  stat: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bars: { gap: Spacing.lg, marginBottom: Spacing.xxl },
  barLabel: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  track: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceStrong, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    height: 46,
    marginBottom: Spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, height: '100%' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
