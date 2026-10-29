import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Chip, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addDays, dayLabel, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { StyleLabels, type Style } from '@/lib/types';

const styleOptions: Style[] = ['pilates', 'yoga', 'cycle', 'barre', 'strength', 'hiit', 'dance'];
const durations = [30, 45, 50, 60, 75];
const times = ['6:00', '7:00', '9:00', '9:30', '12:00', '17:30', '18:00', '19:30'];

function timeText(t: string) {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="caption" color="textMuted" style={{ marginBottom: Spacing.sm, marginTop: Spacing.xl }}>
      {children}
    </Text>
  );
}

export default function NewClass() {
  const store = useStore();
  const me = store.instructor(store.meId);
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState<Style>(me?.styles[0] ?? 'pilates');
  const [studioId, setStudioId] = useState(store.studios[0].id);
  const [dayOffset, setDayOffset] = useState(1);
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState(50);

  const today = startOfDay(new Date());
  const canSave = title.trim().length > 1;

  const save = () => {
    const [h, m] = time.split(':').map(Number);
    const start = addDays(today, dayOffset);
    start.setHours(h, m, 0, 0);
    store.addClass({
      instructorId: store.meId,
      studioId,
      title: title.trim(),
      style,
      startsAt: start.toISOString(),
      durationMin: duration,
    });
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        Your followers get a heads up when it&apos;s posted.
      </Text>

      <Label>CLASS NAME</Label>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Reformer Flow"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
      />

      <Label>STYLE</Label>
      <View style={styles.wrap}>
        {styleOptions.map((s) => (
          <Chip key={s} label={StyleLabels[s]} selected={style === s} onPress={() => setStyle(s)} />
        ))}
      </View>

      <Label>STUDIO</Label>
      <View style={styles.wrap}>
        {store.studios.map((s) => (
          <Chip key={s.id} label={s.name} selected={studioId === s.id} onPress={() => setStudioId(s.id)} />
        ))}
      </View>

      <Label>DAY</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        {Array.from({ length: 14 }, (_, i) => (
          <Chip key={i} label={dayLabel(addDays(today, i))} selected={dayOffset === i} onPress={() => setDayOffset(i)} />
        ))}
      </ScrollView>

      <Label>START TIME</Label>
      <View style={styles.wrap}>
        {times.map((t) => (
          <Chip key={t} label={timeText(t)} selected={time === t} onPress={() => setTime(t)} />
        ))}
      </View>

      <Label>LENGTH</Label>
      <View style={styles.wrap}>
        {durations.map((d) => (
          <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>

      <Button label="Post class" icon="checkmark" disabled={!canSave} onPress={save} style={{ marginTop: Spacing.xxl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    height: 48,
    fontSize: 15,
    color: Colors.text,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
