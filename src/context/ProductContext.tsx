import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import {
  supabase,
  DEFAULT_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  createFreshSupabaseClient
} from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { saveCatalogToIDB, loadCatalogFromIDB } from '../utils/indexedDbCache';
import { getFallbackImage, HOPE_PLACEHOLDER_PATH } from '../utils/imageFallback';

const STORAGE_KEY = 'hope_cristais_catalog_v2';
const CATEGORIES_STORAGE_KEY = 'hope_cristais_categories_v2';
const SUPABASE_URL_KEY = 'hope_supabase_url';
const CATALOG_SYNC_PING_KEY = 'hope_catalog_sync_ping';
const BROADCAST_CHANNEL_NAME = 'hope_catalog_sync';

export const INITIAL_CATEGORIES = [
  'Cristais',
  'Pulseiras',
  'Decoração',
  'Kits & Presentes',
  'Pedras Brutas',
  'Geodos',
  'Drusas',
  'Pontas',
  'Na Base',
  'Diversos'
];

interface ProductContextType {
  products: Product[];
  categories: string[];
  dbTotalCount: number | null;
  addProduct: (productData: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleStock: (id: string) => Promise<void>;
  resetToDefaults: () => void;
  addCategory: (categoryName: string) => boolean;
  deleteCategories: (categoriesToDelete: string[]) => void;
  supabaseUrl: string;
  setSupabaseUrl: (url: string) => void;
  supabaseConnected: boolean;
  isConnectingSupabase: boolean;
  isInitialLoading: boolean;
  hasLoadedSupabase: boolean;
  isSyncingImages: boolean;
  lastSyncError: string | null;
  reconnectSupabase: (urlToUse?: string, options?: { waitForImages?: boolean }) => Promise<{ success: boolean; message: string }>;
  refreshCatalog: () => Promise<{ success: boolean; message: string }>;
  saveAndRevalidateSite: () => Promise<{ success: boolean; message: string }>;
}

// Cache em memória da existência da coluna optional `quantity` na tabela `products`
let supportsQuantityColumn: boolean | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMissingQuantityColumnError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    (typeof error.message === 'string' && error.message.includes('quantity'))
  );
}

