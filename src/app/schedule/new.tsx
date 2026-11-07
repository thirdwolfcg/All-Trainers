import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DatePicker } from '@/components/date-picker';
import { Screen } from '@/components/screen';
import { TimeRange } from '@/components/time-range';
import { Button, Card, Chip, Field, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { describeClass } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { addDays, dayLabel, isSameDay, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { KNOWN_STYLES, styleLabel, type Style } from '@/lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type Repeat = 'once' | 'weekly' | 'biweekly';
const LENGTHS = [
  { weeks: 4, label: '1 month' },
  { weeks: 13, label: '3 months' },
  { weeks: 26, label: '6 months' },
];

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
  const [date, setDate] = useState(() => addDays(startOfDay(new Date()), 1));
  const [picking, setPicking] = useState(false);
  const [addingStyle, setAddingStyle] = useState(false);
  const [newStyle, setNewStyle] = useState('');
  const [addingStudio, setAddingStudio] = useState(false);
  const [newStudio, setNewStudio] = useState('');
  const [newStudioHood, setNewStudioHood] = useState('');
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
  const tomorrow = addDays(today, 1);
  const maxDate = addDays(today, 365);
  const styleOptions: Style[] = [...KNOWN_STYLES, ...(me?.styles ?? []).filter((x) => !(KNOWN_STYLES as readonly string[]).includes(x))];
  if (!styleOptions.includes(style)) styleOptions.push(style);

  const addStyle = () => {
    const label = newStyle.trim().replace(/\s+/g, ' ');
    if (label.length < 2) return;
    const match = styleOptions.find((x) => styleLabel(x).toLowerCase() === label.toLowerCase());
    const value = match ?? label;
    if (!match && me) store.updateInstructor(me.id, { styles: [...me.styles, value] });
    setStyle(value);
    setNewStyle('');
    setAddingStyle(false);
  };

  const addStudio = () => {
    if (newStudio.trim().length < 2) return;
    setStudioId(store.addStudio({ name: newStudio, neighborhood: newStudioHood }));
    setNewStudio('');
    setNewStudioHood('');
    setAddingStudio(false);
  };

  const pickDate = (d: Date) => {
    setDate(d);
    setPicking(false);
  };
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
    if (repeat === 'once') return [at(date, time)];
    const out: Date[] = [];
    const step = repeat === 'weekly' ? 1 : 2;
    for (let i = 0; i < weeks * 7; i++) {
      const d = addDays(date, i);
      const weekIndex = Math.floor(i / 7);
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
          <Chip key={s} label={styleLabel(s)} selected={style === s} onPress={() => setStyle(s)} />
        ))}
        <Chip label="Add a style" icon="add" selected={addingStyle} onPress={() => setAddingStyle(!addingStyle)} />
      </View>
      {addingStyle ? (
        <View style={[styles.addRow, { marginTop: Spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Field
              label="New style"
              value={newStyle}
              onChangeText={setNewStyle}
              placeholder="Aerial yoga, Boxing, Mat Pilates…"
              autoFocus
              maxLength={30}
              onSubmitEditing={addStyle}
            />
          </View>
          <Button size="sm" label="Add" disabled={newStyle.trim().length < 2} onPress={addStyle} style={{ marginTop: 22 }} />
        </View>
      ) : null}

      <Label>Studio</Label>
      <View style={styles.wrap}>
        {store.studios.map((s) => (
          <Chip key={s.id} label={s.name} selected={studioId === s.id} onPress={() => setStudioId(s.id)} />
        ))}
        <Chip label="Add a studio" icon="add" selected={addingStudio} onPress={() => setAddingStudio(!addingStudio)} />
      </View>
      {addingStudio ? (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
          <Field label="Studio name" value={newStudio} onChangeText={setNewStudio} placeholder="Your studio's name" autoFocus maxLength={60} />
          <Field
            label="Neighborhood"
            value={newStudioHood}
            onChangeText={setNewStudioHood}
            placeholder="LoHi, RiNo, Wash Park…"
            hint="Optional. Helps clients find it."
          />
          <Button size="sm" label="Add studio" disabled={newStudio.trim().length < 2} onPress={addStudio} style={{ alignSelf: 'flex-start' }} />
        </View>
      ) : null}

      <Label>How often?</Label>
      <View style={styles.wrap}>
        <Chip label="Just once" selected={repeat === 'once'} onPress={() => setRepeat('once')} />
        <Chip label="Every week" icon="repeat" selected={repeat === 'weekly'} onPress={() => setRepeat('weekly')} />
        <Chip label="Every other week" icon="repeat" selected={repeat === 'biweekly'} onPress={() => setRepeat('biweekly')} />
      </View>

      {repeat === 'once' ? (
        <>
          <Label>Day</Label>
          <View style={styles.wrap}>
            <Chip
              label={!isSameDay(date, today) && !isSameDay(date, tomorrow) ? dayLabel(date) : 'Pick a day'}
              icon="calendar-outline"
              selected={picking || (!isSameDay(date, today) && !isSameDay(date, tomorrow))}
              onPress={() => setPicking(!picking)}
            />
            <Chip label="Today" selected={!picking && isSameDay(date, today)} onPress={() => pickDate(today)} />
            <Chip label="Tomorrow" selected={!picking && isSameDay(date, tomorrow)} onPress={() => pickDate(tomorrow)} />
          </View>
          {picking ? <DatePicker value={date} maxDate={maxDate} onChange={pickDate} /> : null}
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
          <Label>Starting</Label>
          <View style={styles.wrap}>
            <Chip label="Tomorrow" selected={!picking && isSameDay(date, tomorrow)} onPress={() => pickDate(tomorrow)} />
            <Chip
              label={isSameDay(date, tomorrow) ? 'Pick a day' : dayLabel(date)}
              icon="calendar-outline"
              selected={picking || !isSameDay(date, tomorrow)}
              onPress={() => setPicking(!picking)}
            />
          </View>
          {picking ? <DatePicker value={date} maxDate={maxDate} onChange={pickDate} /> : null}
          <Label>For how long?</Label>
          <View style={styles.wrap}>
            {LENGTHS.map((l) => (
              <Chip key={l.weeks} label={l.label} selected={weeks === l.weeks} onPress={() => setWeeks(l.weeks)} />
            ))}
          </View>
        </>
      )}

      <Label>{repeat !== 'once' && !sameTime ? 'Times' : 'Time'}</Label>
      {repeat !== 'once' && !sameTime ? (
        days.map((n) => (
          <View key={n} style={{ marginBottom: Spacing.lg }}>
            <Text variant="smallStrong" style={{ marginBottom: 6 }}>
              {WEEKDAYS[n]}
            </Text>
            <TimeRange
              start={timeFor(n)}
              minutes={duration}
              onChange={(t, m) => {
                setDayTimes({ ...dayTimes, [n]: t });
                setDuration(m);
              }}
            />
          </View>
        ))
      ) : (
        <TimeRange
          start={time}
          minutes={duration}
          onChange={(t, m) => {
            setTime(t);
            setDuration(m);
          }}
        />
      )}
      {repeat !== 'once' && days.length > 1 ? (
        <Text variant="smallStrong" color="primary" accessibilityRole="button" onPress={() => setSameTime(!sameTime)} style={{ marginTop: Spacing.sm }}>
          {sameTime ? 'Different times on different days? ›' : 'Same time every day ›'}
        </Text>
      ) : null}

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
              Post a recipe first, then you can attach it to classes.
            </Text>
          )}
        </View>
      </View>

      <Button label={count > 1 ? `Post ${count} classes` : 'Post it'} icon="checkmark" disabled={!canPost} onPress={save} style={{ marginTop: Spacing.xxl }} />
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
  addRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
