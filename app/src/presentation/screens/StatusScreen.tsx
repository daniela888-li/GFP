import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { Button } from '../components/Button';

type StatusScreenProps =
  | { kind: 'loading'; message?: string }
  | { kind: 'error'; message: string; onRetry: () => void };

export function StatusScreen(props: StatusScreenProps) {
  if (props.kind === 'loading') {
    return (
      <View style={styles.container} testID="status-loading">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.message}>
          {props.message ?? 'Cargando...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="status-error">
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.message}>{props.message}</Text>
      <Button
        label="Reintentar"
        onPress={props.onRetry}
        testID="status-retry"
        style={styles.retryButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  message: {
    ...TYPOGRAPHY.subtitle,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.lg,
    minWidth: 160,
  },
});
