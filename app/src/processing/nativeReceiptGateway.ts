import TextRecognition from '@react-native-ml-kit/text-recognition';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { rowsFromLines } from './receiptExtraction';
import type { ReceiptGateway } from './receiptGateway';
import type { ReceiptImage } from './receiptImage';

function toImage(response: ImagePickerResponse): ReceiptImage | null {
  if (response.didCancel) {
    return null;
  }
  if (response.errorCode !== undefined) {
    throw new Error(`image capture failed: ${response.errorCode}`);
  }
  const asset = response.assets?.[0];
  if (asset?.uri === undefined) {
    return null;
  }
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? null,
    mimeType: asset.type ?? null,
    sizeBytes: asset.fileSize ?? null,
  };
}

// La imagen se procesa en el dispositivo con ML Kit: no se envía a ningún servidor.
export const nativeReceiptGateway: ReceiptGateway = {
  async takePhoto() {
    return toImage(await launchCamera({ mediaType: 'photo' }));
  },
  async pickFromGallery() {
    return toImage(
      await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }),
    );
  },
  async recognizeText(uri) {
    const result = await TextRecognition.recognize(uri);
    const lines = result.blocks.flatMap(block => block.lines);
    return lines.length > 0 ? rowsFromLines(lines) : result.text;
  },
};
