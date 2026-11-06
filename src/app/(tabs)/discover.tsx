import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { InstructorRow } from '@/components/cards';
import { InviteCard } from '@/components/invite-card';
import { Tip } from '@/components/tip';
import { Screen } from '@/components/screen';
import { Chip, EmptyState, Icon, SectionHeader, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { instructorInviteMessage } from '@/lib/invite';
import { useMe } from '@/lib/me';
import { useStore } from '@/lib/store';
import { StyleLabels, type Style } from '@/lib/types';

const allStyles: Style[] = ['pilates', 'yoga', 'cycle', 'barre', 'strength', 'hiit', 'dance'];

/** Find instructors by name, studio, neighborhood or style, and follow them in one tap. */
export default function Discover() {
  const store = useStore();
  const me = useMe();
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState<Style | null>(null);
  const [hood, setHood] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const activeFilters = Number(!!style) + Number(!!hood);

  const neighborhoods = useMemo(() => [...new Set(store.instructors.map((i) => i.neighborhood))].sort(), [store.instructors]);
  const upcoming = (id: string) =>
    store.classes.filter((c) => c.instructorId === id && c.status !== 'cancelled' && new Date(c.startsAt).getTime() > Date.now()).length;

  const q = query.trim().toLowerCase().replace(/^@/, '');
  const results = store.instructors
    .filter((i) => {
      const matchesText =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.handle.toLowerCase().includes(q) ||
        (i.instagram?.toLowerCase().includes(q) ?? false) ||
        i.neighborhood.toLowerCase().includes(q) ||
        store.classes.some((c) => c.instructorId === i.id && (store.studio(c.studioId)?.name.toLowerCase().includes(q) ?? false));
      return matchesText && (!style || i.styles.includes(style)) && (!hood || i.neighborhood === hood);
    })
    .sort((a, b) => Number(store.following.has(a.id)) - Number(store.following.has(b.id)) || upcoming(b.id) - upcoming(a.id));

  const filtering = !!q || !!style || !!hood;

  return (
    <Screen
      eyebrow="Discover"
      title="Find your people"
      subtitle="Search by name, @handle, studio or neighborhood. Tap Follow and their classes land on your home screen.">
      <View style={styles.search}>
        <Icon name="search" size={18} color="textSecondary" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Name, @handle or studio"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search instructors"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Icon name="close-circle" size={18} color="textSecondary" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={showFilters ? 'Hide filters' : 'Show filters'}
          accessibilityState={{ expanded: showFilters }}
          style={[styles.filterButton, (showFilters || activeFilters > 0) && styles.filterButtonOn]}>
          <Icon name="options-outline" size={18} color={showFilters || activeFilters > 0 ? 'primary' : 'textSecondary'} />
          {activeFilters ? (
            <Text variant="smallStrong" color="primary">
              {activeFilters}
            </Text>
          ) : null}
        </Pressable>
      </View>

      <Tip
        id="tip-filters"
        text="Follow instructors here and their classes land on Home. The sliders icon filters by style or neighborhood."
        pointer="up"
        style={{ marginTop: Spacing.sm }}
      />
      {showFilters ? (
        <>
          <Text variant="eyebrow" color="textSecondary" style={styles.filterLabel}>
            Style
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {allStyles.map((s) => (
              <Chip key={s} label={StyleLabels[s]} selected={style === s} onPress={() => setStyle(style === s ? null : s)} />
            ))}
          </ScrollView>

          <Text variant="eyebrow" color="textSecondary" style={styles.filterLabel}>
            Neighborhood
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {neighborhoods.map((n) => (
              <Chip key={n} label={n} selected={hood === n} onPress={() => setHood(hood === n ? null : n)} />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.tip}>
        <Icon name="qr-code-outline" size={18} color="primary" />
        <Text variant="small" color="textSecondary" style={{ flex: 1 }}>
          Instructor showing you a QR code? Point your phone camera at it to follow them.
        </Text>
      </View>

      <View style={{ marginTop: Spacing.lg }}>
        <SectionHeader
          title={filtering ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}` : 'Instructors in Denver'}
          action={filtering ? 'Clear' : undefined}
          onAction={() => {
            setQuery('');
            setStyle(null);
            setHood(null);
          }}
        />
        {results.length ? (
          results.map((i) => <InstructorRow key={i.id} instructor={i} />)
        ) : (
          <EmptyState icon="search" title="No one yet" body="Try another name or clear a filter. Can't find them? Invite them below." />
        )}
      </View>

      <InviteCard
        eyebrow="Your fave not on here?"
        title="Get them on Zomi"
        body="Text your instructor an invite. Founding instructors join free."
        message={instructorInviteMessage({
          fromName: me.name,
          refId: me.refId,
        })}
        icon="heart-outline"
        textLabel="Text my instructor"
        style={{ marginTop: Spacing.xxl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  filterButtonOn: { backgroundColor: Colors.primarySoft },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, height: '100%' },
  filterLabel: { marginTop: Spacing.lg },
  chips: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
});
