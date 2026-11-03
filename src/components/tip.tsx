import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

import { Icon, Text } from './ui';

/**
 * A one-time tooltip that sits right next to the thing it explains.
 * Shows only while tips are on (after onboarding, entering preview, or
 * "Show tips again" in Me) and until the person taps Got it.
 */
export function Tip({ id, text, pointer = 'down', style }: { id: string; text: string; pointer?: 'up' | 'down' | 'none'; style?: StyleProp<ViewStyle> }) {
  const store = useStore();
  if (!store.tipsOn || store.dismissedTips.has(id)) return null;

  return (
    <View style={[styles.wrap, style]} accessibilityRole="summary">
      {pointer === 'up' ? <View style={[styles.caret, styles.caretUp]} /> : null}
      <View style={styles.bubble}>
        <Icon name="bulb-outline" size={16} color="onPrimary" />
        <Text variant="small" style={styles.text}>
          {text}
        </Text>
        <Pressable onPress={() => store.dismissTip(id)} accessibilityRole="button" accessibilityLabel="Got it, hide this tip" hitSlop={10}>
          <Text variant="smallStrong" style={styles.gotIt}>
            Got it
          </Text>
        </Pressable>
      </View>
      {pointer === 'down' ? <View style={[styles.caret, styles.caretDown]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.sm },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  text: { flex: 1, color: Colors.onPrimary },
  gotIt: { color: Colors.onPrimary, textDecorationLine: 'underline' },
  caret: {
    width: 0,
    height: 0,
    marginLeft: Spacing.xl,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  caretDown: { borderTopWidth: 8, borderTopColor: Colors.primary },
  caretUp: { borderBottomWidth: 8, borderBottomColor: Colors.primary },
});
