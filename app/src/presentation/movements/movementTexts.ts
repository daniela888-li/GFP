import type { CategoryType } from '../../infrastructure/database/categoryCatalogs';

// Textos visibles de HU4. Los títulos, mensajes y botones son literales de la historia o de su
// prototipo; los mensajes marcados como propuesta completan casos que la historia no define
// (E07-D5). El botón principal usa «Guardar movimiento» y no «Registrar» (E07-D2).
export const MOVEMENT_TEXTS = {
  create: {
    title: 'Registro de movimiento',
    subtitle: 'Añade una nueva transacción.',
    save: 'Guardar movimiento',
  },
  edit: {
    title: 'Editar movimiento',
    subtitle: 'Modifica los datos registrados',
    save: 'Actualizar',
  },
  types: {
    income: 'Ingreso',
    expense: 'Gasto',
  } satisfies Record<CategoryType, string>,
  typeGlyphs: { income: '↑', expense: '↓' } satisfies Record<
    CategoryType,
    string
  >,
  labels: {
    type: 'Tipo de movimiento',
    amount: 'Monto',
    date: 'Fecha',
    category: 'Categoría',
    description: 'Descripción (opcional)',
  },
  placeholders: {
    amount: '0,00',
    date: 'DD/MM/AAAA',
    category: 'Selecciona una categoría',
    description: 'Ej: Suscripción mensual',
  },
  buttons: {
    clear: 'Limpiar',
    cancel: 'Cancelar',
    calendar: 'Calendario',
    accept: 'Aceptar',
    backToHistory: 'Volver al historial',
  },
  errors: {
    form: 'Error en los campos ingresados',
    amount: 'Ingrese un monto válido',
    futureDate: 'La fecha no puede ser futura',
    // Propuestas (E07-D5).
    invalidDate: 'Ingrese una fecha válida',
    requiredDate: 'Seleccione una fecha',
    requiredCategory: 'Seleccione una categoría',
    unavailableCategory: 'La categoría ya no está disponible',
    description: 'La descripción admite máximo 250 caracteres',
    loadFailed: 'No fue posible cargar las categorías. Intenta de nuevo',
    saveFailed: 'No fue posible guardar el movimiento. Intenta de nuevo',
    notFound: 'El movimiento ya no existe.',
  },
  success: {
    title: '¡Operación exitosa!',
    created: 'El movimiento fue registrado exitosamente',
    updated: 'El movimiento fue actualizado exitosamente',
    type: 'Tipo:',
    category: 'Categoría:',
    amount: 'Monto:',
  },
  calendar: {
    previous: 'Mes anterior',
    next: 'Mes siguiente',
    months: [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ],
    weekdays: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  },
  tabs: {
    movements: 'Movimientos',
    analysis: 'Análisis',
    recommendations: 'Recomendaciones',
    newMovement: '+ Nuevo movimiento',
  },
} as const;
