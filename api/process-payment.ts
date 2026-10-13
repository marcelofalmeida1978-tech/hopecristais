import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

// Token de acesso oficial fornecido pelo cliente
const ACCESS_TOKEN =
  process.env.MERCADO_PAGO_ACCESS_TOKEN ||
  'APP_USR-4636756877146689-100415-58ef19be68ea8955676cda3f688fe496-1122490639';

const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: {
    timeout: 20000
  }
});

const paymentClient = new Payment(client);

// Mapeamento de mensagens amigáveis em português
function getFriendlyMessage(status: string, statusDetail?: string): string {
  if (status === 'approved') {
    return 'Pagamento aprovado com sucesso! Seu pedido foi confirmado.';
  }
  if (status === 'in_process' || status === 'pending') {
    if (statusDetail === 'pending_review_manual') {
      return 'Pagamento em análise preventiva de segurança. Você receberá a confirmação em breve.';
    }
    return 'Pagamento em processamento pelo Mercado Pago.';
  }

  switch (statusDetail) {
    case 'cc_rejected_bad_filled_card_number':
      return 'Número do cartão inválido. Por favor, confira os números.';
    case 'cc_rejected_bad_filled_date':
      return 'Data de validade incorreta ou expirada.';
    case 'cc_rejected_bad_filled_security_code':
      return 'Código de segurança (CVV) inválido.';
    case 'cc_rejected_bad_filled_other':
      return 'Dados do cartão incompletos ou inválidos.';
    case 'cc_rejected_insufficient_amount':
      return 'Saldo ou limite insuficiente no cartão.';
    case 'cc_rejected_call_for_authorize':
      return 'Pagamento não autorizado pelo banco emissor. Ligue para a operadora do seu cartão.';
    case 'cc_rejected_card_disabled':
      return 'Cartão bloqueado ou desabilitado. Contate seu banco.';
    case 'cc_rejected_duplicated_payment':
      return 'Identificamos um pagamento idêntico recente. Verifique sua fatura.';
    case 'cc_rejected_high_risk':
      return 'Pagamento não aprovado pela análise de risco. Tente outro cartão ou via PIX.';
    case 'cc_rejected_max_attempts':
      return 'Limite de tentativas excedido. Tente novamente com outro cartão.';
    default:
      return 'Pagamento recusado pela operadora do cartão. Verifique os dados ou utilize outro cartão.';
  }
}

/**
 * Handler universal compatível com Vercel Serverless Functions e Node.js / Vite Dev Server
 */
