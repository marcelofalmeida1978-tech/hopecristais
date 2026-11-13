import { SupabaseClient } from '@supabase/supabase-js';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export interface CompressedImageUpload {
  blob: Blob;
  contentType: string;
  ext: string;
}

const STORAGE_PUBLIC_MARKER = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

/**
 * Extrai o caminho interno no bucket `product-images` a partir de uma URL pública do Supabase Storage.
 */
export function extractStoragePathFromUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const idx = trimmed.indexOf(STORAGE_PUBLIC_MARKER);
  if (idx === -1) return null;

  const rawPath = trimmed.slice(idx + STORAGE_PUBLIC_MARKER.length).split('?')[0].split('#')[0];
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

/**
 * Faz o upload de uma imagem comprimida para o bucket público `product-images` e retorna sua URL pública.
 */
export async function uploadProductImageBlob(
  client: SupabaseClient,
  productId: string,
  upload: CompressedImageUpload,
  index = 0
): Promise<string> {
  const safeId = String(productId || 'produto').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeExt = (upload.ext || 'webp').replace(/[^a-z0-9]/gi, '') || 'webp';
  const storagePath = `products/${safeId}/${Date.now()}-${index}.${safeExt}`;

  const { error: uploadError } = await client.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, upload.blob, {
      contentType: upload.contentType || 'image/webp',
      cacheControl: '31536000',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Falha no upload da imagem para o Storage: ${uploadError.message}`);
  }

  const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);
  if (!data?.publicUrl) {
    throw new Error('Não foi possível obter a URL pública da imagem enviada ao Storage.');
  }

  return data.publicUrl;
}

/**
 * Remove do bucket `product-images` os arquivos correspondentes às URLs informadas.
 */
export async function deleteProductStorageImages(
  client: SupabaseClient,
  urls: Array<string | null | undefined>
): Promise<void> {
  const paths = Array.from(
    new Set(
      urls
        .map((url) => extractStoragePathFromUrl(url))
        .filter((p): p is string => Boolean(p))
    )
  );

  if (paths.length === 0) return;

  const { error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  if (error) {
    console.warn('Aviso ao remover imagem antiga do Supabase Storage:', error.message);
  }
}
