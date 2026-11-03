import { router } from 'expo-router';
import { View } from 'react-native';

import { PostCard } from '@/components/cards';
import { Screen } from '@/components/screen';
import { Button, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

/** Instructor's own feed: what followers see on the Feed tab of their profile. */
export default function FeedScreen() {
  const store = useStore();
  const posts = store.posts
    .filter((p) => p.instructorId === store.meId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen eyebrow="Your feed" title="Feed" subtitle="Spill the tea, share the recipes, drop the playlists. It all lands on your profile for your people.">
      <Button icon="create-outline" label="New post" onPress={() => router.push('/post/new')} style={{ marginBottom: Spacing.lg }} />
      {posts.length ? (
        <View>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </View>
      ) : (
        <EmptyState icon="images-outline" title="Nothing posted yet" body="Share an update, a recipe or a playlist. Your followers see it on your profile." />
      )}
    </Screen>
  );
}
