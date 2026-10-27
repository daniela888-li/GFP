import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { Button } from '../components/Button';

type HomeScreenProps = {
  onLogout: () => void;
};

export function HomeScreen({ onLogout }: HomeScreenProps) {
  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.title}>GFP</Text>
      <Text style={styles.subtitle}>Gestion Financiera Personal</Text>
      <Text style={styles.welcome}>Sesion iniciada correctamente</Text>
      <Button
        label="Cerrar sesion"
        onPress={onLogout}
        variant="secondary"
        testID="logout-button"
        style={styles.logoutButton}
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
    fontSize: 32,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: SPACING.xl,
  },
  welcome: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    marginBottom: SPACING.lg,
  },
  logoutButton: {
    marginTop: SPACING.md,
    minWidth: 180,
  },
});