/**
 * Resolve com rigor a imagem do produto vindo do Supabase ou cadastro local:
 * - Suporta `row.image`, `row.image_url`, `row.imageUrl`, `row.picture`, `row.photo`
 * - Preserva URLs remotas (http/https) e fotos em base64 (data:image/)
 * - Mapeia nomes de arquivos puros (ex: "cristal.jpg") para "/products/cristal.jpg"
 * - Se vier sem imagem mas tiver ID correspondente aos produtos físicos originais, preserva a foto física
 * - Se vier apenas com ID/slug, monta o caminho "/products/${id}.jpg"
 * - NUNCA aplica array de fotos de teste baseado em índices nem troca por fotos de outros produtos
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveProductImage(row: any): string {
  if (!row) return getFallbackImage();

  let candidate =
    row.image ||
    row.image_url ||
    row.imageUrl ||
    row.picture ||
    row.photo ||
    (Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : '') ||
    '';

  if (typeof candidate === 'string') {
    candidate = candidate.trim();
  } else {
    candidate = '';
  }

  // 1. Se for base64 ou link remoto absoluto
  if (
    candidate.startsWith('data:image/') ||
    candidate.startsWith('http://') ||
    candidate.startsWith('https://')
  ) {
    return candidate;
  }

  // 2. Se for caminho relativo na raiz (/products/... ou /assets/...)
  if (candidate.startsWith('/')) {
    return candidate;
  }

  // 3. Se for nome de arquivo sem barra (ex: "cristal.jpg")
  if (candidate) {
    return `/products/${candidate}`;
  }

  // 4. Se o campo de imagem veio vazio, tentar mapear pelo ID do produto
  if (row.id) {
    const initialMatch = INITIAL_PRODUCTS.find((ip) => ip.id === row.id);
    if (initialMatch && initialMatch.image) {
      return initialMatch.image;
    }
    return `/products/${row.id}.jpg`;
  }

  return getFallbackImage(row.category);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveProductImages(row: any, primaryImage: string): string[] {
  let imagesList: string[] = [];

  if (Array.isArray(row.images) && row.images.length > 0) {
    imagesList = row.images
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((img: any, idx: number) => {
        if (idx === 0) return primaryImage;
        if (!img || typeof img !== 'string') return '';
        const trimmed = img.trim();
        if (
          trimmed.startsWith('data:image/') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('/')
        ) {
          return trimmed;
        }
        return `/products/${trimmed}`;
      })
      .filter(Boolean);
  }

  if (imagesList.length === 0 || imagesList[0] !== primaryImage) {
    imagesList = primaryImage ? [primaryImage] : [getFallbackImage(row?.category)];
  }

  return imagesList;
}

// Utilitário para converter registro do Supabase para formato Product do app
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(row: any): Product {
  const priceNum = Number(row.price) || 0;

  // 1. Verificar quantidade direta na coluna quantity (se existir no banco)
  let parsedQty: number | undefined = undefined;
  if (row.quantity !== undefined && row.quantity !== null && !isNaN(Number(row.quantity))) {
    parsedQty = Number(row.quantity);
  } else if (Array.isArray(row.keywords)) {
    // 2. Extrair do fallback de keywords se a coluna quantity ainda não existir na tabela
    const qtyTag = row.keywords.find((k: string) => typeof k === 'string' && k.startsWith('__stock_qty:'));
    if (qtyTag) {
      const extracted = parseInt(qtyTag.replace('__stock_qty:', ''), 10);
      if (!isNaN(extracted)) {
        parsedQty = extracted;
      }
    }
  }

  // 3. Se ainda não encontrado, usar status de estoque ou 1 como padrão
  if (parsedQty === undefined) {
    parsedQty = row.in_stock === false ? 0 : 1;
  }
  parsedQty = Math.max(0, parsedQty);

  // Filtrar palavras-chave internas para não expor __stock_qty para o usuário
  const cleanKeywords = Array.isArray(row.keywords)
    ? row.keywords.filter((k: string) => typeof k === 'string' && !k.startsWith('__stock_qty:'))
    : [];

  // Mapeamento estrito da imagem específica desta peça (sem substituições por fotos alheias)
  const productImg = resolveProductImage(row);
  const productImages = resolveProductImages(row, productImg);

  return {
    id: row.id,
    name: row.name,
    category: row.category === 'Outros' ? 'Diversos' : row.category,
    price: priceNum,
    priceFormatted:
      row.price_formatted ||
      `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
    image: productImg,
    images: productImages,
    description: row.description || '',
    shortDescription:
      row.short_description ||
      (row.description ? row.description.slice(0, 100) : ''),
    dimensions: row.dimensions || undefined,
    weight: row.weight || undefined,
    inStock: row.in_stock !== false && parsedQty > 0,
    quantity: parsedQty,
    isFeatured: !!row.is_featured,
    tag: row.tag || undefined,
    details: Array.isArray(row.details) ? row.details : [],
    careInstructions: row.care_instructions || undefined,
    keywords: cleanKeywords,
    updatedAt: row.updated_at || undefined
  };
}

// Utilitário para converter Product do app para o schema do Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRow(p: Product, includeQuantity: boolean = true): Record<string, any> {
  const parsedQty = p.quantity !== undefined ? Math.max(0, Number(p.quantity)) : (p.inStock === false ? 0 : 1);
  const isAvailable = p.inStock !== false && parsedQty > 0;

  // Garantir que a quantidade de peças esteja gravada também em keywords como garantia/fallback
  const filteredKeywords = Array.isArray(p.keywords)
    ? p.keywords.filter((k) => typeof k === 'string' && !k.startsWith('__stock_qty:'))
    : [];
  filteredKeywords.push(`__stock_qty:${parsedQty}`);

  let normalizedImage = (p.image || '').trim();
  if (
    normalizedImage &&
    !normalizedImage.startsWith('http://') &&
    !normalizedImage.startsWith('https://') &&
    !normalizedImage.startsWith('data:image/') &&
    !normalizedImage.startsWith('/')
  ) {
    normalizedImage = `/products/${normalizedImage}`;
  }

  const normalizedImages = (p.images && p.images.length > 0 ? p.images : [normalizedImage]).map((img) => {
    const trimmed = (img || '').trim();
    if (
      trimmed &&
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('data:image/') &&
      !trimmed.startsWith('/')
    ) {
      return `/products/${trimmed}`;
    }
    return trimmed;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {
    id: p.id,
    name: p.name,
    category: p.category === 'Outros' ? 'Diversos' : p.category,
    price: p.price,
    price_formatted: p.priceFormatted,
    image: normalizedImage,
    images: normalizedImages,
    description: p.description || '',
    short_description: p.shortDescription || '',
    dimensions: p.dimensions || null,
    weight: p.weight || null,
    in_stock: isAvailable,
    is_featured: !!p.isFeatured,
    tag: p.tag || null,
    details: p.details || [],
    care_instructions: p.careInstructions || null,
    keywords: filteredKeywords,
    updated_at: p.updatedAt || new Date().toISOString()
  };
  if (includeQuantity) {
    row.quantity = parsedQty;
  }
  return row;
}

// Funções utilitárias seguras para Supabase com verificação real de erro e fallback de coluna quantity
const safeInsertProduct = async (client: SupabaseClient, p: Product): Promise<void> => {
  const tryWithQty = supportsQuantityColumn !== false;
  const row = toRow(p, tryWithQty);
  const { error } = await client.from('products').insert(row);

  if (!error) {
    if (tryWithQty) supportsQuantityColumn = true;
    return;
  }

  if (tryWithQty && isMissingQuantityColumnError(error)) {
    supportsQuantityColumn = false;
    const fallbackRow = toRow(p, false);
    const { error: fallbackErr } = await client.from('products').insert(fallbackRow);
    if (fallbackErr) {
      throw new Error(`Falha ao salvar produto no Supabase: ${fallbackErr.message}`);
    }
    return;
  }

  throw new Error(`Falha ao salvar produto no Supabase: ${error.message}`);
};

const safeUpdateProduct = async (client: SupabaseClient, p: Product): Promise<void> => {
  const tryWithQty = supportsQuantityColumn !== false;
  const row = toRow(p, tryWithQty);
  const { error } = await client.from('products').update(row).eq('id', p.id);

  if (!error) {
    if (tryWithQty) supportsQuantityColumn = true;
    return;
  }

  if (tryWithQty && isMissingQuantityColumnError(error)) {
    supportsQuantityColumn = false;
    const fallbackRow = toRow(p, false);
    const { error: fallbackErr } = await client.from('products').update(fallbackRow).eq('id', p.id);
    if (fallbackErr) {
      throw new Error(`Falha ao atualizar produto no Supabase: ${fallbackErr.message}`);
    }
    return;
  }

  throw new Error(`Falha ao atualizar produto no Supabase: ${error.message}`);
};

const safeToggleStock = async (client: SupabaseClient, id: string, inStock: boolean, quantity: number, updatedAt: string): Promise<void> => {
  if (supportsQuantityColumn !== false) {
    const payloadWithQty = { in_stock: inStock, quantity, updated_at: updatedAt };
    const { error } = await client.from('products').update(payloadWithQty).eq('id', id);
    if (!error) {
      supportsQuantityColumn = true;
      return;
    }
    if (!isMissingQuantityColumnError(error)) {
      throw new Error(`Falha ao atualizar estoque no Supabase: ${error.message}`);
    }
    supportsQuantityColumn = false;
  }

  const { data } = await client.from('products').select('keywords').eq('id', id).maybeSingle();
  const currentKeywords = Array.isArray(data?.keywords)
    ? data.keywords.filter((k: string) => typeof k === 'string' && !k.startsWith('__stock_qty:'))
    : [];
  currentKeywords.push(`__stock_qty:${quantity}`);

  const payloadWithoutQty = {
    in_stock: inStock,
    keywords: currentKeywords,
    updated_at: updatedAt
  };
  const { error: fallbackErr } = await client.from('products').update(payloadWithoutQty).eq('id', id);
  if (fallbackErr) {
    throw new Error(`Falha ao atualizar estoque no Supabase: ${fallbackErr.message}`);
  }
};

const safeBatchUpsertProducts = async (client: SupabaseClient, productsList: Product[]): Promise<void> => {
  if (productsList.length === 0) return;
  const batchSize = 5;
  for (let i = 0; i < productsList.length; i += batchSize) {
    const chunk = productsList.slice(i, i + batchSize);
    const tryWithQty = supportsQuantityColumn !== false;
    const chunkRows = chunk.map((p) => toRow(p, tryWithQty));
    const { error } = await client.from('products').upsert(chunkRows, { onConflict: 'id' });

    if (!error) {
      if (tryWithQty) supportsQuantityColumn = true;
      continue;
    }

    if (tryWithQty && isMissingQuantityColumnError(error)) {
      supportsQuantityColumn = false;
      const fallbackChunk = chunk.map((p) => toRow(p, false));
      const { error: fallbackErr } = await client.from('products').upsert(fallbackChunk, { onConflict: 'id' });
      if (fallbackErr) {
        throw new Error(`Falha na sincronização em lote: ${fallbackErr.message}`);
      }
    } else {
      throw new Error(`Falha na sincronização em lote: ${error.message}`);
    }
  }
};

const fetchExactProductCount = async (client: SupabaseClient): Promise<number | null> => {
  const { count, error } = await client
    .from('products')
    .select('id', { count: 'exact', head: true });
  if (error) {
    console.warn('Erro ao consultar contagem exata:', error);
    return null;
  }
  return typeof count === 'number' ? count : null;
};

const METADATA_COLUMNS_WITH_QTY =
  'id,name,category,price,price_formatted,description,short_description,dimensions,weight,in_stock,quantity,is_featured,tag,details,care_instructions,keywords,created_at,updated_at';
const METADATA_COLUMNS_NO_QTY =
  'id,name,category,price,price_formatted,description,short_description,dimensions,weight,in_stock,is_featured,tag,details,care_instructions,keywords,created_at,updated_at';

function hasUsableCachedImage(p?: Product): boolean {
  if (!p || !p.image) return false;
  const img = p.image.trim();
  if (!img || img === HOPE_PLACEHOLDER_PATH || img.startsWith('data:image/svg+xml')) return false;
  return true;
}

/**
 * Busca 100% dos produtos no Supabase sem limite de 500 ou 1.000 linhas e sem timeout de base64:
 * 1. Pagina metadados em lotes de 1.000 linhas (com `{ count: 'exact' }`), retornando em <1s mesmo com milhares de produtos.
 * 2. Reaproveita imagens do cache local quando `updated_at` coincide e baixa as imagens faltantes/atualizadas em lotes adaptativos
 *    que se subdividem automaticamente caso algum registro grande gere timeout (57014).
 */
