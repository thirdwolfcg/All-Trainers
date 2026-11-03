import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Chip, Field, Icon, Text, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { PostKind } from '@/lib/types';

const kinds: { kind: PostKind; label: string; icon: IconName; titleHint: string; bodyHint: string }[] = [
  {
    kind: 'note',
    label: 'Update',
    icon: 'chatbubble-ellipses-outline',
    titleHint: 'New Wednesday class at Lumen!',
    bodyHint: 'Schedule changes, a shoutout, a pep talk. Whatever your people should know.',
  },
  {
    kind: 'recipe',
    label: 'Recipe',
    icon: 'restaurant-outline',
    titleHint: 'My go-to post-class smoothie',
    bodyHint: 'Ingredients and steps, or a quick description and a link.',
  },
  {
    kind: 'playlist',
    label: 'Playlist',
    icon: 'musical-notes-outline',
    titleHint: "Tuesday's Throwback Ride playlist",
    bodyHint: 'What vibe is it? Which class was it for?',
  },
];

export default function NewPost() {
  const store = useStore();
  const toast = useToast();
  const [kind, setKind] = useState<PostKind>('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [premium, setPremium] = useState(false);

  const current = kinds.find((k) => k.kind === kind)!;
  const trimmedLink = link.trim();
  const linkOk = !trimmedLink || /^https:\/\/\S+\.\S+/i.test(trimmedLink);
  const canPost = title.trim().length > 1 && body.trim().length > 0 && linkOk;

  const post = () => {
    store.addPost({
      kind,
      title: title.trim(),
      body: body.trim(),
      linkUrl: trimmedLink || undefined,
      isPremium: premium,
    });
    toast(premium ? 'Posted for your premium people.' : 'Posted. Your followers can see it on your feed.');
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        Shows on your profile&apos;s Feed for your followers.
      </Text>

      <Text variant="eyebrow" color="textSecondary" style={styles.label}>
        What are you posting?
      </Text>
      <View style={styles.wrap}>
        {kinds.map((k) => (
          <Chip key={k.kind} label={k.label} icon={k.icon} selected={kind === k.kind} onPress={() => setKind(k.kind)} />
        ))}
      </View>

      <View style={{ marginTop: Spacing.xl, gap: Spacing.xl }}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder={current.titleHint} maxLength={120} />
        <Field
          label="Post"
          value={body}
          onChangeText={setBody}
          placeholder={current.bodyHint}
          multiline
          maxLength={2000}
          style={{ minHeight: 120, paddingTop: 12, textAlignVertical: 'top' }}
        />
        <Field
          label={kind === 'playlist' ? 'Playlist link' : 'Link'}
          value={link}
          onChangeText={setLink}
          placeholder={kind === 'playlist' ? 'https://open.spotify.com/…' : 'https://…'}
          autoCapitalize="none"
          keyboardType="url"
          hint="Optional."
          error={linkOk ? undefined : 'Links need to start with https://'}
        />
      </View>

      <Text variant="eyebrow" color="textSecondary" style={styles.label}>
        Who can see it?
      </Text>
      <View style={{ gap: Spacing.sm }}>
        <Audience
          icon="people-outline"
          title="Everyone who follows me"
          body="Free for all your followers."
          selected={!premium}
          onPress={() => setPremium(false)}
        />
        <Audience
          icon="diamond-outline"
          title="Premium only"
          body="Followers see the title and a lock until they go premium."
          selected={premium}
          onPress={() => setPremium(true)}
        />
      </View>

      <Button label="Post it" icon="send" disabled={!canPost} onPress={post} style={{ marginTop: Spacing.xxl }} />
      {!canPost ? (
        <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.sm }}>
          Add a title and a few words to post.
        </Text>
      ) : null}
    </Screen>
  );
}

function Audience({ icon, title, body, selected, onPress }: { icon: IconName; title: string; body: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={title}>
      <View style={[styles.option, selected && styles.optionActive]}>
        <Icon name={icon} size={20} color={selected ? 'primary' : 'textSecondary'} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="small" color="textSecondary">
            {body}
          </Text>
        </View>
        <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? 'primary' : 'textMuted'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: Spacing.sm, marginTop: Spacing.xl },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
});
