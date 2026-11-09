import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

import { Icon, Text, type IconName } from './ui';

type Item = { label: string; href: Href; icon: IconName };

/** The same order as the tab bar, for each side of the app. */
export function navItems(isInstructor: boolean): Item[] {
  return isInstructor
    ? [
        { label: 'My week', href: '/', icon: 'home-outline' },
        { label: 'Followers', href: '/activity', icon: 'people-outline' },
        { label: 'Messages', href: '/messages', icon: 'chatbubbles-outline' },
        { label: 'Me', href: '/me', icon: 'person-circle-outline' },
      ]
    : [
        { label: 'Home', href: '/', icon: 'home-outline' },
        { label: 'Discover', href: '/discover', icon: 'search-outline' },
        { label: 'Messages', href: '/messages', icon: 'chatbubbles-outline' },
        { label: 'Me', href: '/me', icon: 'person-circle-outline' },
      ];
}

/**
 * The bottom bar for pages that open on top of the tabs (a class, a profile,
 * settings), so people can always jump anywhere.
 */
export function BottomNav() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <View style={styles.inner}>
        {navItems(store.role === 'instructor').map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.navigate(item.href)}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            style={styles.item}>
            <View style={styles.rule} />
            <Icon name={item.icon} size={20} color="textSecondary" />
            <Text variant="eyebrow" color="textSecondary" style={{ fontSize: 10, letterSpacing: 1 }}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  inner: { flexDirection: 'row', width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', justifyContent: 'space-around' },
  item: { alignItems: 'center', gap: 3, flex: 1, paddingBottom: 4 },
  rule: { height: 2, width: 36, marginBottom: 6 },
});
