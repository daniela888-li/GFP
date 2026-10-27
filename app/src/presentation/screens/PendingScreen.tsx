import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { Button } from '../components/Button';
import type { RouteInfo } from '../navigation/routes';

type PendingScreenProps = {
  route: RouteInfo;
  onGoBack: () => void;
};

export function PendingScreen({ route, onGoBack }: PendingScreenProps) {
  return (
    <View style={styles.container} testID="pending-screen">
      <Text style={styles.title}>{route.title}</Text>
      <Text style={styles.subtitle}>
        Esta funcionalidad sera implementada en la etapa {route.stage} ({route.story}).
      </Text>
      <Button
        label="Volver"
        onPress={onGoBack}
        variant="secondary"
        testID="pending-back"
        style={styles.backButton}
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
  title: {
    ...TYPOGRAPHY.title,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.subtitle,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: SPACING.xl,
    minWidth: 140,
  },
});
