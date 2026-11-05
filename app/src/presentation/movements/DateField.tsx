import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  daysInMonth,
  displayDateFrom,
  parseDisplayDate,
} from '../../business/movements/movementRules';
import { ActionButton } from '../components/ActionButton';
import { TextField } from '../components/TextField';
import { COLORS } from '../components/theme';
import { MOVEMENT_TEXTS as TEXTS } from './movementTexts';

type DateFieldProps = {
  value: string;
  // Fecha del sistema, AAAA-MM-DD; los días posteriores no se pueden elegir (HU4-CA04).
  today: string;
  onChange: (value: string) => void;
  error: string | null;
  disabled?: boolean;
  label?: string;
  testID?: string;
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Calendario hecho con componentes de React Native: no necesita una dependencia nativa nueva
// y acepta también la fecha escrita a mano (HU4, campo Fecha; E07-D6).
export function DateField({
  value,
  today,
  onChange,
  error,
  disabled = false,
  label = TEXTS.labels.date,
  testID = 'movement-date',
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(0);
  const [month, setMonth] = useState(0);
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7));
  const atCurrentMonth = year === todayYear && month === todayMonth;

  function openCalendar() {
    const iso = parseDisplayDate(value) ?? today;
    const shown = iso > today ? today : iso;
    setYear(Number(shown.slice(0, 4)));
    setMonth(Number(shown.slice(5, 7)));
    setOpen(true);
  }

  function changeMonth(delta: number) {
    const total = year * 12 + (month - 1) + delta;
    setYear(Math.floor(total / 12));
    setMonth((total % 12) + 1);
  }

  // Lunes = 0. `Date.UTC` evita depender de la zona horaria del dispositivo.
  const firstWeekday =
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = open
    ? Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1)
    : [];

  return (
    <View>
      <TextField
        editable={!disabled}
        error={error}
        keyboardType="numbers-and-punctuation"
        label={label}
        maxLength={10}
        onChangeText={onChange}
        placeholder={TEXTS.placeholders.date}
        testID={testID}
        value={value}
      />
      <View style={styles.calendarButton}>
        <ActionButton
          disabled={disabled}
          label={TEXTS.buttons.calendar}
          onPress={openCalendar}
          testID={`${testID}-open`}
        />
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} testID={`${testID}-calendar`}>
            <View style={styles.header}>
              <Pressable
                accessibilityLabel={TEXTS.calendar.previous}
                accessibilityRole="button"
                onPress={() => changeMonth(-1)}
                style={styles.arrow}
                testID={`${testID}-calendar-previous`}
              >
                <Text style={styles.arrowText}>‹</Text>
              </Pressable>
              <Text accessibilityRole="header" style={styles.month}>
                {`${TEXTS.calendar.months[month - 1] ?? ''} ${year}`}
              </Text>
              <Pressable
                accessibilityLabel={TEXTS.calendar.next}
                accessibilityRole="button"
                accessibilityState={{ disabled: atCurrentMonth }}
                disabled={atCurrentMonth}
                onPress={() => changeMonth(1)}
                style={styles.arrow}
                testID={`${testID}-calendar-next`}
              >
                <Text
                  style={[styles.arrowText, atCurrentMonth && styles.disabled]}
                >
                  ›
                </Text>
              </Pressable>
            </View>
            <View style={styles.grid}>
              {TEXTS.calendar.weekdays.map(day => (
                <View key={day} style={styles.cell}>
                  <Text style={styles.weekday}>{day}</Text>
                </View>
              ))}
              {Array.from({ length: firstWeekday }, (_, index) => (
                <View key={`empty-${index}`} style={styles.cell} />
              ))}
              {days.map(day => {
                const iso = `${year}-${pad(month)}-${pad(day)}`;
                const future = iso > today;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: future }}
                    disabled={future}
                    key={iso}
                    onPress={() => {
                      onChange(displayDateFrom(iso));
                      setOpen(false);
                    }}
                    style={styles.cell}
                    testID={`${testID}-calendar-day-${iso}`}
                  >
                    <Text style={[styles.day, future && styles.disabled]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarButton: { flexDirection: 'row', marginBottom: 14, marginTop: -6 },
  overlay: {
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  arrow: {
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  arrowText: { color: COLORS.primary, fontSize: 28 },
  month: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  weekday: { color: COLORS.mutedText, fontSize: 13, fontWeight: '600' },
  day: { color: COLORS.text, fontSize: 16 },
  disabled: { color: COLORS.disabled },
});
