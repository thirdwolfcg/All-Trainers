import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Chip, Field, Icon, Text, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { photoUrl, uploadPostPhoto } from '@/lib/live';
import { findIdea } from '@/lib/post-ideas';
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
    kind: 'video',
    label: 'Video',
    icon: 'play-circle-outline',
    titleHint: 'Form check: footwork',
    bodyHint: 'What is it and why should they watch? Paste the Reel or TikTok link below.',
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
  const { idea: ideaId } = useLocalSearchParams<{ idea?: string }>();
  const idea = findIdea(ideaId);
  const [kind, setKind] = useState<PostKind>(idea?.kind ?? 'note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [photo, setPhoto] = useState<string>();

  const current = kinds.find((k) => k.kind === kind)!;
  const trimmedLink = link.trim();
  const linkOk = !trimmedLink || /^https:\/\/\S+\.\S+/i.test(trimmedLink);
  const needsLink = kind === 'video' && !trimmedLink;
  const canPost = title.trim().length > 1 && body.trim().length > 0 && linkOk && !needsLink;

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0].uri);
  };

  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  const post = async () => {
    let imageUrl = photo;
    let mediaPath: string | undefined;
    // Real accounts: put the photo in storage first so followers can see it too.
    if (photo && store.live) {
      setBusy(true);
      setUploadError(undefined);
      const up = await uploadPostPhoto(store.meId, photo);
      setBusy(false);
      if (up.error || !up.path) {
        setUploadError(`The photo didn't upload. ${up.error ?? ''} Try again, or remove it and post without it.`.trim());
        return;
      }
      mediaPath = up.path;
      imageUrl = photoUrl(up.path);
    }
    store.addPost(
      {
        kind,
        title: title.trim(),
        body: body.trim(),
        linkUrl: trimmedLink || undefined,
        imageUrl,
        isPremium: false,
      },
      mediaPath,
    );
    toast('Posted. Your followers see it in their feed and on your profile.');
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Text variant="body" color="textSecondary">
        Shows on your profile and in your followers&apos; feeds.
      </Text>
      {idea ? (
        <View style={styles.idea}>
          <Icon name="sparkles-outline" size={16} color="primary" />
          <Text variant="small" color="primaryDeep" style={{ flex: 1 }}>
            {idea.prompt}
          </Text>
        </View>
      ) : null}

      <Text variant="eyebrow" color="textSecondary" style={styles.label}>
        What are you posting?
      </Text>
      <View style={styles.wrap}>
        {kinds.map((k) => (
          <Chip key={k.kind} label={k.label} icon={k.icon} selected={kind === k.kind} onPress={() => setKind(k.kind)} />
        ))}
      </View>

      <View style={{ marginTop: Spacing.xl, gap: Spacing.xl }}>
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder={idea && idea.kind === kind ? idea.titleHint : current.titleHint}
          maxLength={120}
        />
        <Field
          label="Post"
          value={body}
          onChangeText={setBody}
          placeholder={current.bodyHint}
          multiline
          maxLength={2000}
          style={{ minHeight: 120, paddingTop: 12, textAlignVertical: 'top' }}
        />
        <View style={{ gap: Spacing.sm }}>
          <Text variant="caption" color="textSecondary">
            PHOTO
          </Text>
          {photo ? (
            <View style={{ gap: Spacing.sm }}>
              <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" accessibilityLabel="Selected photo" />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button size="sm" kind="outline" icon="image-outline" label="Change photo" onPress={pickPhoto} />
                <Button size="sm" kind="ghost" label="Remove" onPress={() => setPhoto(undefined)} />
              </View>
            </View>
          ) : (
            <Button size="sm" kind="outline" icon="image-outline" label="Add a photo" onPress={pickPhoto} style={{ alignSelf: 'flex-start' }} />
          )}
        </View>
        <Field
          label={kind === 'playlist' ? 'Playlist link' : kind === 'video' ? 'Video link' : 'Link'}
          value={link}
          onChangeText={setLink}
          placeholder={
            kind === 'playlist' ? 'https://open.spotify.com/…' : kind === 'video' ? 'https://www.instagram.com/reel/… or a TikTok link' : 'https://…'
          }
          autoCapitalize="none"
          keyboardType="url"
          hint={
            kind === 'video'
              ? 'Instagram, TikTok or YouTube. In the app, tap Share on your video, then Copy link.'
              : 'Optional. Instagram, TikTok, Spotify or any link.'
          }
          error={linkOk ? undefined : 'Links need to start with https://'}
        />
      </View>

      {uploadError ? (
        <Text variant="small" color="blushDeep" style={{ marginTop: Spacing.lg }}>
          {uploadError}
        </Text>
      ) : null}
      <Button label={busy ? 'Uploading photo…' : 'Post it'} icon="send" disabled={!canPost || busy} onPress={post} style={{ marginTop: Spacing.xxl }} />
      {!canPost ? (
        <Text variant="small" color="textSecondary" align="center" style={{ marginTop: Spacing.sm }}>
          {needsLink ? 'Add a title, a few words and your video link to post.' : 'Add a title and a few words to post.'}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  idea: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
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