export default async function handler(req: any, res: any) {
  // CORS Headers
  const origin = req.headers?.origin || '*';
  res.setHeader?.('Access-Control-Allow-Origin', origin);
  res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, X-Idempotency-Key, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    const errorMsg = { success: false, error: 'Método não permitido. Utilize POST.' };
    if (typeof res.status === 'function') {
      return res.status(405).json(errorMsg);
    }
    res.statusCode = 405;
    res.setHeader?.('Content-Type', 'application/json');
    return res.end(JSON.stringify(errorMsg));
  }

  try {
    let body = req.body;
    // Se o body for string (ou stream), fazer parse
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // fallback
      }
    }

    if (!body || typeof body !== 'object') {
      const errorMsg = { success: false, error: 'Corpo da requisição inválido.' };
      if (typeof res.status === 'function') {
        return res.status(400).json(errorMsg);
      }
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      return res.end(JSON.stringify(errorMsg));
    }

    const {
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      description,
      payer,
      additional_info
    } = body;

    // Validações essenciais
    if (!token) {
      const err = { success: false, error: 'Token do cartão não fornecido pelo Mercado Pago.' };
      if (typeof res.status === 'function') return res.status(400).json(err);
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      return res.end(JSON.stringify(err));
    }

    const numericAmount = Number(transaction_amount);
    if (!numericAmount || numericAmount <= 0) {
      const err = { success: false, error: 'Valor da transação inválido.' };
      if (typeof res.status === 'function') return res.status(400).json(err);
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      return res.end(JSON.stringify(err));
    }

    if (!payer?.email) {
      const err = { success: false, error: 'E-mail do comprador é obrigatório.' };
      if (typeof res.status === 'function') return res.status(400).json(err);
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      return res.end(JSON.stringify(err));
    }

    // Montagem do payload da cobrança para o Mercado Pago
    const idempotencyKey =
      (req.headers?.['x-idempotency-key'] as string) || crypto.randomUUID();

    const paymentData: any = {
      token,
      transaction_amount: Number(numericAmount.toFixed(2)),
      installments: Number(installments) || 1,
      payment_method_id: payment_method_id || undefined,
      description: description || 'Hope Cristais - Compra Online',
      statement_descriptor: 'HOPE CRISTAIS',
      payer: {
        email: payer.email.trim(),
        first_name: payer.first_name || undefined,
        last_name: payer.last_name || undefined
      }
    };

    if (issuer_id) {
      paymentData.issuer_id = !isNaN(Number(issuer_id)) ? Number(issuer_id) : issuer_id;
    }

    if (payer.identification?.type && payer.identification?.number) {
      paymentData.payer.identification = {
        type: payer.identification.type,
        number: payer.identification.number.replace(/\D/g, '')
      };
    }

    if (additional_info) {
      paymentData.additional_info = additional_info;
    }

    console.log('[MERCADO PAGO] Processando pagamento com cartão:', {
      amount: paymentData.transaction_amount,
      installments: paymentData.installments,
      payment_method_id: paymentData.payment_method_id,
      payer_email: paymentData.payer?.email
    });

    const paymentResponse = await paymentClient.create({
      body: paymentData,
      requestOptions: {
        idempotencyKey
      }
    });

    const status = paymentResponse.status || 'unknown';
    const statusDetail = paymentResponse.status_detail || '';
    const friendlyMessage = getFriendlyMessage(status, statusDetail);

    const isSuccess = status === 'approved' || status === 'in_process';

    const responsePayload = {
      success: isSuccess,
      payment: {
        id: paymentResponse.id,
        status: paymentResponse.status,
        status_detail: statusDetail,
        status_message: friendlyMessage,
        transaction_amount: paymentResponse.transaction_amount,
        installments: paymentResponse.installments,
        payment_method_id: paymentResponse.payment_method_id,
        payment_type_id: paymentResponse.payment_type_id,
        card_last_four: paymentResponse.card?.last_four_digits,
        date_approved: paymentResponse.date_approved || null,
        statement_descriptor: paymentResponse.statement_descriptor
      }
    };

    console.log('[MERCADO PAGO] Resposta da API:', {
      id: paymentResponse.id,
      status: paymentResponse.status,
      status_detail: statusDetail
    });

    if (typeof res.status === 'function') {
      return res.status(200).json(responsePayload);
    }
    res.statusCode = 200;
    res.setHeader?.('Content-Type', 'application/json');
    return res.end(JSON.stringify(responsePayload));
  } catch (error: any) {
    console.error('[MERCADO PAGO] Erro ao criar pagamento:', error);

    const status = error.status || 500;
    const rawMessage = error.message || 'Erro ao comunicar com a API do Mercado Pago.';
    const cause = error.cause;

    let userFriendlyError = 'Não foi possível concluir a transação com o Mercado Pago.';

    if (rawMessage.includes('Invalid card_token_id')) {
      userFriendlyError = 'Dados do cartão inválidos ou token expirado. Por favor, tente novamente.';
    } else if (cause && Array.isArray(cause) && cause.length > 0) {
      userFriendlyError = cause.map((c: any) => c.description || c.code).join(', ');
    } else if (rawMessage) {
      userFriendlyError = rawMessage;
    }

    const errorPayload = {
      success: false,
      error: userFriendlyError,
      details: error.message,
      status_detail: 'api_error'
    };

    if (typeof res.status === 'function') {
      return res.status(status >= 400 && status < 600 ? status : 500).json(errorPayload);
    }
    res.statusCode = status >= 400 && status < 600 ? status : 500;
    res.setHeader?.('Content-Type', 'application/json');
    return res.end(JSON.stringify(errorPayload));
  }
}
