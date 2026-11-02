/**
 * A small message at the bottom of the screen, with an optional Undo.
 * Use it after any action someone might do by accident.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { Colors, FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void };
type ShowToast = (message: string, action?: { label: string; onPress: () => void }) => void;

const Ctx = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>((message, action) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, actionLabel: action?.label, onAction: action?.onPress });
    // Long enough to read and reach the Undo button.
    timer.current = setTimeout(() => setToast(null), action ? 6000 : 3500);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast ? <ToastView toast={toast} onDone={() => setToast(null)} /> : null}
    </Ctx.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, Spacing.sm) + 72 }]}>
      <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Text variant="body" color="onPrimary" style={{ flex: 1 }}>
          {toast.message}
        </Text>
        {toast.actionLabel ? (
          <Pressable
            onPress={() => {
              toast.onAction?.();
              onDone();
            }}
            hitSlop={12}
            accessibilityRole="button"
            style={styles.action}>
            <Text style={styles.actionLabel}>{toast.actionLabel.toUpperCase()}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function useToast() {
  return useContext(Ctx);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Spacing.lg },
  toast: {
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.text,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  action: { paddingVertical: 4, paddingHorizontal: 4 },
  actionLabel: { color: '#D9CCF5', fontFamily: FontFamily.sansBold, fontSize: 13, letterSpacing: 0.8 },
});
