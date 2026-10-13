import { createClient } from '@supabase/supabase-js';

// URL padrão do projeto oficial Hope Cristais a partir das variáveis de ambiente da Vercel
export const DEFAULT_SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://tzicihnadrkynzupsdqp.supabase.co';

export const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('hope_supabase_url');
      if (saved && saved.trim().startsWith('http')) {
        return saved.trim();
      }
    } catch {
      // safe
    }
  }
  return (
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    DEFAULT_SUPABASE_URL
  );
};

export const SUPABASE_URL: string = getSupabaseUrl();

// Chaves oficiais lidas exclusivamente a partir de variáveis de ambiente
export const SUPABASE_PUBLISHABLE_KEY: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  '';

export const SUPABASE_ANON_KEY: string = SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_SECRET_KEY: string =
  (import.meta.env.VITE_SUPABASE_SECRET_KEY as string) || '';

// Criação do cliente Supabase seguro
export const supabase =
  SUPABASE_URL && SUPABASE_URL.startsWith('http') && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      })
    : null;

/**
 * Função utilitária rápida para testar a conexão com o Supabase
 */
export async function testSupabaseConnection(url?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = url || getSupabaseUrl();
  const keyToUse = SUPABASE_PUBLISHABLE_KEY;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return {
      success: false,
      message: 'URL do projeto Supabase não informada. Ex: https://tzicihnadrkynzupsdqp.supabase.co'
    };
  }
  if (!keyToUse) {
    return {
      success: false,
      message: 'Chave pública (VITE_SUPABASE_ANON_KEY) não configurada no ambiente.'
    };
  }

  try {
    const client = createClient(targetUrl, keyToUse);
    const { error } = await client.from('products').select('id', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && error.code !== '42703') {
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }
    return { success: true, message: 'Conectado ao Supabase com sucesso!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
    return { success: false, message: msg };
  }
}
