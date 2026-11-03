import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Chip, Field, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { describeClass } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
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
  const { demo } = useAuth();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string>();
  const [suggestion, setSuggestion] = useState<string>();

  const askAi = async () => {
    setAiBusy(true);
    setAiError(undefined);
    const res = await describeClass(
      {
        title: title.trim(),
        style,
        durationMin: duration,
        studio: store.studio(studioId)?.name,
        notes: description,
      },
      { demo },
    );
    setAiBusy(false);
    if (res.description) setSuggestion(res.description);
    else setAiError(res.error);
  };

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
        {suggestion ? (
          <Card tone="purple" style={{ gap: Spacing.md }}>
            <Text variant="eyebrow" color="primary">
              Here&apos;s a draft
            </Text>
            <Text variant="body">{suggestion}</Text>
            <View style={styles.wrap}>
              <Button
                size="sm"
                icon="checkmark"
                label="Use this"
                onPress={() => {
                  setDescription(suggestion);
                  setSuggestion(undefined);
                }}
              />
              <Button size="sm" kind="outline" icon="refresh" label={aiBusy ? 'Writing…' : 'Try another'} disabled={aiBusy} onPress={askAi} />
              <Button size="sm" kind="ghost" label="Never mind" onPress={() => setSuggestion(undefined)} />
            </View>
            <Text variant="small" color="textSecondary">
              {demo
                ? 'Preview mode uses a sample writer. Signed-in instructors get the real AI.'
                : 'Written with AI. Give it a read and make it sound like you before you post.'}
            </Text>
          </Card>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            <Button
              kind="soft"
              size="sm"
              icon="sparkles-outline"
              label={aiBusy ? 'Writing…' : description.trim() ? 'Polish what I wrote' : 'Help me write it'}
              disabled={aiBusy || title.trim().length < 2}
              onPress={askAi}
              style={{ alignSelf: 'flex-start' }}
            />
            <Text variant="small" color="textSecondary">
              {title.trim().length < 2
                ? 'Add a class name and AI can draft this for you.'
                : 'Jot a few words above (level, vibe, what to bring) for a better draft.'}
            </Text>
          </View>
        )}
        {aiError ? (
          <Text variant="small" color="blushDeep">
            {aiError}
          </Text>
        ) : null}
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
