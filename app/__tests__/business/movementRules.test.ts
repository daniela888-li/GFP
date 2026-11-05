import {
  amountInputFrom,
  categoryFitsType,
  displayDateFrom,
  formatAmount,
  isoDateFrom,
  parseAmountCents,
  parseDisplayDate,
  toValidMovementInput,
  validateMovementInput,
  type MovementInput,
} from '../../src/business/movements/movementRules';

const TODAY = '2026-11-04';
const VALID: MovementInput = {
  type: 'expense',
  amount: '45,50',
  date: '04/11/2026',
  categoryId: 'food',
  description: '',
};

describe('HU4-CA05 amount', () => {
  test.each([
    ['45', 4500],
    ['45.5', 4550],
    ['45,50', 4550],
    ['0,01', 1],
    ['999999999999,99', 99999999999999],
  ])('accepts %s', (value, cents) => {
    expect(parseAmountCents(value)).toBe(cents);
  });

  test.each([
    ['0'],
    ['0,00'],
    ['-5'],
    ['abc'],
    ['1.200,50'],
    ['1.200'],
    ['12,345'],
    ['1000000000000'],
    [''],
  ])('rejects %s', value => {
    expect(parseAmountCents(value)).toBeNull();
  });

  test('formats and restores amounts without losing cents', () => {
    expect(formatAmount(123450)).toBe('$1.234,50');
    expect(formatAmount(4500000)).toBe('$45.000');
    expect(amountInputFrom(4550)).toBe('45,50');
    expect(amountInputFrom(4500)).toBe('45');
    expect(parseAmountCents(amountInputFrom(1999))).toBe(1999);
  });
});

describe('HU4-CA03 and CA04 date', () => {
  test('converts between visible and stored formats', () => {
    expect(parseDisplayDate('29/02/2024')).toBe('2024-02-29');
    expect(displayDateFrom('2026-11-04')).toBe('04/11/2026');
  });

  test.each([
    ['29/02/2026'],
    ['31/04/2026'],
    ['00/01/2026'],
    ['1/1/2026'],
    ['x'],
  ])('rejects the non-existent date %s', value => {
    expect(parseDisplayDate(value)).toBeNull();
  });

  test('uses the local day of the device', () => {
    expect(isoDateFrom(new Date(2026, 10, 4, 23, 59).getTime())).toBe(
      '2026-11-04',
    );
  });

  test('today is valid and tomorrow is a future date', () => {
    expect(validateMovementInput(VALID, TODAY)).toEqual({});
    expect(
      validateMovementInput({ ...VALID, date: '05/11/2026' }, TODAY).date,
    ).toBe('future');
  });
});

describe('HU4-CA01 and CA06 fields', () => {
  test('type, amount, date and category are required', () => {
    expect(
      validateMovementInput(
        { type: '', amount: '', date: '', categoryId: '', description: '' },
        TODAY,
      ),
    ).toEqual({
      type: 'required',
      amount: 'required',
      date: 'required',
      categoryId: 'required',
    });
  });

  test('the description is optional and allows 250 characters', () => {
    expect(toValidMovementInput(VALID, TODAY)?.description).toBeNull();
    expect(
      validateMovementInput({ ...VALID, description: 'a'.repeat(250) }, TODAY),
    ).toEqual({});
    expect(
      validateMovementInput({ ...VALID, description: 'a'.repeat(251) }, TODAY)
        .description,
    ).toBe('too_long');
  });
});

describe('E07-D1 categories by type', () => {
  test('each type uses its categories and Otros accepts both', () => {
    expect(categoryFitsType({ id: 'food', type: 'expense' }, 'income')).toBe(
      false,
    );
    expect(categoryFitsType({ id: 'salary', type: 'income' }, 'income')).toBe(
      true,
    );
    expect(categoryFitsType({ id: 'other', type: 'expense' }, 'income')).toBe(
      true,
    );
  });
});
