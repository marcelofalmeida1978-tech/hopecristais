/**
 * HOPE CRISTAIS - MERCADO PAGO INTEGRATION (FRONTEND)
 * SDK Oficial MercadoPago.js v2
 */

export const MERCADO_PAGO_PUBLIC_KEY: string =
  (import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY as string) ||
  'APP_USR-87dd6ce1-4ab5-47f0-864d-f521cd03e6ef';

export interface CardFormData {
  token: string;
  issuer_id?: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
    first_name?: string;
    last_name?: string;
  };
}

export interface ProcessPaymentPayload {
  token: string;
  issuer_id?: string | number;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  description: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification: {
      type: string;
      number: string;
    };
    phone?: {
      area_code?: string;
      number?: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: number;
      neighborhood?: string;
      city?: string;
      federal_unit?: string;
    };
  };
  additional_info?: {
    items?: Array<{
      id: string;
      title: string;
      description?: string;
      picture_url?: string;
      category_id?: string;
      quantity: number;
      unit_price: number;
    }>;
  };
}

export interface PaymentResult {
  id: number | string;
  status: 'approved' | 'in_process' | 'rejected' | 'pending' | string;
  status_detail: string;
  status_message: string;
  transaction_amount: number;
  installments?: number;
  payment_method_id?: string;
  payment_type_id?: string;
  card_last_four?: string;
  date_approved?: string | null;
  statement_descriptor?: string;
}

export interface ProcessPaymentApiResponse {
  success: boolean;
  payment?: PaymentResult;
  error?: string;
  status_detail?: string;
}

declare global {
  interface Window {
    MercadoPago?: any;
    cardPaymentBrickController?: any;
  }
}

/**
 * Aguarda o carregamento do script do MercadoPago.js v2 e retorna uma instância configurada
 */
export async function getMercadoPagoInstance(): Promise<any> {
  if (typeof window === 'undefined') return null;

  // Se o script ainda não tiver sido injetado
  if (!window.MercadoPago) {
    const existingScript = document.querySelector('script[src*="sdk.mercadopago.com/js/v2"]');
    if (!existingScript) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Falha ao carregar o SDK do Mercado Pago'));
        document.body.appendChild(script);
      });
    } else {
      // Espera até 6 segundos caso o script já esteja no DOM carregando
      for (let i = 0; i < 60; i++) {
        if (window.MercadoPago) break;
        await new Promise((res) => setTimeout(res, 100));
      }
    }
  }

  if (!window.MercadoPago) {
    throw new Error('SDK do Mercado Pago não encontrado na página.');
  }

  return new window.MercadoPago(MERCADO_PAGO_PUBLIC_KEY, {
    locale: 'pt-BR'
  });
}

/**
 * Traduz o status e status_detail retornado pelo Mercado Pago em mensagens claras em português
 */
export function getPaymentStatusMessage(status: string, statusDetail?: string): { title: string; description: string; type: 'success' | 'warning' | 'error' } {
  if (status === 'approved') {
    return {
      title: 'Pagamento Aprovado!',
      description: 'Seu pagamento com cartão de crédito foi confirmado com sucesso. Estamos preparando seu pedido especial!',
      type: 'success'
    };
  }

  if (status === 'in_process' || status === 'pending') {
    switch (statusDetail) {
      case 'pending_contingency':
        return {
          title: 'Pagamento em Processamento',
          description: 'Estamos concluindo o processamento do seu pagamento. Em até 2 dias úteis você receberá a confirmação por e-mail.',
          type: 'warning'
        };
      case 'pending_review_manual':
        return {
          title: 'Pagamento em Análise de Segurança',
          description: 'Seu pagamento está passando por uma breve análise de segurança. Avisaremos você por e-mail e WhatsApp assim que for aprovado.',
          type: 'warning'
        };
      default:
        return {
          title: 'Pagamento em Análise',
          description: 'O Mercado Pago está analisando a transação. O status será atualizado em breve.',
          type: 'warning'
        };
    }
  }

  // Status Rejected
  switch (statusDetail) {
    case 'cc_rejected_bad_filled_card_number':
      return {
        title: 'Número do Cartão Incorreto',
        description: 'Verifique o número digitado e tente novamente.',
        type: 'error'
      };
    case 'cc_rejected_bad_filled_date':
      return {
        title: 'Data de Vencimento Incorreta',
        description: 'A data de validade informada é inválida ou expirou.',
        type: 'error'
      };
    case 'cc_rejected_bad_filled_security_code':
      return {
        title: 'Código de Segurança Inválido',
        description: 'O código de segurança (CVV atrás do cartão) está incorreto.',
        type: 'error'
      };
    case 'cc_rejected_bad_filled_other':
      return {
        title: 'Dados Incompletos ou Incorretos',
        description: 'Revise os dados preenchidos no cartão e tente novamente.',
        type: 'error'
      };
    case 'cc_rejected_insufficient_amount':
      return {
        title: 'Saldo Insuficiente',
        description: 'O cartão informado não possui saldo ou limite suficiente para esta compra.',
        type: 'error'
      };
    case 'cc_rejected_call_for_authorize':
      return {
        title: 'Autorização Necessária',
        description: 'O banco emissor bloqueou a transação. Entre em contato com a operadora do seu cartão para autorizar a compra.',
        type: 'error'
      };
    case 'cc_rejected_card_disabled':
      return {
        title: 'Cartão Desabilitado',
        description: 'O cartão está bloqueado ou inativo. Entre em contato com seu banco para ativá-lo.',
        type: 'error'
      };
    case 'cc_rejected_duplicated_payment':
      return {
        title: 'Pagamento Já Efetuado',
        description: 'Identificamos uma cobrança idêntica recente. Verifique sua fatura antes de tentar novamente.',
        type: 'error'
      };
    case 'cc_rejected_high_risk':
      return {
        title: 'Pagamento Não Autorizado',
        description: 'A transação não passou na análise preventiva de segurança. Tente outro cartão ou utilize o pagamento via PIX.',
        type: 'error'
      };
    case 'cc_rejected_max_attempts':
      return {
        title: 'Limite de Tentativas Excedido',
        description: 'Você atingiu o limite de tentativas com este cartão. Por favor, tente com outro cartão de crédito.',
        type: 'error'
      };
    default:
      return {
        title: 'Pagamento Não Aprovado',
        description: 'A operadora do cartão não autorizou esta transação. Revise os dados digitados ou tente outro cartão.',
        type: 'error'
      };
  }
}