const fetchAllProductsResilient = async (
  client: SupabaseClient,
  cachedProducts: Product[],
  onMetadataReady: (products: Product[], exactCount: number, categories: string[]) => void,
  onImagesBatch: (imageMap: Map<string, { image: string; images: string[] }>) => void,
  isCancelled: () => boolean
): Promise<{ products: Product[]; exactCount: number; categories: string[] }> => {
  const PAGE_SIZE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMetaRows: any[] = [];
  const seenIds = new Set<string>();
  let exactCount: number | null = null;

  let from = 0;
  while (true) {
    if (isCancelled()) break;
    const to = from + PAGE_SIZE - 1;
    const useQty = supportsQuantityColumn !== false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res: { data: any[] | null; error: any; count: number | null } = await client
      .from('products')
      .select(useQty ? METADATA_COLUMNS_WITH_QTY : METADATA_COLUMNS_NO_QTY, from === 0 ? { count: 'exact' } : undefined)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to);

    if (res.error && useQty && isMissingQuantityColumnError(res.error)) {
      supportsQuantityColumn = false;
      res = await client
        .from('products')
        .select(METADATA_COLUMNS_NO_QTY, from === 0 ? { count: 'exact' } : undefined)
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to);
    }

    if (res.error) {
      throw new Error(`Erro ao listar produtos no Supabase: ${res.error.message}`);
    }

    if (from === 0 && typeof res.count === 'number') {
      exactCount = res.count;
    }

    const batch = res.data || [];
    for (const row of batch) {
      if (row && row.id && !seenIds.has(row.id)) {
        seenIds.add(row.id);
        allMetaRows.push(row);
      }
    }

    if (batch.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  if (isCancelled()) {
    return { products: cachedProducts, exactCount: exactCount ?? cachedProducts.length, categories: [] };
  }

  const cachedById = new Map<string, Product>();
  for (const cp of cachedProducts) {
    if (cp && cp.id) cachedById.set(cp.id, cp);
  }

  const idsNeedingImages: string[] = [];
  const sameTimestamp = (a?: string, b?: string): boolean => {
    if (!a || !b) return false;
    if (a === b) return true;
    const ta = Date.parse(a);
    const tb = Date.parse(b);
    return !isNaN(ta) && !isNaN(tb) && ta === tb;
  };

  const hydratedProducts: Product[] = allMetaRows.map((row) => {
    const cached = cachedById.get(row.id);
    const hasCacheImg = hasUsableCachedImage(cached);
    const isSameVersion = hasCacheImg && sameTimestamp(cached?.updatedAt, row.updated_at);

    if (!isSameVersion) {
      idsNeedingImages.push(row.id);
    }

    const rowWithImage = hasCacheImg
      ? {
          ...row,
          image: cached!.image,
          images: cached!.images && cached!.images.length > 0 ? cached!.images : [cached!.image]
        }
      : row;

    return toProduct(rowWithImage);
  });

  hydratedProducts.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const productCats = hydratedProducts.map((p) => p.category).filter(Boolean);
  const resolvedCount = exactCount ?? hydratedProducts.length;

  onMetadataReady(hydratedProducts, resolvedCount, productCats);

  // Fase 2: buscar imagens faltantes ou desatualizadas em lotes adaptativos sem causar timeout 57014
  if (idsNeedingImages.length > 0 && !isCancelled()) {
    const imageMap = new Map<string, { image: string; images: string[] }>();

    const fetchChunkAdaptive = async (chunkIds: string[]): Promise<void> => {
      if (isCancelled() || chunkIds.length === 0) return;

      const { data, error } = await client
        .from('products')
        .select('id,image,images')
        .in('id', chunkIds);

      if (!error && data) {
        for (const r of data) {
          if (!r || !r.id) continue;
          const resolvedImg = resolveProductImage(r);
          const resolvedImgs = resolveProductImages(r, resolvedImg);
          imageMap.set(r.id, { image: resolvedImg, images: resolvedImgs });
        }
        return;
      }

      if (chunkIds.length > 1) {
        const mid = Math.ceil(chunkIds.length / 2);
        await fetchChunkAdaptive(chunkIds.slice(0, mid));
        await fetchChunkAdaptive(chunkIds.slice(mid));
        return;
      }

      // Fallback final para item único caso `images` array seja grande demais
      const singleId = chunkIds[0];
      const { data: singleData } = await client
        .from('products')
        .select('id,image')
        .eq('id', singleId)
        .maybeSingle();
      if (singleData) {
        const resolvedImg = resolveProductImage(singleData);
        imageMap.set(singleId, { image: resolvedImg, images: [resolvedImg] });
      }
    };

    const CHUNK_SIZE = 8;
    const chunks: string[][] = [];
    for (let i = 0; i < idsNeedingImages.length; i += CHUNK_SIZE) {
      chunks.push(idsNeedingImages.slice(i, i + CHUNK_SIZE));
    }

    const CONCURRENCY = 2;
    let processedChunks = 0;
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      if (isCancelled()) break;
      const group = chunks.slice(i, i + CONCURRENCY);
      await Promise.all(group.map(fetchChunkAdaptive));
      processedChunks += group.length;

      // Atualiza progressivamente a interface a cada ~32 produtos carregados ou no final
      if (imageMap.size > 0 && (processedChunks % 4 === 0 || i + CONCURRENCY >= chunks.length)) {
        onImagesBatch(new Map(imageMap));
      }
    }

    if (imageMap.size > 0 && !isCancelled()) {
      const finalProducts = hydratedProducts.map((p) => {
        const imgEntry = imageMap.get(p.id);
        return imgEntry ? { ...p, image: imgEntry.image, images: imgEntry.images } : p;
      });
      return {
        products: finalProducts,
        exactCount: resolvedCount,
        categories: productCats
      };
    }
  }

  return {
    products: hydratedProducts,
    exactCount: resolvedCount,
    categories: productCats
  };
};

