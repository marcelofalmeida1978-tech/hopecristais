/**
 * Utilitário robusto de compressão e otimização de imagens para celular e desktop.
 * Suporta fotos de alta resolução, fotos tiradas na hora (câmera),
 * formatos HEIC/HEIF de iPhones (Apple) e imagens de galeria Android.
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

function readFileAsDataUrl(blob: Blob): Promise<string> {
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

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  // 1. Verificação flexível do tipo do arquivo
  const isImageMime = file.type ? file.type.startsWith('image/') : false;
  const isImageExt = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);

  if (!isImageMime && !isImageExt && file.type !== '') {
    throw new Error('O arquivo selecionado não é uma foto ou imagem válida.');
  }

  let processedBlob: Blob = file;

  // 2. Tratamento para fotos de iPhone (HEIC / HEIF)
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

  // 3. Tentar decodificação via createImageBitmap (suporta EXIF orientation de câmeras e usa menos memória)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      // imageOrientation: 'from-image' corrige fotos que ficam de lado no celular
      const bitmap = await createImageBitmap(processedBlob, { imageOrientation: 'from-image' });
      let { width, height } = bitmap;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        return canvas.toDataURL('image/jpeg', quality);
      }
      bitmap.close();
    } catch (bitmapErr) {
      console.warn('createImageBitmap indisponível ou falhou, usando URL.createObjectURL:', bitmapErr);
    }
  }

  // 4. Decodificação via URL.createObjectURL e HTMLImageElement
  return new Promise<string>((resolve, reject) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(processedBlob);
    } catch (urlErr) {
      // Se URL.createObjectURL falhar, tenta FileReader direto
      readFileAsDataUrl(processedBlob).then(resolve).catch(reject);
      return;
    }

    const img = new Image();

    const cleanup = () => {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch {}
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          cleanup();
          readFileAsDataUrl(processedBlob).then(resolve).catch(reject);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        cleanup();
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (canvasErr) {
        cleanup();
        readFileAsDataUrl(processedBlob).then(resolve).catch(reject);
      }
    };

    img.onerror = () => {
      cleanup();
      // Tentativa final com FileReader direto
      readFileAsDataUrl(processedBlob)
        .then(resolve)
        .catch(() => {
          reject(
            new Error(
              'Não foi possível processar a foto do celular. Tente selecionar novamente ou salvar como JPEG/PNG.'
            )
          );
        });
    };

    img.src = objectUrl;
  });
}
