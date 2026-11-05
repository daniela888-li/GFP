// Textos visibles de HU7. Títulos, mensajes y botones son literales de la historia o de su
// prototipo.
export const RECEIPT_TEXTS = {
  title: 'Movimiento con foto',
  subtitle: 'Toma una foto de tu factura y creamos el movimiento por ti',
  preview: 'Vista previa',
  takePhoto: 'Tomar fotografía',
  pickGallery: 'Seleccionar de la galería',
  cancel: 'Cancelar',
  retry: 'Reintentar',
  continue: 'Continuar',
  processing: 'Procesando imagen con OCR…',
  invalidImage:
    'Formato o tamaño de imagen no soportado. Usa una imagen JPG o PNG de máximo 5 MB.',
  noData:
    'No se pudo leer la información de la imagen. Por favor, intente con otra imagen o continúe para ingresar los datos manualmente',
  noDataTitle: 'No se pudo procesar',
  captureFailed:
    'No fue posible abrir la cámara o la galería. Intenta de nuevo',
  review: {
    title: 'Revisar movimiento',
    complete: 'Todos los datos leídos correctamente',
    partial: 'Se han recuperado algunos datos',
    none: 'La factura debe verse clara y legible',
  },
  badges: {
    complete: 'COMPLETADO',
    partial: 'INCOMPLETO',
    none: 'IMAGEN BORROSA',
  },
  extracted: 'Datos extraídos',
  amount: 'Monto',
  date: 'Fecha',
  merchant: 'Comercio / Descripción',
  notIdentified: 'No identificado',
} as const;
