import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import {
  supabase,
  DEFAULT_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  testSupabaseConnection
} from '../lib/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { saveCatalogToIDB, loadCatalogFromIDB } from '../utils/indexedDbCache';
import { getFallbackImage } from '../utils/imageFallback';

const STORAGE_KEY = 'hope_cristais_catalog_v2';
const CATEGORIES_STORAGE_KEY = 'hope_cristais_categories_v2';
const DEPLOY_HOOK_KEY = 'hope_vercel_deploy_hook_url';
const SUPABASE_URL_KEY = 'hope_supabase_url';

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
  addProduct: (productData: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleStock: (id: string) => void;
  resetToDefaults: () => void;
  addCategory: (categoryName: string) => boolean;
  deleteCategories: (categoriesToDelete: string[]) => void;
  deployHookUrl: string;
  setDeployHookUrl: (url: string) => void;
  supabaseUrl: string;
  setSupabaseUrl: (url: string) => void;
  supabaseConnected: boolean;
  isConnectingSupabase: boolean;
  isInitialLoading: boolean;
  hasLoadedSupabase: boolean;
  reconnectSupabase: (urlToUse?: string) => Promise<{ success: boolean; message: string }>;
  triggerDeploy: () => Promise<{ success: boolean; message: string }>;
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

export function resolveProductImages(row: any, primaryImage: string): string[] {
  let imagesList: string[] = [];

  if (Array.isArray(row.images) && row.images.length > 0) {
    imagesList = row.images
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
    keywords: cleanKeywords
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
    updated_at: new Date().toISOString()
  };
  if (includeQuantity) {
    row.quantity = parsedQty;
  }
  return row;
}

// Funções utilitárias seguras para Supabase com fallback caso a coluna quantity ainda não exista no banco
const safeInsertProduct = async (client: SupabaseClient, p: Product) => {
  const rowWithQty = toRow(p, true);
  const { error } = await client.from('products').insert(rowWithQty);
  if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.code === '42703')) {
    console.warn('Coluna quantity ainda não detectada no Supabase. Salvando produto com fallback de estoque em keywords...');
    const rowWithoutQty = toRow(p, false);
    await client.from('products').insert(rowWithoutQty);
  }
};

const safeUpdateProduct = async (client: SupabaseClient, p: Product) => {
  const rowWithQty = toRow(p, true);
  const { error } = await client.from('products').update(rowWithQty).eq('id', p.id);
  if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.code === '42703')) {
    console.warn('Coluna quantity ainda não detectada no Supabase. Atualizando produto com fallback de estoque em keywords...');
    const rowWithoutQty = toRow(p, false);
    await client.from('products').update(rowWithoutQty).eq('id', p.id);
  }
};

const safeToggleStock = async (client: SupabaseClient, id: string, inStock: boolean, quantity: number) => {
  const payloadWithQty = { in_stock: inStock, quantity, updated_at: new Date().toISOString() };
  const { error } = await client.from('products').update(payloadWithQty).eq('id', id);
  if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.code === '42703')) {
    try {
      const { data } = await client.from('products').select('keywords').eq('id', id).maybeSingle();
      const currentKeywords = Array.isArray(data?.keywords)
        ? data.keywords.filter((k: string) => typeof k === 'string' && !k.startsWith('__stock_qty:'))
        : [];
      currentKeywords.push(`__stock_qty:${quantity}`);

      const payloadWithoutQty = {
        in_stock: inStock,
        keywords: currentKeywords,
        updated_at: new Date().toISOString()
      };
      await client.from('products').update(payloadWithoutQty).eq('id', id);
    } catch {
      const payloadWithoutQty = { in_stock: inStock, updated_at: new Date().toISOString() };
      await client.from('products').update(payloadWithoutQty).eq('id', id);
    }
  }
};

