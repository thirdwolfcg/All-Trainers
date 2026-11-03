import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import type { Role } from '@/lib/types';

/** Client and instructor toggle for preview mode ("Just let me look around"). Hidden for real accounts. */
export function PreviewSwitch() {
  const auth = useAuth();
  const store = useStore();
  if (!auth.demo) return null;

  return (
    <Card tone="surface" style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
      <Text variant="caption" color="textSecondary">
        PREVIEW MODE
      </Text>
      <View style={styles.segment}>
        {(['client', 'instructor'] as Role[]).map((r) => {
          const active = store.role === r;
          return (
            <Pressable
              key={r}
              onPress={() => {
                store.setRole(r);
                router.replace('/');
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && styles.segmentActive]}>
              <Text variant="smallStrong" color={active ? 'primaryDeep' : 'textSecondary'}>
                {r === 'client' ? 'Client view' : 'Instructor view'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="small" color="textSecondary">
        Switch sides to see the app the way clients and instructors will.{' '}
        <Text
          variant="smallStrong"
          color="primary"
          onPress={() => {
            store.showTips();
            router.replace('/');
          }}
          accessibilityRole="link">
          Show me around ›
        </Text>
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: Colors.surfaceStrong, borderRadius: Radius.pill, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.pill },
  segmentActive: { backgroundColor: Colors.background },
});
