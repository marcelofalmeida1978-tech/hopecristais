/**
 * HOPE CRISTAIS - API DE CÁLCULO DE FRETE (SUPERFRETE)
 * Endpoint para cotação em tempo real com Correios (PAC, SEDEX, Mini Envios)
 */

const SUPERFRETE_TOKEN =
  process.env.SUPERFRETE_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3OTExNDA5NDYsInN1YiI6IndKdTMzb01VeVdOcGg3WEZ6VjV6WUU1Mkd6bTIifQ.mNCupYjLP8dcnbi60BGR9u-I27DIWo9TF3fRrTdyJ6I';

// CEP Fixo de Origem da Loja: Rio Claro - SP (13500-000)
// Na base do Correios DNE da SuperFrete, 13500970 é o código da Agência Central de Rio Claro
const ORIGIN_CEP = '13500970';

export interface ShippingPackage {
  weight: number; // em kg
  height: number; // em cm
  width: number;  // em cm
  length: number; // em cm
}

export interface ShippingServiceOption {
  id: number | string;
  name: string;
  price: number;
  priceFormatted: string;
  originalPrice?: number;
  originalPriceFormatted?: string;
  discount?: string;
  deliveryTime: number;
  deliveryTimeText: string;
  company: {
    id: number | string;
    name: string;
    picture?: string;
  };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  const origin = req.headers?.origin || '*';
  res.setHeader?.('Access-Control-Allow-Origin', origin);
  res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    const errorMsg = { success: false, error: 'Método não permitido. Utilize POST.' };
    if (typeof res.status === 'function') return res.status(405).json(errorMsg);
    res.statusCode = 405;
    res.setHeader?.('Content-Type', 'application/json');
    return res.end(JSON.stringify(errorMsg));
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // fallback
      }
    }

    if (!body || typeof body !== 'object') {
      const errorMsg = { success: false, error: 'Corpo da requisição inválido.' };
      if (typeof res.status === 'function') return res.status(400).json(errorMsg);
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      return res.end(JSON.stringify(errorMsg));
    }

    const rawCep = (body.destination_cep || body.cep || body.postal_code || '').toString();
    const cleanCep = rawCep.replace(/\D/g, '');

    if (!cleanCep || cleanCep.length !== 8) {
      const errorMsg = { success: false, error: 'CEP de destino inválido. O CEP deve conter 8 dígitos.' };
      if (typeof res.status === 'function') return res.status(400).json(errorMsg);
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      return res.end(JSON.stringify(errorMsg));
    }

    // Dimensões do pacote (com limites mínimos e máximos oficiais dos Correios)
    const customPkg = body.package || {};
    const itemsCount = Number(body.items_count) || 1;

    const weight = Math.max(0.3, Math.min(30, Number(customPkg.weight) || (0.35 * Math.min(itemsCount, 6))));
    const height = Math.max(4, Math.min(100, Number(customPkg.height) || (8 + Math.min(itemsCount, 5) * 1.5)));
    const width = Math.max(12, Math.min(100, Number(customPkg.width) || 16));
    const length = Math.max(16, Math.min(100, Number(customPkg.length) || 20));

    // Montagem do payload SuperFrete
    const payload = {
      from: {
        postal_code: ORIGIN_CEP
      },
      to: {
        postal_code: cleanCep
      },
      services: '1,2,17', // PAC (1), SEDEX (2), Mini Envios (17)
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: 0,
        use_insurance_value: false
      },
      package: {
        weight: Number(weight.toFixed(2)),
        height: Math.round(height),
        width: Math.round(width),
        length: Math.round(length)
      }
    };

    console.log('[SUPERFRETE] Calculando frete:', {
      from: ORIGIN_CEP,
      to: cleanCep,
      package: payload.package
    });

    // Chamada à API SuperFrete
    const superFreteResponse = await fetch('https://api.superfrete.com/api/v0/calculator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
        'User-Agent': 'Hope Cristais (contato@hopecristais.com.br)'
      },
      body: JSON.stringify(payload)
    });

    const superFreteData = await superFreteResponse.json();

    if (!superFreteResponse.ok || (superFreteData && !Array.isArray(superFreteData))) {
      console.warn('[SUPERFRETE] Resposta com erro:', superFreteData);
      const errorDetail =
        superFreteData?.message ||
        (superFreteData?.errors ? Object.values(superFreteData.errors).flat().join(', ') : 'Erro ao calcular frete');

      const errorPayload = {
        success: false,
        error: errorDetail.includes('invalid') || errorDetail.includes('inválido')
          ? 'Não foi possível encontrar opções de entrega para o CEP informado.'
          : errorDetail
      };

      if (typeof res.status === 'function') return res.status(400).json(errorPayload);
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      return res.end(JSON.stringify(errorPayload));
    }

    // Consulta de endereço via ViaCEP em paralelo para preenchimento automático
    let addressInfo: any = null;
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        headers: { 'User-Agent': 'HopeCristais/1.0' }
      });
      if (viaCepRes.ok) {
        const viaCepData = await viaCepRes.json();
        if (!viaCepData.erro) {
          addressInfo = {
            cep: viaCepData.cep,
            street: viaCepData.logradouro,
            neighborhood: viaCepData.bairro,
            city: viaCepData.localidade,
            state: viaCepData.uf
          };
        }
      }
    } catch {
      // safe fallback se ViaCEP falhar
    }

    // Filtrar e normalizar as opções de frete retornadas
    const validOptions: ShippingServiceOption[] = (superFreteData as any[])
      .filter((opt) => !opt.has_error && typeof opt.price === 'number' && opt.price > 0)
      .map((opt) => {
        const price = Number(opt.price);
        const discountVal = opt.discount ? parseFloat(opt.discount) : 0;
        const originalPrice = discountVal > 0 ? price + discountVal : price;

        return {
          id: opt.id,
          name: opt.name || (opt.id === 2 ? 'SEDEX' : 'PAC'),
          price: Number(price.toFixed(2)),
          priceFormatted: `R$ ${price.toFixed(2).replace('.', ',')}`,
          originalPrice: originalPrice > price ? Number(originalPrice.toFixed(2)) : undefined,
          originalPriceFormatted: originalPrice > price ? `R$ ${originalPrice.toFixed(2).replace('.', ',')}` : undefined,
          discount: opt.discount ? `R$ ${parseFloat(opt.discount).toFixed(2).replace('.', ',')}` : undefined,
          deliveryTime: opt.delivery_time || 1,
          deliveryTimeText: `${opt.delivery_time || 1} ${Number(opt.delivery_time) === 1 ? 'dia útil' : 'dias úteis'}`,
          company: {
            id: opt.company?.id || 1,
            name: opt.company?.name || 'Correios',
            picture: opt.company?.picture || 'https://storage.googleapis.com/sandbox-api-superfrete.appspot.com/logos/correios.png'
          }
        };
      })
      // Ordena por menor preço primeiro
      .sort((a, b) => a.price - b.price);

    const responsePayload = {
      success: true,
      originCep: '13500-000',
      destinationCep: cleanCep,
      address: addressInfo,
      options: validOptions
    };

    if (typeof res.status === 'function') return res.status(200).json(responsePayload);
    res.statusCode = 200;
    res.setHeader?.('Content-Type', 'application/json');
    return res.end(JSON.stringify(responsePayload));
  } catch (error: any) {
    console.error('[SUPERFRETE] Erro interno:', error);
    const err = {
      success: false,
      error: 'Erro de conexão com o serviço de frete. Tente novamente em instantes.'
    };
    if (typeof res.status === 'function') return res.status(500).json(err);
    res.statusCode = 500;
    res.setHeader?.('Content-Type', 'application/json');
    return res.end(JSON.stringify(err));
  }
}
