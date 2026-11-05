import type { ReceiptImage } from './receiptImage';

// Acceso a cámara, galería y OCR. `null` significa que el usuario canceló la captura.
export interface ReceiptGateway {
  takePhoto(): Promise<ReceiptImage | null>;
  pickFromGallery(): Promise<ReceiptImage | null>;
  recognizeText(uri: string): Promise<string>;
}
