import React, { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { Button } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { Dialog } from '../../components/Dialog';
import { useAppServices } from '../../AppServicesContext';
import { login } from '../../../services/login/loginService';

type LoginScreenProps = {
  onLoginSuccess: () => void;
  onNavigateRegister: () => void;
  onNavigateRecovery: () => void;
};

function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes} min ${seconds} seg`;
  }
  return `${seconds} seg`;
}

export function LoginScreen({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateRecovery,
}: LoginScreenProps) {
  const services = useAppServices();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockDialog, setLockDialog] = useState<string | null>(null);
  const mounted = useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();
    setErrorMessage(null);

    const trimmedId = identifier.trim();
    if (trimmedId.length === 0 || password.length === 0) {
      setErrorMessage('Ingrese su identificador y contrasena');
      return;
    }

    setLoading(true);
    try {
      const result = await login(trimmedId, password, services);

      if (!mounted.current) {
        return;
      }

      switch (result.status) {
        case 'success':
          onLoginSuccess();
          break;
        case 'invalid_credentials':
          setErrorMessage('Credenciales incorrectas');
          break;
        case 'account_locked':
          setLockDialog(
            `Cuenta bloqueada. Intente nuevamente en ${formatRemainingTime(result.remainingMs)}.`,
          );
          break;
      }
    } catch (_error) {
      if (mounted.current) {
        setErrorMessage('Error al iniciar sesion. Intente nuevamente.');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [identifier, password, services, onLoginSuccess]);

  const togglePasswordVisibility = useCallback(() => {
    setHidePassword(prev => !prev);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.appTitle}>GFP</Text>
          <Text style={styles.appSubtitle}>Gestion Financiera Personal</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Iniciar sesion</Text>

          <FormField
            label="Correo, documento o telefono"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="ejemplo@correo.com"
            keyboardType="email-address"
            testID="login-identifier"
          />

          <FormField
            label="Contrasena"
            value={password}
            onChangeText={setPassword}
            placeholder="Ingrese su contrasena"
            secureTextEntry={hidePassword}
            onToggleSecure={togglePasswordVisibility}
            testID="login-password"
          />

          {errorMessage != null && (
            <Text testID="login-error" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}

          <Button
            label="Iniciar sesion"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            testID="login-submit"
            style={styles.submitButton}
          />

          <Button
            label="Crear cuenta"
            onPress={onNavigateRegister}
            variant="secondary"
            testID="login-register"
            style={styles.registerButton}
          />

          <Pressable
            onPress={onNavigateRecovery}
            testID="login-recovery"
            style={styles.recoveryLink}>
            <Text style={styles.recoveryText}>Recuperar contrasena</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Dialog
        visible={lockDialog != null}
        title="Cuenta bloqueada"
        message={lockDialog ?? ''}
        onClose={() => setLockDialog(null)}
        testID="lock-dialog"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appSubtitle: {
    ...TYPOGRAPHY.subtitle,
    marginTop: SPACING.xs,
  },
  form: {
    width: '100%',
  },
  formTitle: {
    ...TYPOGRAPHY.title,
    marginBottom: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  registerButton: {
    marginTop: SPACING.sm,
  },
  recoveryLink: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  recoveryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
