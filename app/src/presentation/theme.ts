export const COLORS = {
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  primaryLight: '#42A5F5',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#212121',
  textSecondary: '#757575',
  error: '#D32F2F',
  success: '#388E3C',
  border: '#BDBDBD',
  disabled: '#9E9E9E',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
};

export const TYPOGRAPHY = {
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};
