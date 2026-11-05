import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from './theme';

export type BottomTab = {
  key: string;
  label: string;
  onPress: () => void;
};

// Barra inferior de las pantallas autenticadas (HU4, «Enlaces / Navegación», E07-D7).
export function BottomTabs({
  tabs,
  active,
}: {
  tabs: readonly BottomTab[];
  active: string;
}) {
  return (
    <View style={styles.bar} testID="bottom-tabs">
      {tabs.map(tab => {
        const selected = tab.key === active;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.key}
            onPress={tab.onPress}
            style={styles.tab}
            testID={`tab-${tab.key}`}
          >
            <Text style={[styles.label, selected && styles.selected]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.background,
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
  },
  label: { color: COLORS.mutedText, fontSize: 13 },
  selected: { color: COLORS.primary, fontWeight: '700' },
});
