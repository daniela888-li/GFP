import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { monthRange } from '../../analysis/financialAnalysis';
import {
  evaluateRecommendations,
  type Recommendation,
} from '../../analysis/recommendations';
import type { MovementGateway } from '../../business/movements/movementManagement';
import {
  displayDateFrom,
  isoDateFrom,
  type MovementFilterInput,
} from '../../business/movements/movementRules';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { MessageDialog } from '../components/MessageDialog';
import { COLORS } from '../components/theme';

const TEXTS = {
  title: 'Recomendaciones',
  subtitle: 'Sugerencias personalizadas para tus finanzas',
  section: 'Recomendaciones Automatizadas',
  empty: '¡Todo en orden! No hay recomendaciones o alertas por el momento.',
  viewMovements: 'Ver movimientos asociados',
  dismiss: 'Descartar recomendación',
  disclaimer:
    'Las recomendaciones son generadas automáticamente con fines informativos basados en tus registros y no constituyen asesoramiento financiero profesional ni sobre productos de inversión o crédito.',
  loadFailed: 'No fue posible cargar las recomendaciones. Intenta de nuevo',
  accept: 'Aceptar',
} as const;

const SEVERITY_GLYPHS = { critical: '⚠️', info: 'ℹ️' } as const;

type RecommendationsScreenProps = {
  gateway: MovementGateway;
  session: UserSession;
  onOpenHistory: (filters: MovementFilterInput) => void;
  onSessionExpired: () => void;
  now?: () => number;
};

// Pantalla de HU10. Las reglas leen el mes actual y el anterior de la base local. Descartar
// quita la tarjeta hasta que se vuelva a abrir la pantalla (E12-D3).
export function RecommendationsScreen({
  gateway,
  session,
  onOpenHistory,
  onSessionExpired,
  now = Date.now,
}: RecommendationsScreenProps) {
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const mounted = useRef(true);
  const nowRef = useRef(now);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    async function load() {
      const today = isoDateFrom(nowRef.current());
      const result = await gateway.list(session, {
        from: displayDateFrom(monthRange(today, -1).from),
        to: displayDateFrom(today),
        type: '',
        categoryId: '',
      });
      if (!mounted.current) {
        return;
      }
      if (result.status === 'ok') {
        setItems(evaluateRecommendations(result.movements, today));
      } else if (result.status === 'session_expired') {
        onSessionExpired();
      } else {
        setItems([]);
        setDialog(TEXTS.loadFailed);
      }
    }
    load();
  }, [gateway, session, onSessionExpired]);

  return (
    <View style={styles.screen} testID="recommendations-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.title}
        </Text>
        <Text style={styles.subtitle}>{TEXTS.subtitle}</Text>
        {items === null && (
          <ActivityIndicator
            color={COLORS.primary}
            testID="recommendations-loading"
          />
        )}
        {items !== null && items.length === 0 && (
          <View style={styles.empty} testID="recommendations-empty">
            <Text style={styles.emptyGlyph}>✨</Text>
            <Text style={styles.emptyText}>{TEXTS.empty}</Text>
          </View>
        )}
        {items !== null && items.length > 0 && (
          <Text accessibilityRole="header" style={styles.section}>
            {TEXTS.section}
          </Text>
        )}
        {(items ?? []).map(item => (
          <View
            key={item.id}
            style={[
              styles.card,
              item.severity === 'critical' ? styles.critical : styles.info,
            ]}
            testID={`recommendation-${item.id}`}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.glyph}>{SEVERITY_GLYPHS[item.severity]}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Pressable
                accessibilityLabel={TEXTS.dismiss}
                accessibilityRole="button"
                onPress={() =>
                  setItems(current =>
                    (current ?? []).filter(other => other.id !== item.id),
                  )
                }
                style={styles.dismiss}
                testID={`recommendation-dismiss-${item.id}`}
              >
                <Text style={styles.dismissText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.source}>{item.source}</Text>
            <View style={styles.action}>
              <ActionButton
                label={TEXTS.viewMovements}
                onPress={() =>
                  onOpenHistory({
                    from: displayDateFrom(item.range.from),
                    to: displayDateFrom(item.range.to),
                    type: item.type,
                    categoryId: item.categoryId,
                  })
                }
                testID={`recommendation-open-${item.id}`}
                variant="primary"
              />
            </View>
          </View>
        ))}
        <Text style={styles.disclaimer} testID="recommendations-disclaimer">
          {TEXTS.disclaimer}
        </Text>
      </ScrollView>
      {dialog !== null && (
        <MessageDialog
          actions={[{ label: TEXTS.accept, onPress: () => setDialog(null) }]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 20 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: COLORS.mutedText, fontSize: 15, marginTop: 4 },
  section: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyGlyph: { fontSize: 40, marginBottom: 10 },
  emptyText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  critical: { borderLeftColor: COLORS.error },
  info: { borderLeftColor: COLORS.success },
  cardHeader: { alignItems: 'center', flexDirection: 'row' },
  glyph: { fontSize: 18, marginRight: 8 },
  cardTitle: { color: COLORS.text, flex: 1, fontSize: 16, fontWeight: '700' },
  dismiss: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  dismissText: { color: COLORS.mutedText, fontSize: 18 },
  description: { color: COLORS.text, fontSize: 14, marginTop: 4 },
  source: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: 8 },
  action: { flexDirection: 'row', marginTop: 10 },
  disclaimer: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