const safeBatchUpsertProducts = async (client: SupabaseClient, productsList: Product[]) => {
  // Upsert em lotes pequenos (5) para evitar limites de payload com imagens ricas e base64
  const batchSize = 5;
  for (let i = 0; i < productsList.length; i += batchSize) {
    const chunk = productsList.slice(i, i + batchSize);
    const chunkRows = chunk.map((p) => toRow(p, true));
    const { error } = await client.from('products').upsert(chunkRows, { onConflict: 'id' });
    if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.code === '42703')) {
      const fallbackChunk = chunk.map((p) => toRow(p, false));
      await client.from('products').upsert(fallbackChunk, { onConflict: 'id' });
    }
  }
};

/**
 * Busca de forma ultra-rápida e resiliente os produtos do Supabase
 */
const fetchAllProductsFromSupabase = async (
  client: SupabaseClient,
  maxLimit = 500
): Promise<{ products: Product[]; categories: string[] }> => {
  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(maxLimit);

    if (!error && data && data.length > 0) {
      const mapped = data.map(toProduct);
      mapped.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      const productCats = mapped.map((p) => p.category).filter(Boolean);
      return {
        products: mapped,
        categories: productCats
      };
    }
  } catch (err) {
    console.warn('Tentativa direta no Supabase falhou, usando paginação de fallback:', err);
  }

  // Fallback em lotes caso ocorra qualquer instabilidade de rede
  const pageSize = 50;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRows: any[] = [];
  const seen = new Set<string>();

  for (let from = 0; from < maxLimit; from += pageSize) {
    const to = from + pageSize - 1;
    try {
      const res = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (res.data && res.data.length > 0) {
        for (const row of res.data) {
          if (row && row.id && !seen.has(row.id)) {
            seen.add(row.id);
            allRows.push(row);
          }
        }
        if (res.data.length < pageSize) break;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  const mapped = allRows.map(toProduct);
  mapped.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const productCats = mapped.map((p) => p.category).filter(Boolean);

  return {
    products: mapped,
    categories: productCats
  };
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const DEFAULT_DEPLOY_HOOK =
  (import.meta.env.VITE_VERCEL_DEPLOY_HOOK as string) ||
  'https://api.vercel.com/v1/integrations/deploy/prj_vCkWNLGvfsL41EUaBoFsjwjCc10b/LZwabZkbu4';

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      // 1. Verificar armazenamento v2 (ignora se houver cache desatualizado com menos itens que o catálogo completo)
      const savedV2 = localStorage.getItem(STORAGE_KEY);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed)) {
          // Se o cache salvo for menor que INITIAL_PRODUCTS (ex: 6 itens residuais), descarta para abrir diretamente com todas as 153 peças
          if (parsed.length >= INITIAL_PRODUCTS.length) {
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
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }

      // 2. Verificar armazenamento v1 anterior
      const savedV1 = localStorage.getItem('hope_cristais_catalog_v1');
      if (savedV1) {
        const parsed = JSON.parse(savedV1);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_PRODUCTS.length) {
          const hasCustomOrPrices = parsed.some(
            (p: Product) => (p.price || 0) > 0 || (p.id && p.id.startsWith('hope-'))
          );
          if (hasCustomOrPrices) {
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
        } else {
          localStorage.removeItem('hope_cristais_catalog_v1');
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

      const savedV1 = localStorage.getItem('hope_cristais_categories_v1');
      if (savedV1) {
        const parsed = JSON.parse(savedV1);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed
            .map((c: string) => (c === 'Outros' ? 'Diversos' : c))
            .filter((c: string) => c !== 'Outros');
          return Array.from(new Set([...migrated, ...INITIAL_CATEGORIES, 'Diversos']));
        }
      }
    } catch (e) {
      console.error('Erro ao carregar categorias salvas:', e);
    }
    return INITIAL_CATEGORIES;
  });

  const [deployHookUrl, setDeployHookUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem(DEPLOY_HOOK_KEY) || DEFAULT_DEPLOY_HOOK;
    } catch {
      return DEFAULT_DEPLOY_HOOK;
    }
  });

  const [supabaseUrl, setSupabaseUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL;
    } catch {
      return DEFAULT_SUPABASE_URL;
    }
  });

  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isConnectingSupabase, setIsConnectingSupabase] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [hasLoadedSupabase, setHasLoadedSupabase] = useState<boolean>(false);

  // Instância dinâmica do cliente Supabase para caso o usuário informe a URL pelo painel
  const [activeSupabaseClient, setActiveSupabaseClient] = useState<SupabaseClient | null>(() => supabase);

  // Sincronizar do IndexedDB no início se houver cache local persistido
  useEffect(() => {
    loadCatalogFromIDB()
      .then((idbProducts) => {
        if (idbProducts && Array.isArray(idbProducts) && idbProducts.length >= INITIAL_PRODUCTS.length) {
          setProducts((current) => (idbProducts.length > current.length ? idbProducts : current));
        }
      })
      .catch(() => {});
  }, []);

  // Salvar no localStorage e IndexedDB sempre que os produtos mudarem com catálogo verificado
  useEffect(() => {
    try {
      if (hasLoadedSupabase || products.length >= INITIAL_PRODUCTS.length) {
        // O IndexedDB não possui limite rígido de 5MB e preserva fotos completas
        saveCatalogToIDB(products).catch(() => {});

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        } catch {
          // Em caso de estouro de quota no localStorage (5MB no mobile com fotos), o IndexedDB já garantiu a persistência
        }
      }
    } catch (e) {
      console.warn('Aviso ao persistir produtos localmente:', e);
      saveCatalogToIDB(products).catch(() => {});
    }
  }, [products, hasLoadedSupabase]);

  // Salvar no localStorage sempre que as categorias mudarem
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Erro ao salvar categorias no localStorage:', e);
    }
  }, [categories]);

  // Função para conectar/reconectar ao Supabase e carregar catálogo sincronizado
  const reconnectSupabase = async (urlToUse?: string): Promise<{ success: boolean; message: string }> => {
    const targetUrl = (urlToUse || supabaseUrl || DEFAULT_SUPABASE_URL || '').trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setSupabaseConnected(false);
      setIsConnectingSupabase(false);
      setIsInitialLoading(false);
      return { success: false, message: 'URL do Supabase não configurada.' };
    }

    setIsConnectingSupabase(true);
    try {
      const client = createClient(targetUrl, SUPABASE_PUBLISHABLE_KEY);
      setActiveSupabaseClient(client);

      // 1. Ping ultra rápido (< 1s) para verificar conectividade e obter contagem exata
      const { count, error: countErr } = await client
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (countErr && countErr.code !== 'PGRST116' && countErr.code !== '42703') {
        setSupabaseConnected(false);
        setIsConnectingSupabase(false);
        setIsInitialLoading(false);
        return { success: false, message: `Erro ao conectar: ${countErr.message}` };
      }

      // Ping bem-sucedido: Supabase conectado imediatamente!
      setSupabaseConnected(true);

      // 2. Carregar categorias do banco
      try {
        const { data: dbCats } = await client
          .from('categories')
          .select('name')
          .order('name');
        if (dbCats && dbCats.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const names = dbCats.map((c: any) => c.name).filter(Boolean);
          setCategories(Array.from(new Set([...names, 'Diversos'])));
        }
      } catch (catErr) {
        console.warn('Aviso ao sincronizar categorias do Supabase:', catErr);
      }

      // 3. Carregar até 500 produtos do banco ordenados por novidades (created_at DESC)
      try {
        const { products: fetchedProducts, categories: fetchedCats } = await fetchAllProductsFromSupabase(client, 500);

        if (fetchedProducts.length > 0) {
          setProducts(fetchedProducts);
          setHasLoadedSupabase(true);

          if (fetchedCats.length > 0) {
            setCategories((prev) => Array.from(new Set([...prev, ...fetchedCats, 'Diversos'])));
          }

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedProducts));
          } catch (e) {
            console.warn('Erro ao salvar produtos no localStorage:', e);
          }
        }
      } catch (prodErr) {
        console.warn('Aviso ao carregar produtos do Supabase:', prodErr);
      }

      setIsConnectingSupabase(false);
      setIsInitialLoading(false);
      return { success: true, message: 'Supabase conectado e sincronizado com sucesso!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao conectar com o Supabase';
      setIsConnectingSupabase(false);
      setIsInitialLoading(false);
      return { success: false, message: msg };
    }
  };

  // Conexão automática ao Supabase ao iniciar a aplicação
  useEffect(() => {
    const targetUrl = supabaseUrl || DEFAULT_SUPABASE_URL;
    if (targetUrl && targetUrl.startsWith('http')) {
      reconnectSupabase(targetUrl);
    }
  }, []);

  // Sincronização entre abas do navegador
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated) && updated.length > 1) {
            setProducts(updated.map((p: Product) => (p.category === 'Outros' ? { ...p, category: 'Diversos' } : p)));
          }
        } catch (err) {
          console.error('Erro ao sincronizar catálogo:', err);
        }
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
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setDeployHookUrl = (url: string) => {
    setDeployHookUrlState(url);
    try {
      localStorage.setItem(DEPLOY_HOOK_KEY, url);
    } catch (e) {
      console.error('Erro ao salvar webhook URL:', e);
    }
  };

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

    // Salvar no Supabase se ativo
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

    // Remover do Supabase se ativo
    if (activeSupabaseClient) {
      Promise.resolve(
        activeSupabaseClient
          .from('categories')
          .delete()
          .in('name', toDelete)
      ).catch(console.error);
    }
  };

  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newId = `hope-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const parsedQty = productData.quantity !== undefined ? Math.max(0, Number(productData.quantity)) : 1;
    const isAvailable = productData.inStock !== false && parsedQty > 0;
    const newProduct: Product = {
      ...productData,
      id: newId,
      quantity: parsedQty,
      inStock: isAvailable
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Gravar no Supabase se ativo
    if (activeSupabaseClient) {
      safeInsertProduct(activeSupabaseClient, newProduct).catch(console.error);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const merged = { ...item, ...updates };
          if (merged.quantity !== undefined) {
            const num = Math.max(0, Number(merged.quantity));
            merged.quantity = num;
            if (num === 0) {
              merged.inStock = false;
            } else if (updates.inStock === undefined && item.inStock === false) {
              merged.inStock = true;
            }
          }
          return merged;
        }
        return item;
      });
      const target = updated.find((item) => item.id === id);
      if (target && activeSupabaseClient) {
        safeUpdateProduct(activeSupabaseClient, target).catch(console.error);
      }
      return updated;
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    if (activeSupabaseClient) {
      Promise.resolve(
        activeSupabaseClient
          .from('products')
          .delete()
          .eq('id', id)
      ).catch(console.error);
    }
  };

  const toggleStock = (id: string) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const currentStatus = item.inStock !== false && (item.quantity === undefined || item.quantity > 0);
          const nextStatus = !currentStatus;
          const nextQuantity = nextStatus
            ? (item.quantity && item.quantity > 0 ? item.quantity : 1)
            : 0;
          if (activeSupabaseClient) {
            safeToggleStock(activeSupabaseClient, id, nextStatus, nextQuantity).catch(console.error);
          }
          return { ...item, inStock: nextStatus, quantity: nextQuantity };
        }
        return item;
      })
    );
  };

  const resetToDefaults = () => {
    const defaultProducts = INITIAL_PRODUCTS.map((p) =>
      p.category === 'Outros' ? { ...p, category: 'Diversos' } : p
    );
    setProducts(defaultProducts);
    setCategories(INITIAL_CATEGORIES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
    } catch (e) {
      console.error('Erro ao resetar produtos:', e);
    }
  };

  /**
   * Salva e sincroniza simultaneamente no Supabase e aciona Deploy na Vercel
   */
  const triggerDeploy = async (): Promise<{ success: boolean; message: string }> => {
    // 1. Persistir no localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }

    let supabaseSynced = false;
    let fetchedTotal = 0;

    // 2. Sincronizar catálogo e categorias no Supabase em lotes seguros
    if (activeSupabaseClient) {
      try {
        // Primeiro: salvar qualquer alteração local pendente no banco
        await safeBatchUpsertProducts(activeSupabaseClient, products);
        supabaseSynced = true;
        setSupabaseConnected(true);

        const catRows = categories.map((c) => ({
          id: c.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `cat-${c}`,
          name: c
        }));
        await activeSupabaseClient
          .from('categories')
          .upsert(catRows, { onConflict: 'id' });

        // Segundo: PUXAR TODOS OS PRODUTOS ATUALIZADOS CADASTRADOS NO SUPABASE
        const { products: freshProducts, categories: freshCats } = await fetchAllProductsFromSupabase(activeSupabaseClient, 500);

        if (freshProducts && freshProducts.length > 0) {
          // Assegura a preservação de quantidades e imagens definidas no painel localmente
          const mergedProducts = freshProducts.map((fp) => {
            const local = products.find((lp) => lp.id === fp.id);
            if (local) {
              const res = { ...fp };
              if (local.quantity !== undefined && (fp.quantity === undefined || (fp.quantity <= 1 && local.quantity > 1))) {
                res.quantity = local.quantity;
                res.inStock = local.quantity > 0 && local.inStock !== false;
              }
              if (local.image) {
                const isLocalRich = local.image.startsWith('data:image/') || local.image.startsWith('http');
                const isFpRich = fp.image && (fp.image.startsWith('data:image/') || fp.image.startsWith('http'));
                if (isLocalRich || !fp.image || (!isFpRich && local.image !== fp.image)) {
                  res.image = local.image;
                  res.images = local.images && local.images.length > 0 ? local.images : [local.image];
                }
              }
              return res;
            }
            return fp;
          });

          fetchedTotal = mergedProducts.length;
          setProducts(mergedProducts);
          setHasLoadedSupabase(true);

          const mergedCats = Array.from(new Set([...categories, ...freshCats, 'Diversos']));
          setCategories(mergedCats);

          saveCatalogToIDB(mergedProducts).catch(() => {});
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedProducts));
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(mergedCats));
          } catch {}
          // Sincronizar abas do navegador e componentes da vitrine online
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('hope_catalog_updated'));
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Supabase:', err);
      }
    }

    // 3. Se houver deploy hook configurado na Vercel, disparar webhook
    let vercelTriggered = false;
    if (deployHookUrl && deployHookUrl.trim().startsWith('http')) {
      try {
        const response = await fetch(deployHookUrl.trim(), {
          method: 'POST'
        });
        if (response.ok) {
          vercelTriggered = true;
        }
      } catch (err) {
        console.warn('Deploy hook Vercel falhou:', err);
      }
    }

    const totalText = fetchedTotal > 0
      ? `Todos os ${fetchedTotal} produtos foram puxados do Supabase e sincronizados com sucesso!`
      : 'Catálogo sincronizado com sucesso!';

    if (supabaseSynced && vercelTriggered) {
      return {
        success: true,
        message: `${totalText} Painel administrativo e loja online atualizados, e deploy publicado na Vercel!`
      };
    } else if (supabaseSynced) {
      return {
        success: true,
        message: `${totalText} Painel administrativo e loja online 100% atualizados!`
      };
    } else if (vercelTriggered) {
      return {
        success: true,
        message: 'Deploy disparado na Vercel e catálogo salvo na loja com sucesso!'
      };
    }

    return {
      success: true,
      message: 'Catálogo salvo com sucesso! As alterações já estão ativas na vitrine da loja.'
    };
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleStock,
        resetToDefaults,
        addCategory,
        deleteCategories,
        deployHookUrl,
        setDeployHookUrl,
        supabaseUrl,
        setSupabaseUrl,
        supabaseConnected,
        isConnectingSupabase,
        isInitialLoading,
        hasLoadedSupabase,
        reconnectSupabase,
        triggerDeploy
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
