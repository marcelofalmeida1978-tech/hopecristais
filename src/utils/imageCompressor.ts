import { CompressedImageUpload } from './storageImages';

/**
 * Utilitário robusto de compressão e otimização de imagens para celular e desktop.
 * Suporta fotos de alta resolução, fotos tiradas na hora (câmera),
 * formatos HEIC/HEIF de iPhones (Apple) e imagens de galeria Android.
 * Gera saída otimizada em WebP (com fallback automático para JPEG).
 */

function isHeicImage(file: File | Blob, fileName: string): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  return (
    type.includes('heic') ||
    type.includes('heif') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao ler dados da imagem.'));
      }
    };
    reader.onerror = () => reject(new Error('Falha na leitura do arquivo.'));
    reader.readAsDataURL(blob);
  });
}

function canvasToCompressedBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<CompressedImageUpload> {
  const tryEncode = (mimeType: 'image/webp' | 'image/jpeg'): Promise<Blob | null> =>
    new Promise((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), mimeType, quality);
      } catch {
        resolve(null);
      }
    });

  return (async () => {
    const webpBlob = await tryEncode('image/webp');
    if (webpBlob && webpBlob.size > 0 && webpBlob.type === 'image/webp') {
      return { blob: webpBlob, contentType: 'image/webp', ext: 'webp' };
    }

    const jpegBlob = await tryEncode('image/jpeg');
    if (jpegBlob && jpegBlob.size > 0) {
      return { blob: jpegBlob, contentType: 'image/jpeg', ext: 'jpg' };
    }

    throw new Error('Falha ao gerar arquivo comprimido da imagem.');
  })();
}

function fitDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = srcWidth || maxWidth;
  let height = srcHeight || maxHeight;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }
  return { width, height };
}

function fallbackBlobResult(blob: Blob): CompressedImageUpload {
  const type = (blob.type || 'image/jpeg').toLowerCase();
  const ext =
    type === 'image/webp'
      ? 'webp'
      : type === 'image/png'
      ? 'png'
      : type === 'image/avif'
      ? 'avif'
      : 'jpg';
  return { blob, contentType: type, ext };
}

/**
 * Comprime e redimensiona uma imagem no navegador (máx 1200px, WebP/JPEG) retornando Blob binário
 * pronto para upload direto ao Supabase Storage.
 */
export async function compressImageToBlob(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.84
): Promise<CompressedImageUpload> {
  const isImageMime = file.type ? file.type.startsWith('image/') : false;
  const isImageExt = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);

  if (!isImageMime && !isImageExt && file.type !== '') {
    throw new Error('O arquivo selecionado não é uma foto ou imagem válida.');
  }

  let processedBlob: Blob = file;

  // Conversão para fotos HEIC / HEIF de iPhone
  if (isHeicImage(file, file.name)) {
    try {
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.88
      });
      processedBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (heicErr) {
      console.warn('Aviso: Conversão HEIC nativa não necessária ou falhou, tentando leitura direta:', heicErr);
    }
  }

  // Decodificação via createImageBitmap com correção automática de orientação EXIF
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(processedBlob, { imageOrientation: 'from-image' });
      const { width, height } = fitDimensions(bitmap.width, bitmap.height, maxWidth, maxHeight);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        return await canvasToCompressedBlob(canvas, quality);
      }
      bitmap.close();
    } catch (bitmapErr) {
      console.warn('createImageBitmap indisponível ou falhou, usando URL.createObjectURL:', bitmapErr);
    }
  }

  // Fallback via URL.createObjectURL + HTMLImageElement
  return new Promise<CompressedImageUpload>((resolve, reject) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(processedBlob);
    } catch {
      if (processedBlob.type && processedBlob.type.startsWith('image/')) {
        resolve(fallbackBlobResult(processedBlob));
      } else {
        reject(new Error('Não foi possível ler a imagem selecionada.'));
      }
      return;
    }

    const img = new Image();
    const cleanup = () => {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch {
        // safe
      }
    };

    img.onload = async () => {
      try {
        const { width, height } = fitDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxWidth,
          maxHeight
        );
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          cleanup();
          resolve(fallbackBlobResult(processedBlob));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        cleanup();
        const encoded = await canvasToCompressedBlob(canvas, quality);
        resolve(encoded);
      } catch {
        cleanup();
        resolve(fallbackBlobResult(processedBlob));
      }
    };

    img.onerror = () => {
      cleanup();
      if (processedBlob.type && processedBlob.type.startsWith('image/')) {
        resolve(fallbackBlobResult(processedBlob));
      } else {
        reject(
          new Error(
            'Não foi possível processar a foto do celular. Tente selecionar novamente ou salvar como JPEG/PNG.'
          )
        );
      }
    };

    img.src = objectUrl;
  });
}

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.84
): Promise<string> {
  const { blob } = await compressImageToBlob(file, maxWidth, maxHeight, quality);
  return readBlobAsDataUrl(blob);
}
