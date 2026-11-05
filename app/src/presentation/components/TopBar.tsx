import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from './theme';

type TopBarProps = {
  backLabel: string;
  forwardLabel: string;
  logoutLabel: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onLogout: () => void;
};

function BarButton({
  label,
  onPress,
  disabled = false,
  danger = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
      testID={testID}
    >
      <Text
        style={[
          styles.label,
          danger && styles.danger,
          disabled && styles.disabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Barra superior de las pantallas con sesión: Atrás, Adelante y Cerrar sesión (E13-D2, E13-D3).
export function TopBar({
  backLabel,
  forwardLabel,
  logoutLabel,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onLogout,
}: TopBarProps) {
  return (
    <View style={styles.bar} testID="top-bar">
      <BarButton
        disabled={!canGoBack}
        label={backLabel}
        onPress={onBack}
        testID="nav-back"
      />
      <BarButton
        disabled={!canGoForward}
        label={forwardLabel}
        onPress={onForward}
        testID="nav-forward"
      />
      <View style={styles.spacer} />
      <BarButton
        danger
        label={logoutLabel}
        onPress={onLogout}
        testID="nav-logout"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderBottomColor: COLORS.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  button: { justifyContent: 'center', minHeight: 48, paddingHorizontal: 10 },
  label: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  danger: { color: COLORS.error },
  disabled: { color: COLORS.disabled },
  spacer: { flex: 1 },
});
