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
  history: {
    title: 'Historial',
    subtitle: 'Movimientos de tus finanzas',
    filtersTitle: 'Filtros de búsqueda',
    listTitle: 'Movimientos recientes',
    from: 'Fecha inicio',
    to: 'Fecha fin',
    type: 'Tipo de movimiento',
    allTypes: 'Todos los tipos',
    category: 'Categoría',
    allCategories: 'Categoría (Todas)',
    filter: 'Filtrar',
    clearFilters: 'Limpiar filtros',
    edit: 'Editar',
    delete: 'Eliminar',
    newMovement: '+ Nuevo movimiento',
    photoMovement: 'Movimiento con foto',
    categories: 'Categorías',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    accept: 'Aceptar',
    emptyInitial: 'No hay movimientos registrados',
    emptyFilteredTitle: 'No se encontraron movimientos',
    emptyFilteredSubtitle:
      'Intenta cambiar los filtros seleccionados o realiza otra búsqueda',
    deleteQuestion: '¿Está seguro de eliminar este movimiento?',
    deleteWarning: 'Esta acción es irreversible y afectará su balance.',
    deleted: 'Movimiento eliminado correctamente',
    // Propuestas (E08-D3).
    invalidFrom: 'Ingrese una fecha de inicio válida',
    invalidTo: 'Ingrese una fecha de fin válida',
    invertedRange: 'La fecha inicio no puede ser posterior a la fecha fin',
    loadFailed: 'No fue posible cargar los movimientos. Intenta de nuevo',
    deleteFailed: 'No fue posible eliminar el movimiento. Intenta de nuevo',
    notFound: 'El movimiento ya no existe.',
  },
  balance: {
    income: 'INGRESOS',
    expense: 'GASTOS',
    balance: 'BALANCE',
  },
  prefill: {
    partial:
      'No fue posible identificar toda la información. Complete los datos manualmente',
  },
  tabs: {
    movements: 'Movimientos',
    analysis: 'Análisis',
    recommendations: 'Recomendaciones',
  },
} as const;
