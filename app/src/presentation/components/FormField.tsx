import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextStyle,
} from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string | null;
  editable?: boolean;
  testID?: string;
  maxLength?: number;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  onToggleSecure,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  editable = true,
  testID,
  maxLength,
}: FormFieldProps) {
  const hasError = error != null && error.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, hasError && styles.inputError]}>
        <TextInput
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          accessibilityLabel={label}
        />
        {onToggleSecure != null && (
          <Pressable
            testID={testID ? `${testID}-toggle` : undefined}
            onPress={onToggleSecure}
            style={styles.toggleButton}
            accessibilityLabel={
              secureTextEntry ? 'Mostrar contrasena' : 'Ocultar contrasena'
            }
            accessibilityRole="button">
            <Text style={styles.toggleText}>
              {secureTextEntry ? 'Ver' : 'Ocultar'}
            </Text>
          </Pressable>
        )}
      </View>
      {hasError && (
        <Text testID={testID ? `${testID}-error` : undefined} style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '500' as TextStyle['fontWeight'],
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm + 4,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  toggleButton: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
  },
  toggleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
