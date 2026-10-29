import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: IconName; activeIcon: IconName };

function TabButton({ label, icon, activeIcon, isFocused, ref: _ref, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={styles.tabButton}>
      <View style={[styles.iconPill, isFocused && styles.iconPillActive]}>
        <Icon name={isFocused ? activeIcon : icon} size={22} color={isFocused ? 'primaryDeep' : 'textMuted'} />
      </View>
      <Text variant="caption" color={isFocused ? 'primaryDeep' : 'textMuted'}>
        {label}
      </Text>
    </Pressable>
  );
}

function TabBar({ bottomInset, children, style: _style, ...props }: TabListProps & { bottomInset: number }) {
  return (
    <View {...props} style={{ ...styles.bar, paddingBottom: Math.max(bottomInset, Spacing.sm) }}>
      <View style={styles.barInner}>{children}</View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { role } = useStore();
  const isInstructor = role === 'instructor';

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <TabBar bottomInset={insets.bottom}>
            <TabTrigger name="index" href="/" asChild>
              <TabButton label={isInstructor ? 'My week' : 'Home'} icon="home-outline" activeIcon="home" />
            </TabTrigger>
            <TabTrigger name="activity" href="/activity" asChild>
              <TabButton
                label={isInstructor ? 'Clients' : 'My classes'}
                icon={isInstructor ? 'people-outline' : 'stats-chart-outline'}
                activeIcon={isInstructor ? 'people' : 'stats-chart'}
              />
            </TabTrigger>
            <TabTrigger name="messages" href="/messages" asChild>
              <TabButton label="Messages" icon="chatbubbles-outline" activeIcon="chatbubbles" />
            </TabTrigger>
            <TabTrigger name="me" href="/me" asChild>
              <TabButton label="Me" icon="person-circle-outline" activeIcon="person-circle" />
            </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  barInner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    justifyContent: 'space-around',
  },
  tabButton: { alignItems: 'center', gap: 2, flex: 1 },
  iconPill: { paddingHorizontal: 18, paddingVertical: 4, borderRadius: 999 },
  iconPillActive: { backgroundColor: Colors.primarySoft },
});
