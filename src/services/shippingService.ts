/**
 * HOPE CRISTAIS - SERVIÇO DE FRETE (SUPERFRETE)
 */

import { ShippingOption, ShippingAddress, CartItem } from '../types';

export interface ShippingCalculationResult {
  success: boolean;
  originCep: string;
  destinationCep: string;
  address?: ShippingAddress;
  options: ShippingOption[];
  error?: string;
}

/**
 * Formata um CEP com a máscara 00000-000
 */
export function formatCep(val: string): string {
  const clean = val.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 5) {
    return clean.slice(0, 5) + '-' + clean.slice(5);
  }
  return clean;
}

/**
 * Realiza o cálculo de frete na API da SuperFrete
 */
export async function calculateShipping(
  destinationCep: string,
  items: CartItem[] = []
): Promise<ShippingCalculationResult> {
  const cleanCep = destinationCep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return {
      success: false,
      originCep: '13500-000',
      destinationCep: cleanCep,
      options: [],
      error: 'O CEP deve conter 8 dígitos.'
    };
  }

  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0) || 1;

  try {
    const response = await fetch('/api/calculate-shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination_cep: cleanCep,
        items_count: itemsCount
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        originCep: '13500-000',
        destinationCep: cleanCep,
        options: [],
        error: data.error || 'Não foi possível calcular o frete para o CEP informado.'
      };
    }

    return {
      success: true,
      originCep: data.originCep || '13500-000',
      destinationCep: data.destinationCep || cleanCep,
      address: data.address,
      options: data.options || []
    };
  } catch (err: any) {
    console.error('[SHIPPING SERVICE] Erro de rede ao calcular frete:', err);
    return {
      success: false,
      originCep: '13500-000',
      destinationCep: cleanCep,
      options: [],
      error: 'Erro de conexão ao simular o frete. Verifique sua internet.'
    };
  }
}
