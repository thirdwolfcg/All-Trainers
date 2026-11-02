import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { instagramUrl, tiktokUrl } from '@/lib/links';
import type { Instructor } from '@/lib/types';

import { Icon, Text } from './ui';

/** Instagram and TikTok buttons for an instructor, when they've added them. */
export function SocialLinks({ instructor }: { instructor: Instructor }) {
  const links = [
    instructor.instagram ? { key: 'ig', icon: 'logo-instagram' as const, label: `@${instructor.instagram}`, url: instagramUrl(instructor.instagram), name: 'Instagram' } : null,
    instructor.tiktok ? { key: 'tt', icon: 'logo-tiktok' as const, label: `@${instructor.tiktok}`, url: tiktokUrl(instructor.tiktok), name: 'TikTok' } : null,
  ].filter((l): l is NonNullable<typeof l> => !!l);

  if (!links.length) return null;
  return (
    <View style={styles.row}>
      {links.map((l) => (
        <Pressable
          key={l.key}
          onPress={() => Linking.openURL(l.url)}
          accessibilityRole="link"
          accessibilityLabel={`${instructor.name} on ${l.name}`}
          style={({ pressed }) => [styles.link, pressed && { backgroundColor: Colors.surface }]}>
          <Icon name={l.icon} size={16} color="text" />
          <Text variant="smallStrong">{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
});
