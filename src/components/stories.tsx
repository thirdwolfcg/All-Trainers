import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';
import type { StoryBackground } from '@/lib/types';

import { Avatar, Icon, Text } from './ui';

/** Background and text colors for text stories, from the brand palette. Text passes 4.5:1 on each. */
export const STORY_COLORS: Record<StoryBackground, { bg: string; fg: string; label: string }> = {
  plum: { bg: Colors.primary, fg: '#FFFFFF', label: 'Plum' },
  lilac: { bg: '#9C82D6', fg: Colors.text, label: 'Lilac' },
  ink: { bg: Colors.text, fg: '#FFFFFF', label: 'Ink' },
  blush: { bg: Colors.blush, fg: Colors.blushDeep, label: 'Blush' },
  mint: { bg: Colors.mint, fg: Colors.mintDeep, label: 'Mint' },
};

/** Opens the story viewer at this instructor, then carries on through `queue`. */
export function openStories(instructorId: string, queue: string[] = [instructorId]) {
  router.push({ pathname: '/story/[id]', params: { id: instructorId, queue: queue.join(',') } });
}

/**
 * An avatar with a story ring: lilac and plum while there's something new,
 * gray once it's all been seen, no ring when there are no stories.
 */
export function StoryAvatar({ instructorId, name, size = 64, onPress }: { instructorId: string; name: string; size?: number; onPress?: () => void }) {
  const store = useStore();
  const has = store.storiesOf(instructorId).length > 0;
  const seen = store.storiesSeen(instructorId);
  const ring = Math.max(2, Math.round(size * 0.045));
  const gap = Math.max(2, Math.round(size * 0.05));
  const outer = size + (ring + gap) * 2;
  const avatar = (
    <View
      style={[
        styles.ring,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth: has ? ring : 0,
          padding: has ? gap : ring + gap,
          borderColor: !has ? 'transparent' : seen ? Colors.borderStrong : Colors.primary,
        },
      ]}>
      {has && !seen ? <View style={[styles.glow, { width: outer + 8, height: outer + 8, borderRadius: (outer + 8) / 2 }]} /> : null}
      <Avatar name={name} size={size} />
    </View>
  );
  if (!onPress) return avatar;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={has ? `${name}'s story${seen ? '' : ', new'}` : name}>
      {avatar}
    </Pressable>
  );
}

/** The row of story rings at the top of a client's Home: everyone they follow who has a live story, new ones first. */
export function StoryTray() {
  const store = useStore();
  const people = store.instructors
    .filter((i) => store.following.has(i.id) && store.storiesOf(i.id).length > 0)
    .sort((a, b) => Number(store.storiesSeen(a.id)) - Number(store.storiesSeen(b.id)));
  if (!people.length) return null;
  const queue = people.map((p) => p.id);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray} style={styles.trayWrap}>
      {people.map((p) => (
        <View key={p.id} style={styles.trayItem}>
          <StoryAvatar instructorId={p.id} name={p.name} size={60} onPress={() => openStories(p.id, queue)} />
          <Text variant="caption" color={store.storiesSeen(p.id) ? 'textSecondary' : 'text'} numberOfLines={1} style={{ maxWidth: 76 }}>
            {p.name.split(' ')[0]}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

/** "Your story" on My Week: add one, or watch yours with its view count. */
export function MyStoryRow() {
  const store = useStore();
  const me = store.instructor(store.meId);
  if (!me) return null;
  const mine = store.storiesOf(me.id);
  const views = mine.reduce((n, s) => Math.max(n, store.storyViews(s.id)), 0);
  return (
    <View style={styles.mine}>
      <View>
        <StoryAvatar instructorId={me.id} name={me.name} size={52} onPress={() => (mine.length ? openStories(me.id) : router.push('/story/new'))} />
        <Pressable onPress={() => router.push('/story/new')} style={styles.plus} accessibilityRole="button" accessibilityLabel="Add to your story" hitSlop={8}>
          <Icon name="add" size={16} color="onPrimary" />
        </Pressable>
      </View>
      <Pressable onPress={() => (mine.length ? openStories(me.id) : router.push('/story/new'))} style={{ flex: 1, gap: 2 }} accessibilityRole="button">
        <Text variant="bodyStrong">{mine.length ? 'Your story' : 'Add to your story'}</Text>
        <Text variant="small" color="textSecondary">
          {mine.length
            ? `${mine.length} ${mine.length === 1 ? 'story' : 'stories'} live${views ? ` · seen by ${views}` : ''}. Gone in 24 hours.`
            : 'Spots left tonight? A quick hello? Stories disappear after 24 hours.'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', backgroundColor: '#9C82D6', opacity: 0.25, top: -4 - 2, left: -4 - 2 },
  trayWrap: { marginHorizontal: -Spacing.xl, marginBottom: Spacing.lg },
  tray: { gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xs },
  trayItem: { alignItems: 'center', gap: 4 },
  mine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  plus: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
