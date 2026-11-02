import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Chip, Field, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addDays, dayLabel, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { StyleLabels, type Style } from '@/lib/types';

const styleOptions: Style[] = ['pilates', 'yoga', 'cycle', 'barre', 'strength', 'hiit', 'dance'];
const durations = [30, 45, 50, 55, 60, 75, 90];

// Every 15 minutes from 5:00 AM to 9:00 PM
const times = Array.from({ length: (21 - 5) * 4 + 1 }, (_, i) => {
  const mins = 5 * 60 + i * 15;
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
});

function timeText(t: string) {
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="eyebrow" color="textSecondary" style={{ marginBottom: Spacing.sm, marginTop: Spacing.xl }}>
      {children}
    </Text>
  );
}

export default function NewClass() {
  const store = useStore();
  const toast = useToast();
  const me = store.instructor(store.meId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      description: description.trim() || undefined,
      style,
      startsAt: start.toISOString(),
      durationMin: duration,
    });
    toast(`${title.trim()} is on your schedule. Your followers can see it now.`);
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        Your followers see it the second you post it.
      </Text>

      <View style={{ marginTop: Spacing.xl, gap: Spacing.xl }}>
        <Field label="Class name" value={title} onChangeText={setTitle} placeholder="Reformer Flow" />
        <Field
          label="What's it about?"
          value={description}
          onChangeText={setDescription}
          placeholder="The vibe, the level, what to bring. Grip socks? Beginners welcome?"
          multiline
          maxLength={1000}
          style={{ minHeight: 96, paddingTop: 12, textAlignVertical: 'top' }}
          hint="Optional, but clients love knowing what they're signing up for."
        />
      </View>

      <Label>Style</Label>
      <View style={styles.wrap}>
        {styleOptions.map((s) => (
          <Chip key={s} label={StyleLabels[s]} selected={style === s} onPress={() => setStyle(s)} />
        ))}
      </View>

      <Label>Studio</Label>
      <View style={styles.wrap}>
        {store.studios.map((s) => (
          <Chip key={s.id} label={s.name} selected={studioId === s.id} onPress={() => setStudioId(s.id)} />
        ))}
      </View>

      <Label>Day</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        {Array.from({ length: 14 }, (_, i) => (
          <Chip key={i} label={dayLabel(addDays(today, i))} selected={dayOffset === i} onPress={() => setDayOffset(i)} />
        ))}
      </ScrollView>

      <Label>Start time</Label>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.sm }}
        contentOffset={{ x: 52 * 70, y: 0 }}>
        {times.map((t) => (
          <Chip key={t} label={timeText(t)} selected={time === t} onPress={() => setTime(t)} />
        ))}
      </ScrollView>
      <Text variant="small" color="textSecondary" style={{ marginTop: Spacing.sm }}>
        Swipe for more times. Selected: {timeText(time)}
      </Text>

      <Label>Length</Label>
      <View style={styles.wrap}>
        {durations.map((d) => (
          <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>

      <Button label="Post it" icon="checkmark" disabled={!canSave} onPress={save} style={{ marginTop: Spacing.xxl }} />
      {!canSave ? (
        <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.sm }}>
          Add a class name to post it.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