// Evita estourar os 5MB do localStorage com strings base64 gigantes: salva apenas versões leves no localStorage
function saveLightweightProductsToLocalStorage(productsList: Product[]) {
  try {
    const light = productsList.map((p) => ({
      ...p,
      image: p.image && p.image.startsWith('data:image/') ? '' : p.image,
      images: Array.isArray(p.images)
        ? p.images.filter((img) => img && !img.startsWith('data:image/'))
        : []
    }));
    const serialized = JSON.stringify(light);
    if (serialized.length < 2_500_000) {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // IndexedDB guarda o catálogo completo incluindo fotos base64
  }
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_PRODUCTS.length) {
          return parsed.map((p: Product) => {
            const rawQty = p.quantity !== undefined && p.quantity !== null ? Number(p.quantity) : (p.inStock === false ? 0 : 1);
            const qty = isNaN(rawQty) ? 1 : Math.max(0, rawQty);
            return {
              ...p,
              category: p.category === 'Outros' ? 'Diversos' : p.category,
              quantity: qty,
              inStock: p.inStock !== false && qty > 0
            };
          });
        }
      }
    } catch (e) {
      console.error('Erro ao carregar catálogo salvo:', e);
    }
    return INITIAL_PRODUCTS.map((p) => {
      const rawQty = p.quantity !== undefined && p.quantity !== null ? Number(p.quantity) : (p.inStock === false ? 0 : 1);
      const qty = isNaN(rawQty) ? 1 : Math.max(0, rawQty);
      return {
        ...p,
        category: p.category === 'Outros' ? 'Diversos' : p.category,
        quantity: qty,
        inStock: p.inStock !== false && qty > 0
      };
    });
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const savedV2 = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed
            .map((c: string) => (c === 'Outros' ? 'Diversos' : c))
            .filter((c: string) => c !== 'Outros');
          return Array.from(new Set([...migrated, 'Diversos']));
        }
      }
    } catch (e) {
      console.error('Erro ao carregar categorias salvas:', e);
    }
    return INITIAL_CATEGORIES;
  });

  const [supabaseUrl, setSupabaseUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL;
    } catch {
      return DEFAULT_SUPABASE_URL;
    }
  });

  const [dbTotalCount, setDbTotalCount] = useState<number | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isConnectingSupabase, setIsConnectingSupabase] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [hasLoadedSupabase, setHasLoadedSupabase] = useState<boolean>(false);
  const [isSyncingImages, setIsSyncingImages] = useState<boolean>(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const [activeSupabaseClient, setActiveSupabaseClient] = useState<SupabaseClient | null>(() => supabase);

  // Refs para controle de concorrência e cache atualizado
  const productsRef = useRef<Product[]>(products);
  productsRef.current = products;
  const hasLoadedSupabaseRef = useRef<boolean>(hasLoadedSupabase);
  hasLoadedSupabaseRef.current = hasLoadedSupabase;
  const syncSeqRef = useRef<number>(0);
  const inFlightReconnectRef = useRef<Promise<{ success: boolean; message: string }> | null>(null);
  const idbProductsRef = useRef<Product[] | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const pendingUpsertIdsRef = useRef<Set<string>>(new Set());

  const notifyOtherTabs = useCallback(() => {
    try {
      broadcastChannelRef.current?.postMessage({ type: 'CATALOG_UPDATED', ts: Date.now() });
    } catch {
      // safe
    }
    try {
      localStorage.setItem(CATALOG_SYNC_PING_KEY, String(Date.now()));
    } catch {
      // safe
    }
  }, []);

  // Hidratação inicial do IndexedDB apenas antes de o Supabase responder (evita sobrescrever dados reais do banco)
  useEffect(() => {
    loadCatalogFromIDB()
      .then((idbProducts) => {
        if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
          idbProductsRef.current = idbProducts;
          if (!hasLoadedSupabaseRef.current) {
            setProducts(idbProducts);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Persistir no IndexedDB (sem limite de 5MB) e metadados leves no localStorage
  useEffect(() => {
    if (hasLoadedSupabase || products.length >= INITIAL_PRODUCTS.length) {
      idbProductsRef.current = products;
      saveCatalogToIDB(products).catch(() => {});
      saveLightweightProductsToLocalStorage(products);
    }
  }, [products, hasLoadedSupabase]);

  // Salvar categorias no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Erro ao salvar categorias no localStorage:', e);
    }
  }, [categories]);

  // Conectar/reconectar ao Supabase e sincronizar 100% do catálogo com contagem exata
  const reconnectSupabase = useCallback(
    async (
      urlToUse?: string,
      options?: { waitForImages?: boolean }
    ): Promise<{ success: boolean; message: string }> => {
      if (inFlightReconnectRef.current && !urlToUse) {
        return inFlightReconnectRef.current;
      }

      const waitForImages = options?.waitForImages !== false;
      const targetUrl = (urlToUse || supabaseUrl || DEFAULT_SUPABASE_URL || '').trim();
      if (!targetUrl || !targetUrl.startsWith('http')) {
        setSupabaseConnected(false);
        setIsConnectingSupabase(false);
        setIsInitialLoading(false);
        setLastSyncError('URL do Supabase não configurada.');
        return { success: false, message: 'URL do Supabase não configurada.' };
      }

      const seq = ++syncSeqRef.current;
      const isCancelled = () => syncSeqRef.current !== seq;

      const metadataGate: {
        resolve: ((res: { success: boolean; message: string }) => void) | null;
      } = { resolve: null };
      const metadataPhasePromise = !waitForImages
        ? new Promise<{ success: boolean; message: string }>((resolve) => {
            metadataGate.resolve = resolve;
          })
        : null;

      let task: Promise<{ success: boolean; message: string }> | null = null;
      task = (async (): Promise<{ success: boolean; message: string }> => {
        setIsConnectingSupabase(true);
        setLastSyncError(null);

        try {
          const client = createFreshSupabaseClient(targetUrl, SUPABASE_PUBLISHABLE_KEY);
          setActiveSupabaseClient(client);

          // 1. Ping rápido + contagem exata { count: 'exact' }
          const { count, error: countErr } = await client
            .from('products')
            .select('id', { count: 'exact', head: true });

          if (countErr && countErr.code !== 'PGRST116' && countErr.code !== '42703') {
            setSupabaseConnected(false);
            setIsConnectingSupabase(false);
            setIsInitialLoading(false);
            setLastSyncError(countErr.message);
            const failRes = { success: false, message: `Erro ao conectar: ${countErr.message}` };
            metadataGate.resolve?.(failRes);
            return failRes;
          }

          if (isCancelled()) {
            const cancelRes = { success: true, message: 'Sincronização substituída por atualização mais recente.' };
            metadataGate.resolve?.(cancelRes);
            return cancelRes;
          }

          setSupabaseConnected(true);
          if (typeof count === 'number') {
            setDbTotalCount(count);
          }

          // 2. Carregar categorias do banco
          try {
            const { data: dbCats } = await client
              .from('categories')
              .select('name')
              .order('name');
            if (dbCats && dbCats.length > 0 && !isCancelled()) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const names = dbCats.map((c: any) => c.name).filter(Boolean);
              setCategories(Array.from(new Set([...names, 'Diversos'])));
            }
          } catch (catErr) {
            console.warn('Aviso ao sincronizar categorias do Supabase:', catErr);
          }

          // 3. Combinar cache em memória + IndexedDB para hidratação instantânea de imagens sem re-baixar 67MB
          let cachedSource = productsRef.current;
          if (!idbProductsRef.current) {
            const idb = await loadCatalogFromIDB().catch(() => null);
            if (idb && idb.length > 0) idbProductsRef.current = idb;
          }
          if (idbProductsRef.current && idbProductsRef.current.length > 0) {
            const byId = new Map<string, Product>();
            for (const p of idbProductsRef.current) byId.set(p.id, p);
            for (const p of productsRef.current) {
              if (hasUsableCachedImage(p) || !byId.has(p.id)) byId.set(p.id, p);
            }
            cachedSource = Array.from(byId.values());
          }

          setIsSyncingImages(true);
          const { products: fullProducts, exactCount } = await fetchAllProductsResilient(
            client,
            cachedSource,
            (metaProducts, resolvedCount, metaCats) => {
              if (isCancelled()) return;
              setDbTotalCount(resolvedCount);
              setProducts(metaProducts);
              setHasLoadedSupabase(true);
              hasLoadedSupabaseRef.current = true;
              setIsConnectingSupabase(false);
              setIsInitialLoading(false);

              if (metaCats.length > 0) {
                setCategories((prev) => Array.from(new Set([...prev, ...metaCats, 'Diversos'])));
              }

              metadataGate.resolve?.({
                success: true,
                message: 'Supabase conectado e sincronizado com sucesso!'
              });
            },
            (imageMap) => {
              if (isCancelled()) return;
              setProducts((prev) =>
                prev.map((p) => {
                  const entry = imageMap.get(p.id);
                  return entry ? { ...p, image: entry.image, images: entry.images } : p;
                })
              );
            },
            isCancelled
          );

          if (!isCancelled()) {
            setDbTotalCount(exactCount);
            setProducts(fullProducts);
            setHasLoadedSupabase(true);
            hasLoadedSupabaseRef.current = true;
            setIsSyncingImages(false);
            setIsConnectingSupabase(false);
            setIsInitialLoading(false);
            saveCatalogToIDB(fullProducts).catch(() => {});
            saveLightweightProductsToLocalStorage(fullProducts);
          }

          const okRes = { success: true, message: 'Supabase conectado e sincronizado com sucesso!' };
          metadataGate.resolve?.(okRes);
          return okRes;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Falha ao conectar com o Supabase';
          if (!isCancelled()) {
            setLastSyncError(msg);
            setIsSyncingImages(false);
            setIsConnectingSupabase(false);
            setIsInitialLoading(false);
          }
          const errRes = { success: false, message: msg };
          metadataGate.resolve?.(errRes);
          return errRes;
        } finally {
          if (task && inFlightReconnectRef.current === task) {
            inFlightReconnectRef.current = null;
          }
        }
      })();

      if (!urlToUse) {
        inFlightReconnectRef.current = task;
      }
      return metadataPhasePromise ? metadataPhasePromise : task;
    },
    [supabaseUrl]
  );

  const refreshCatalog = useCallback(() => {
    return reconnectSupabase();
  }, [reconnectSupabase]);

  // Conexão automática ao Supabase ao iniciar a aplicação
  useEffect(() => {
    const targetUrl = supabaseUrl || DEFAULT_SUPABASE_URL;
    if (targetUrl && targetUrl.startsWith('http')) {
      reconnectSupabase(targetUrl);
    }
  }, [reconnectSupabase, supabaseUrl]);

  // Sincronização em tempo real entre abas do navegador (Admin <-> Vitrine)
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastChannelRef.current = channel;
        channel.onmessage = (event) => {
          if (event?.data?.type === 'CATALOG_UPDATED') {
            reconnectSupabase();
          }
        };
      } catch {
        // fallback para storage event
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CATALOG_SYNC_PING_KEY && e.newValue) {
        reconnectSupabase();
      }
      if (e.key === CATEGORIES_STORAGE_KEY && e.newValue) {
        try {
          const updatedCats = JSON.parse(e.newValue);
          if (Array.isArray(updatedCats)) {
            const migrated = updatedCats
              .map((c: string) => (c === 'Outros' ? 'Diversos' : c))
              .filter((c: string) => c !== 'Outros');
            setCategories(Array.from(new Set([...migrated, 'Diversos'])));
          }
        } catch (err) {
          console.error('Erro ao sincronizar categorias:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      try {
        broadcastChannelRef.current?.close();
        broadcastChannelRef.current = null;
      } catch {
        // safe
      }
    };
  }, [reconnectSupabase]);

  const setSupabaseUrl = async (url: string) => {
    const clean = url.trim();
    setSupabaseUrlState(clean);
    try {
      localStorage.setItem(SUPABASE_URL_KEY, clean);
    } catch (e) {
      console.error('Erro ao salvar Supabase URL:', e);
    }

    if (clean && clean.startsWith('http')) {
      await reconnectSupabase(clean);
    } else {
      setActiveSupabaseClient(null);
      setSupabaseConnected(false);
    }
  };

  const addCategory = (categoryName: string): boolean => {
    const clean = categoryName.trim();
    if (!clean) return false;

    const exists = categories.some((c) => c.toLowerCase() === clean.toLowerCase());
    if (exists) return false;

    setCategories((prev) => {
      const filtered = prev.filter(
        (c) => c !== 'Diversos' && c !== 'Outros' && c.toLowerCase() !== clean.toLowerCase()
      );
      return [...filtered, clean, 'Diversos'];
    });

    if (activeSupabaseClient) {
      const slug = clean.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      Promise.resolve(
        activeSupabaseClient
          .from('categories')
          .upsert({ id: slug || `cat-${Date.now()}`, name: clean })
      ).catch(console.error);
    }

    return true;
  };

  const deleteCategories = (categoriesToDelete: string[]) => {
    if (!categoriesToDelete || categoriesToDelete.length === 0) return;

    const toDelete = categoriesToDelete.filter((c) => c !== 'Diversos' && c !== 'Outros');
    if (toDelete.length === 0) return;

    setCategories((prev) => prev.filter((c) => !toDelete.includes(c) && c !== 'Outros'));

    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (toDelete.includes(p.category) || p.category === 'Outros') {
          return {
            ...p,
            category: 'Diversos'
          };
        }
        return p;
      })
    );

    if (activeSupabaseClient) {
      Promise.resolve(
        activeSupabaseClient
          .from('categories')
          .delete()
          .in('name', toDelete)
      ).catch(console.error);
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const newId = `hope-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const parsedQty = productData.quantity !== undefined ? Math.max(0, Number(productData.quantity)) : 1;
    const isAvailable = productData.inStock !== false && parsedQty > 0;
    const nowIso = new Date().toISOString();

    const newProduct: Product = {
      ...productData,
      id: newId,
      quantity: parsedQty,
      inStock: isAvailable,
      updatedAt: nowIso
    };

    if (activeSupabaseClient) {
      await safeInsertProduct(activeSupabaseClient, newProduct);
      pendingUpsertIdsRef.current.delete(newProduct.id);
      const exactCount = await fetchExactProductCount(activeSupabaseClient);
      setProducts((prev) => [newProduct, ...prev]);
      if (exactCount !== null) {
        setDbTotalCount(exactCount);
      } else {
        setDbTotalCount((prev) => (prev !== null ? prev + 1 : productsRef.current.length + 1));
      }
      notifyOtherTabs();
    } else {
      pendingUpsertIdsRef.current.add(newProduct.id);
      setProducts((prev) => [newProduct, ...prev]);
      setDbTotalCount((prev) => (prev !== null ? prev + 1 : productsRef.current.length + 1));
      notifyOtherTabs();
    }

    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    const existing = productsRef.current.find((item) => item.id === id);
    if (!existing) return;

    const merged: Product = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    if (merged.quantity !== undefined) {
      const num = Math.max(0, Number(merged.quantity));
      merged.quantity = num;
      if (num === 0) {
        merged.inStock = false;
      } else if (updates.inStock === undefined && existing.inStock === false) {
        merged.inStock = true;
      }
    }

    if (activeSupabaseClient) {
      await safeUpdateProduct(activeSupabaseClient, merged);
    }

    setProducts((prev) => prev.map((item) => (item.id === id ? merged : item)));
    notifyOtherTabs();
  };

  const deleteProduct = async (id: string): Promise<void> => {
    if (activeSupabaseClient) {
      const { error } = await activeSupabaseClient
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Falha ao excluir produto no Supabase: ${error.message}`);
      }

      const exactCount = await fetchExactProductCount(activeSupabaseClient);
      setProducts((prev) => prev.filter((item) => item.id !== id));
      if (exactCount !== null) {
        setDbTotalCount(exactCount);
      } else {
        setDbTotalCount((prev) => (prev !== null ? Math.max(0, prev - 1) : Math.max(0, productsRef.current.length - 1)));
      }
    } else {
      setProducts((prev) => prev.filter((item) => item.id !== id));
      setDbTotalCount((prev) => (prev !== null ? Math.max(0, prev - 1) : Math.max(0, productsRef.current.length - 1)));
    }
    notifyOtherTabs();
  };

  const toggleStock = async (id: string): Promise<void> => {
    const target = productsRef.current.find((item) => item.id === id);
    if (!target) return;

    const currentStatus = target.inStock !== false && (target.quantity === undefined || target.quantity > 0);
    const nextStatus = !currentStatus;
    const nextQuantity = nextStatus
      ? (target.quantity && target.quantity > 0 ? target.quantity : 1)
      : 0;
    const nowIso = new Date().toISOString();

    if (activeSupabaseClient) {
      await safeToggleStock(activeSupabaseClient, id, nextStatus, nextQuantity, nowIso);
    }

    setProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, inStock: nextStatus, quantity: nextQuantity, updatedAt: nowIso }
          : item
      )
    );
    notifyOtherTabs();
  };

  const resetToDefaults = () => {
    const defaultProducts = INITIAL_PRODUCTS.map((p) =>
      p.category === 'Outros' ? { ...p, category: 'Diversos' } : p
    );
    setProducts(defaultProducts);
    setDbTotalCount(defaultProducts.length);
    setCategories(INITIAL_CATEGORIES);
    try {
      saveLightweightProductsToLocalStorage(defaultProducts);
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
    } catch (e) {
      console.error('Erro ao resetar produtos:', e);
    }
  };

  /**
   * Salva alterações pendentes no Supabase, invalida o cache local e revalida imediatamente
   * o painel administrativo e a vitrine pública em tempo real (sem disparar build/deploy na Vercel).
   */
  const saveAndRevalidateSite = async (): Promise<{ success: boolean; message: string }> => {
    if (!activeSupabaseClient) {
      window.dispatchEvent(new CustomEvent('hope_catalog_updated'));
      notifyOtherTabs();
      return {
        success: true,
        message: 'Salvo localmente! Conecte ao Supabase para sincronizar em nuvem.'
      };
    }

    try {
      // 1. Sincroniza categorias pendentes no banco
      const catRows = categories.map((c) => ({
        id: c.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `cat-${c}`,
        name: c
      }));
      const { error: catError } = await activeSupabaseClient
        .from('categories')
        .upsert(catRows, { onConflict: 'id' });
      if (catError) {
        console.warn('Aviso ao sincronizar categorias:', catError);
      }

      // 2. Sincroniza apenas eventuais itens criados/alterados offline ainda pendentes
      if (pendingUpsertIdsRef.current.size > 0) {
        const pendingProducts = productsRef.current.filter((p) =>
          pendingUpsertIdsRef.current.has(p.id)
        );
        if (pendingProducts.length > 0) {
          await safeBatchUpsertProducts(activeSupabaseClient, pendingProducts);
        }
        pendingUpsertIdsRef.current.clear();
      }

      // 3. Revalidação sob demanda: busca contagem exata { count: 'exact' } e catálogo atualizado (< 1s)
      const res = await reconnectSupabase(undefined, { waitForImages: false });
      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Não foi possível revalidar os dados no Supabase.'
        };
      }

      // 4. Invalidação de cache e broadcast imediato para painel e vitrine
      saveCatalogToIDB(productsRef.current).catch(() => {});
      saveLightweightProductsToLocalStorage(productsRef.current);
      window.dispatchEvent(new CustomEvent('hope_catalog_updated'));
      notifyOtherTabs();

      const totalCount = productsRef.current.length;
      return {
        success: true,
        message: `Salvo e site atualizado! ${totalCount} produtos sincronizados em tempo real entre Supabase, painel e vitrine.`
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar catálogo com o Supabase.';
      return {
        success: false,
        message: msg
      };
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        dbTotalCount,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleStock,
        resetToDefaults,
        addCategory,
        deleteCategories,
        supabaseUrl,
        setSupabaseUrl,
        supabaseConnected,
        isConnectingSupabase,
        isInitialLoading,
        hasLoadedSupabase,
        isSyncingImages,
        lastSyncError,
        reconnectSupabase,
        refreshCatalog,
        saveAndRevalidateSite
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
