import { router } from 'expo-router';
import { View } from 'react-native';

import { PostCard } from '@/components/cards';
import { Screen } from '@/components/screen';
import { Tip } from '@/components/tip';
import { Button, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

/** Instructors: their own posts. Clients: the latest from everyone they follow. */
export default function FeedScreen() {
  const store = useStore();
  return store.role === 'instructor' ? <MyFeed /> : <PeopleFeed />;
}

function MyFeed() {
  const store = useStore();
  const posts = store.posts
    .filter((p) => p.instructorId === store.meId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen eyebrow="Your feed" title="Feed" subtitle="Spill the tea, share the recipes, drop the playlists. It all lands on your profile for your people.">
      <Tip id="tip-post" text="Post updates, photos, videos, recipes and playlists. They show on your profile." />
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

function PeopleFeed() {
  const store = useStore();
  const posts = store.posts
    .filter((p) => store.following.has(p.instructorId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen eyebrow="Latest from your people" title="Feed" subtitle="Playlists, recipes, videos and updates from the instructors you follow.">
      {posts.length ? (
        <View>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} showAuthor />
          ))}
        </View>
      ) : (
        <>
          <EmptyState
            icon="newspaper-outline"
            title={store.following.size ? 'Quiet for now' : 'Your feed is empty'}
            body={
              store.following.size
                ? 'When your instructors post a playlist, recipe or update, it shows up here.'
                : 'Follow your favorite instructors and their posts show up here.'
            }
          />
          {store.following.size ? null : <Button icon="search" label="Find instructors" onPress={() => router.push('/discover')} />}
        </>
      )}
    </Screen>
  );
}
