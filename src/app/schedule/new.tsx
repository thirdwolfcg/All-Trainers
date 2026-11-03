import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

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
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type Repeat = 'once' | 'weekly' | 'biweekly';
const LENGTHS = [
  { weeks: 4, label: '1 month' },
  { weeks: 13, label: '3 months' },
  { weeks: 26, label: '6 months' },
];

// Every 15 minutes from 5:00 AM to 9:00 PM
const times = Array.from({ length: (21 - 5) * 4 + 1 }, (_, i) => {
  const mins = 5 * 60 + i * 15;
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
});

function timeText(t: string) {
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** A sideways row of time chips that opens scrolled to the selected time. */
function TimeRow({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const ref = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<string, number>>({});
  const scrolled = useRef(false);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
      {times.map((t) => (
        <View
          key={t}
          onLayout={(e) => {
            offsets.current[t] = e.nativeEvent.layout.x;
            if (t === value && !scrolled.current) {
              scrolled.current = true;
              ref.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - 24), animated: false });
            }
          }}>
          <Chip label={timeText(t)} selected={value === t} onPress={() => onChange(t)} />
        </View>
      ))}
    </ScrollView>
  );
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
  const [repeat, setRepeat] = useState<Repeat>('once');
  const [days, setDays] = useState<number[]>(() => [addDays(new Date(), 1).getDay()]);
  const [sameTime, setSameTime] = useState(true);
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [weeks, setWeeks] = useState(13);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [recipePostId, setRecipePostId] = useState<string>();
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

  const myRecipes = store.posts.filter((p) => p.instructorId === store.meId && p.kind === 'recipe');
  const playlistOk = !playlistUrl.trim() || /^https:\/\/\S+\.\S+/i.test(playlistUrl.trim());
  const timeFor = (weekday: number) => (sameTime ? time : (dayTimes[weekday] ?? time));

  /** Every date this class happens on, in order. */
  const occurrences = (): Date[] => {
    const at = (d: Date, t: string) => {
      const [h, m] = t.split(':').map(Number);
      const out = new Date(d);
      out.setHours(h, m, 0, 0);
      return out;
    };
    if (repeat === 'once') return [at(addDays(today, dayOffset), time)];
    const out: Date[] = [];
    const step = repeat === 'weekly' ? 1 : 2;
    for (let i = 1; i <= weeks * 7; i++) {
      const d = addDays(today, i);
      const weekIndex = Math.floor((i - 1) / 7);
      if (days.includes(d.getDay()) && weekIndex % step === 0) out.push(at(d, timeFor(d.getDay())));
    }
    return out;
  };

  const count = canSave ? occurrences().length : 0;
  const canPost = canSave && playlistOk && (repeat === 'once' || days.length > 0);

  const save = () => {
    const seriesId = repeat === 'once' ? undefined : `s${Date.now()}`;
    const base = {
      instructorId: store.meId,
      studioId,
      title: title.trim(),
      description: description.trim() || undefined,
      style,
      durationMin: duration,
      seriesId,
      playlistUrl: playlistUrl.trim() || undefined,
      recipePostId,
    };
    const dates = occurrences();
    store.addClasses(dates.map((d) => ({ ...base, startsAt: d.toISOString() })));
    toast(
      dates.length === 1
        ? `${title.trim()} is on your schedule. Your followers can see it now.`
        : `${dates.length} ${title.trim()} classes are on your schedule. Your followers can see them now.`,
    );
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

      <Label>How often?</Label>
      <View style={styles.wrap}>
        <Chip label="Just once" selected={repeat === 'once'} onPress={() => setRepeat('once')} />
        <Chip label="Every week" icon="repeat" selected={repeat === 'weekly'} onPress={() => setRepeat('weekly')} />
        <Chip label="Every other week" icon="repeat" selected={repeat === 'biweekly'} onPress={() => setRepeat('biweekly')} />
      </View>

      {repeat === 'once' ? (
        <>
          <Label>Day</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {Array.from({ length: 14 }, (_, i) => (
              <Chip key={i} label={dayLabel(addDays(today, i))} selected={dayOffset === i} onPress={() => setDayOffset(i)} />
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <Label>On these days</Label>
          <View style={styles.wrap}>
            {WEEKDAYS.map((d, n) => (
              <Chip
                key={d}
                label={d}
                selected={days.includes(n)}
                onPress={() => setDays(days.includes(n) ? days.filter((x) => x !== n) : [...days, n].sort())}
              />
            ))}
          </View>
          <Label>For how long?</Label>
          <View style={styles.wrap}>
            {LENGTHS.map((l) => (
              <Chip key={l.weeks} label={l.label} selected={weeks === l.weeks} onPress={() => setWeeks(l.weeks)} />
            ))}
          </View>
        </>
      )}

      <Label>{repeat !== 'once' && !sameTime ? 'Start times' : 'Start time'}</Label>
      {repeat !== 'once' && !sameTime ? (
        days.map((n) => (
          <View key={n} style={{ marginBottom: Spacing.md }}>
            <Text variant="smallStrong" style={{ marginBottom: 6 }}>
              {WEEKDAYS[n]} · {timeText(timeFor(n))}
            </Text>
            <TimeRow value={timeFor(n)} onChange={(t) => setDayTimes({ ...dayTimes, [n]: t })} />
          </View>
        ))
      ) : (
        <>
          <TimeRow value={time} onChange={setTime} />
          <Text variant="small" color="textSecondary" style={{ marginTop: Spacing.sm }}>
            Swipe for more times. Selected: {timeText(time)}
          </Text>
        </>
      )}
      {repeat !== 'once' && days.length > 1 ? (
        <Text
          variant="smallStrong"
          color="primary"
          accessibilityRole="button"
          onPress={() => setSameTime(!sameTime)}
          style={{ marginTop: Spacing.sm }}>
          {sameTime ? 'Different times on different days? ›' : 'Same time every day ›'}
        </Text>
      ) : null}

      <Label>Length</Label>
      <View style={styles.wrap}>
        {durations.map((d) => (
          <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>

      <Label>Extras (optional)</Label>
      <View style={{ gap: Spacing.lg }}>
        <Field
          label="Class playlist"
          value={playlistUrl}
          onChangeText={setPlaylistUrl}
          placeholder="https://open.spotify.com/playlist/…"
          autoCapitalize="none"
          keyboardType="url"
          hint="Clients see it on the class page."
          error={playlistOk ? undefined : 'Links need to start with https://'}
        />
        <View style={{ gap: 6 }}>
          <Text variant="caption" color="textSecondary">
            RECIPE
          </Text>
          {myRecipes.length ? (
            <View style={styles.wrap}>
              <Chip label="None" selected={!recipePostId} onPress={() => setRecipePostId(undefined)} />
              {myRecipes.map((r) => (
                <Chip key={r.id} label={r.title} selected={recipePostId === r.id} onPress={() => setRecipePostId(r.id)} />
              ))}
            </View>
          ) : (
            <Text variant="small" color="textSecondary">
              Post a recipe to your feed first, then you can attach it to classes.
            </Text>
          )}
        </View>
      </View>

      <Button
        label={count > 1 ? `Post ${count} classes` : 'Post it'}
        icon="checkmark"
        disabled={!canPost}
        onPress={save}
        style={{ marginTop: Spacing.xxl }}
      />
      {!canSave ? (
        <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.sm }}>
          Add a class name to post it.
        </Text>
      ) : repeat !== 'once' && days.length === 0 ? (
        <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.sm }}>
          Pick at least one day.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
