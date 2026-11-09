import { Redirect, router } from 'expo-router';
import { View } from 'react-native';

import { PostCard } from '@/components/cards';
import { Screen } from '@/components/screen';
import { Button, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

/** Instructors: their own posts. Clients: the latest from everyone they follow. */
export default function FeedScreen() {
  const store = useStore();
  return store.role === 'instructor' ? <MyFeed /> : <PeopleFeed />;
}

/** Instructors: everything they've posted, newest first. Reached from My feed on My Week (there's no Feed tab for them). */
function MyFeed() {
  const store = useStore();
  const posts = store.posts.filter((p) => p.instructorId === store.meId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen back title="My feed" subtitle="Everything you've posted, newest first. It all shows on your profile for your people.">
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

/** Clients' feed is on Home now. */
function PeopleFeed() {
  return <Redirect href="/" />;
}
