/**
 * HOPE CRISTAIS - SERVIÇO DE PAGAMENTOS E PEDIDOS
 */

import { ProcessPaymentPayload, ProcessPaymentApiResponse } from '../lib/mercadopago';
import { supabase } from '../lib/supabase';
import { CartItem, ShippingOption, ShippingAddress } from '../types';

export interface HopeOrder {
  orderId: string;
  createdAt: string;
  customer: {
    fullName: string;
    whatsapp: string;
    email: string;
    cpf?: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    priceFormatted: string;
    quantity: number;
    image: string;
  }>;
  subtotal: number;
  subtotalFormatted: string;
  shipping?: {
    option?: ShippingOption;
    address?: ShippingAddress;
    price: number;
    priceFormatted: string;
  };
  total?: number;
  totalFormatted?: string;
  paymentMethod: 'credit_card' | 'pix' | 'whatsapp';
  paymentDetails?: {
    id: number | string;
    status: string;
    statusDetail: string;
    installments?: number;
    paymentMethodId?: string;
    cardLastFour?: string;
  };
}

/**
 * Envia os dados de cobrança com token seguro para a API do Mercado Pago
 */
export async function processCreditCardPayment(
  payload: ProcessPaymentPayload
): Promise<ProcessPaymentApiResponse> {
  const idempotencyKey = crypto?.randomUUID
    ? crypto.randomUUID()
    : 'hp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  try {
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok && !data.payment) {
      return {
        success: false,
        error: data.error || `Erro HTTP ${response.status} ao processar pagamento.`,
        status_detail: data.status_detail || 'network_error'
      };
    }

    return data as ProcessPaymentApiResponse;
  } catch (err: any) {
    console.error('[PAYMENT SERVICE] Erro de requisição:', err);
    return {
      success: false,
      error: 'Não foi possível conectar ao servidor de pagamentos. Verifique sua conexão à internet.',
      status_detail: 'connection_failed'
    };
  }
}

/**
 * Salva o pedido finalizado no localStorage e no Supabase (se a tabela existir)
 */
export async function saveOrder(
  customer: { fullName: string; whatsapp: string; email: string; cpf?: string },
  items: CartItem[],
  subtotal: number,
  subtotalFormatted: string,
  paymentMethod: 'credit_card' | 'pix' | 'whatsapp',
  paymentDetails?: {
    id: number | string;
    status: string;
    statusDetail: string;
    installments?: number;
    paymentMethodId?: string;
    cardLastFour?: string;
  },
  shipping?: {
    option?: ShippingOption;
    address?: ShippingAddress;
    price: number;
    priceFormatted: string;
  }
): Promise<HopeOrder> {
  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  const orderId = `HP-${orderNumber}`;

  const shippingPrice = shipping?.price || 0;
  const total = subtotal + shippingPrice;
  const totalFormatted = `R$ ${total.toFixed(2).replace('.', ',')}`;

  const newOrder: HopeOrder = {
    orderId,
    createdAt: new Date().toISOString(),
    customer,
    items: items.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      priceFormatted: i.product.priceFormatted,
      quantity: i.quantity,
      image: i.product.image
    })),
    subtotal,
    subtotalFormatted,
    shipping,
    total,
    totalFormatted,
    paymentMethod,
    paymentDetails
  };

  // Salvar no histórico local
  try {
    const existing = localStorage.getItem('hope_orders_history');
    const ordersList: HopeOrder[] = existing ? JSON.parse(existing) : [];
    ordersList.unshift(newOrder);
    localStorage.setItem('hope_orders_history', JSON.stringify(ordersList.slice(0, 50)));
  } catch {
    // safe
  }

  // Tentar registrar no Supabase se disponível
  if (supabase) {
    try {
      await supabase.from('orders').insert({
        id: orderId,
        customer_name: customer.fullName,
        customer_whatsapp: customer.whatsapp,
        customer_email: customer.email,
        customer_cpf: customer.cpf || null,
        items: newOrder.items,
        subtotal: subtotal,
        payment_method: paymentMethod,
        payment_id: paymentDetails?.id ? String(paymentDetails.id) : null,
        payment_status: paymentDetails?.status || 'approved',
        payment_status_detail: paymentDetails?.statusDetail || null,
        card_last_four: paymentDetails?.cardLastFour || null,
        installments: paymentDetails?.installments || 1
      });
    } catch {
      // Ignora silenciosamente caso a tabela orders ainda não tenha sido criada no banco
    }
  }

  return newOrder;
}
