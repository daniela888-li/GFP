import {
  CATEGORY_TYPES,
  OTHER_CATEGORY_ID,
  type CategoryType,
} from '../../infrastructure/database/categoryCatalogs';

// Reglas del formulario de movimientos (HU4-CA01, CA03 a CA06, E07-D1 y E07-D5).

export const MOVEMENT_DESCRIPTION_MAX_LENGTH = 250;
// 12 dígitos enteros y 2 decimales (E07-D5).
export const MOVEMENT_MAX_AMOUNT_CENTS = 99_999_999_999_999;

export type MovementInput = {
  type: string;
  amount: string;
  // Fecha visible, DD/MM/AAAA.
  date: string;
  categoryId: string;
  description: string;
};

export type ValidMovementInput = {
  type: CategoryType;
  amountCents: number;
  date: string;
  categoryId: string;
  description: string | null;
};

export type MovementField =
  | 'type'
  | 'amount'
  | 'date'
  | 'categoryId'
  | 'description';
export type MovementFieldError =
  | 'required'
  | 'invalid'
  | 'future'
  | 'too_long'
  | 'unavailable';
export type MovementFieldErrors = Partial<
  Record<MovementField, MovementFieldError>
>;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

// Fecha del sistema en la zona horaria del dispositivo.
export function isoDateFrom(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

export function displayDateFrom(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Convierte DD/MM/AAAA en AAAA-MM-DD; devuelve null si la fecha no existe.
export function parseDisplayDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (match === null) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    return null;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

// Acepta punto o coma como separador decimal y hasta 2 decimales. No acepta separadores de
// miles: «1.200» no se interpreta, para no confundir mil doscientos con 1,2.
export function parseAmountCents(value: string): number | null {
  const match = /^(\d{1,12})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (match === null) {
    return null;
  }
  const cents =
    Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return cents > 0 && cents <= MOVEMENT_MAX_AMOUNT_CENTS ? cents : null;
}

export function amountInputFrom(cents: number): string {
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  return fraction === 0 ? String(whole) : `${whole},${pad(fraction)}`;
}

// Monto visible: $1.234,50. Sin decimales cuando son cero.
export function formatAmount(cents: number): string {
  const whole = String(Math.floor(cents / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  );
  const fraction = cents % 100;
  return `$${whole}${fraction === 0 ? '' : `,${pad(fraction)}`}`;
}

export function normalizeDescription(raw: string): string {
  return raw.normalize('NFC').trim();
}

export function descriptionLength(value: string): number {
  return Array.from(value).length;
}

export function isMovementType(value: string): value is CategoryType {
  return (CATEGORY_TYPES as readonly string[]).includes(value);
}

// E07-D1 con E06-D3: cada tipo usa sus categorías; «Otros» sirve también para ingresos.
export function categoryFitsType(
  category: { id: string; type: CategoryType },
  type: CategoryType,
): boolean {
  return category.type === type || category.id === OTHER_CATEGORY_ID;
}

export function validateMovementInput(
  input: MovementInput,
  today: string,
): MovementFieldErrors {
  const errors: MovementFieldErrors = {};
  if (input.type.length === 0) {
    errors.type = 'required';
  } else if (!isMovementType(input.type)) {
    errors.type = 'invalid';
  }
  if (input.amount.trim().length === 0) {
    errors.amount = 'required';
  } else if (parseAmountCents(input.amount) === null) {
    errors.amount = 'invalid';
  }
  if (input.date.trim().length === 0) {
    errors.date = 'required';
  } else {
    const date = parseDisplayDate(input.date);
    if (date === null) {
      errors.date = 'invalid';
    } else if (date > today) {
      errors.date = 'future';
    }
  }
  if (input.categoryId.length === 0) {
    errors.categoryId = 'required';
  }
  if (
    descriptionLength(normalizeDescription(input.description)) >
    MOVEMENT_DESCRIPTION_MAX_LENGTH
  ) {
    errors.description = 'too_long';
  }
  return errors;
}

// Filtros del historial tal como se escriben en la pantalla (HU5). Vacío = sin filtro.
export type MovementFilterInput = {
  from: string;
  to: string;
  type: string;
  categoryId: string;
};

export type MovementFilterError =
  | 'invalid_from'
  | 'invalid_to'
  | 'inverted_range';

export function validateMovementFilters(
  input: MovementFilterInput,
): MovementFilterError | null {
  const from = input.from.trim();
  const to = input.to.trim();
  const fromDate = parseDisplayDate(from);
  const toDate = parseDisplayDate(to);
  if (from.length > 0 && fromDate === null) {
    return 'invalid_from';
  }
  if (to.length > 0 && toDate === null) {
    return 'invalid_to';
  }
  return fromDate !== null && toDate !== null && fromDate > toDate
    ? 'inverted_range'
    : null;
}

// Fecha de una tarjeta del historial: «Hoy», «Ayer» o DD/MM/AAAA.
export function relativeDateLabel(date: string, today: string): string {
  if (date === today) {
    return 'Hoy';
  }
  const [year, month, day] = today.split('-').map(Number);
  const yesterday = new Date(Date.UTC(year, month - 1, day - 1))
    .toISOString()
    .slice(0, 10);
  return date === yesterday ? 'Ayer' : displayDateFrom(date);
}

// Devuelve la entrada lista para guardar, o null si tiene errores.
export function toValidMovementInput(
  input: MovementInput,
  today: string,
): ValidMovementInput | null {
  if (Object.keys(validateMovementInput(input, today)).length > 0) {
    return null;
  }
  const description = normalizeDescription(input.description);
  return {
    type: input.type as CategoryType,
    amountCents: parseAmountCents(input.amount) as number,
    date: parseDisplayDate(input.date) as string,
    categoryId: input.categoryId,
    description: description.length === 0 ? null : description,
  };
}
