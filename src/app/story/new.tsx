import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { STORY_COLORS } from '@/components/stories';
import { Button, Chip, Text } from '@/components/ui';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { addDays, dayLabel, timeLabel } from '@/lib/dates';
import { photoUrl, uploadPostPhoto } from '@/lib/live';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { StoryBackground } from '@/lib/types';

const BACKGROUNDS: StoryBackground[] = ['plum', 'lilac', 'ink', 'blush', 'mint'];
const MAX = 200;

/** Post a story: a photo with an optional caption, or text on a brand color. Can point at one of your classes. */
export default function NewStory() {
  const store = useStore();
  const toast = useToast();
  const [photo, setPhoto] = useState<string>();
  const [text, setText] = useState('');
  const [background, setBackground] = useState<StoryBackground>('plum');
  const [classId, setClassId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const now = new Date();
  const myClasses = store.classes
    .filter((c) => c.instructorId === store.meId && c.status !== 'cancelled' && new Date(c.startsAt) > now && new Date(c.startsAt) < addDays(now, 7))
    .slice(0, 8);
  const colors = STORY_COLORS[background];
  const canShare = (!!photo || text.trim().length > 0) && !busy;

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [9, 16], quality: 0.8 });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0].uri);
  };

  const share = async () => {
    let imageUrl = photo;
    let mediaPath: string | undefined;
    if (photo && store.live) {
      setBusy(true);
      setError(undefined);
      const up = await uploadPostPhoto(store.meId, photo);
      setBusy(false);
      if (up.error || !up.path) {
        setError(`The photo didn't upload. ${up.error ?? ''} Try again, or remove it and share text instead.`.trim());
        return;
      }
      mediaPath = up.path;
      imageUrl = photoUrl(up.path);
    }
    store.addStory({ imageUrl, text: text.trim() || undefined, background, classId }, mediaPath);
    toast('Your story is live for 24 hours.');
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        Your followers see it at the top of their Home. It disappears after 24 hours.
      </Text>

      {/* Preview */}
      <View style={[styles.preview, { backgroundColor: photo ? '#000' : colors.bg }]}>
        {photo ? <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" accessibilityLabel="Your story photo" /> : null}
        <TextInput
          value={text}
          onChangeText={(t) => setText(t.slice(0, MAX))}
          placeholder={photo ? 'Add a caption' : 'Type something…'}
          placeholderTextColor={photo ? 'rgba(255,255,255,0.75)' : colors.fg === '#FFFFFF' ? 'rgba(255,255,255,0.6)' : 'rgba(28,26,34,0.45)'}
          multiline
          maxLength={MAX}
          accessibilityLabel={photo ? 'Caption' : 'Story text'}
          style={[
            styles.input,
            photo ? styles.captionInput : [styles.textInput, { color: colors.fg, fontSize: text.length > 90 ? 20 : 26, lineHeight: text.length > 90 ? 26 : 32 }],
          ]}
        />
      </View>
      <Text variant="small" color="textSecondary" align="right" style={{ marginTop: 4 }}>
        {text.length}/{MAX}
      </Text>

      <View style={styles.row}>
        <Button size="sm" kind="outline" icon="image-outline" label={photo ? 'Change photo' : 'Add a photo'} onPress={pick} />
        {photo ? <Button size="sm" kind="ghost" label="Remove photo" onPress={() => setPhoto(undefined)} /> : null}
      </View>

      {!photo ? (
        <>
          <Text variant="eyebrow" color="textSecondary" style={styles.label}>
            Color
          </Text>
          <View style={styles.row}>
            {BACKGROUNDS.map((b) => (
              <Pressable
                key={b}
                onPress={() => setBackground(b)}
                style={[styles.swatch, { backgroundColor: STORY_COLORS[b].bg }, background === b && styles.swatchOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: background === b }}
                accessibilityLabel={STORY_COLORS[b].label}
              />
            ))}
          </View>
        </>
      ) : null}

      <Text variant="eyebrow" color="textSecondary" style={styles.label}>
        Link a class (optional)
      </Text>
      {myClasses.length ? (
        <View style={styles.wrap}>
          {myClasses.map((c) => (
            <Chip
              key={c.id}
              label={`${c.title} · ${dayLabel(new Date(c.startsAt))} ${timeLabel(new Date(c.startsAt))}`}
              selected={classId === c.id}
              onPress={() => setClassId(classId === c.id ? undefined : c.id)}
            />
          ))}
        </View>
      ) : (
        <Text variant="small" color="textSecondary">
          Classes you teach in the next week show up here, so people can tap through to them.
        </Text>
      )}

      {error ? (
        <Text variant="small" color="blushDeep" style={{ marginTop: Spacing.lg }}>
          {error}
        </Text>
      ) : null}
      <Button label={busy ? 'Uploading photo…' : 'Share to my story'} icon="send" disabled={!canShare} onPress={share} style={{ marginTop: Spacing.xxl }} />
      {!photo && !text.trim() ? (
        <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.sm }}>
          Add a photo or type something to share.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    marginTop: Spacing.lg,
    aspectRatio: 9 / 16,
    maxHeight: 460,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 260,
    borderRadius: Radius.lg * 2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  input: { padding: Spacing.lg, minHeight: 80 },
  // Text stories: the box fills the card so long messages wrap instead of scrolling out of sight.
  textInput: { flex: 1, alignSelf: 'stretch', fontFamily: FontFamily.serif, textAlign: 'center', textAlignVertical: 'center', paddingTop: '30%' },
  captionInput: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    minHeight: 0,
    color: '#FFFFFF',
    backgroundColor: 'rgba(28,26,34,0.55)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: Spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  label: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.border },
  swatchOn: { borderColor: Colors.text, borderWidth: 3 },
});
