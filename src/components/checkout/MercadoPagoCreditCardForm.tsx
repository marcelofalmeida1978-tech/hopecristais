import React, { useEffect, useState, useRef } from 'react';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Sparkles
} from 'lucide-react';
import {
  getMercadoPagoInstance,
  MERCADO_PAGO_PUBLIC_KEY,
  ProcessPaymentPayload,
  PaymentResult,
  getPaymentStatusMessage
} from '../../lib/mercadopago';
import { processCreditCardPayment, saveOrder, HopeOrder } from '../../services/paymentService';
import { CartItem } from '../../types';

interface MercadoPagoCreditCardFormProps {
  amount: number;
  amountFormatted: string;
  customerData: {
    fullName: string;
    whatsapp: string;
    email: string;
    cpf?: string;
  };
  items: CartItem[];
  onPaymentSuccess: (order: HopeOrder, payment: PaymentResult) => void;
  onPaymentInProcess: (order: HopeOrder, payment: PaymentResult) => void;
  onPaymentRejected: (payment: PaymentResult | null, errorMessage: string) => void;
}

export const MercadoPagoCreditCardForm: React.FC<MercadoPagoCreditCardFormProps> = ({
  amount,
  amountFormatted,
  customerData,
  items,
  onPaymentSuccess,
  onPaymentInProcess,
  onPaymentRejected
}) => {
  const [isLoadingSdk, setIsLoadingSdk] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('Validando dados com o Mercado Pago...');
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [useFallbackCustomForm, setUseFallbackCustomForm] = useState(false);

  // Estados do formulário customizado (fallback)
  const [customCardNumber, setCustomCardNumber] = useState('');
  const [customCardholderName, setCustomCardholderName] = useState(customerData.fullName || '');
  const [customExpiration, setCustomExpiration] = useState('');
  const [customCvv, setCustomCvv] = useState('');
  const [customCpf, setCustomCpf] = useState(customerData.cpf || '');
  const [customInstallments, setCustomInstallments] = useState(1);
  const [detectedBrand, setDetectedBrand] = useState<string>('credit_card');
  const [customFormErrors, setCustomFormErrors] = useState<Record<string, string>>({});

  const brickControllerRef = useRef<any>(null);
  const containerId = 'cardPaymentBrick_container';

  // Detecta bandeira do cartão conforme digitação
  const detectCardBrand = (number: string): string => {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'master';
    if (/^(4011|4389|4514|4576|5041|5066|5067|5090|6277|6362|6363|650|651|655)/.test(clean)) return 'elo';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(606282|3841)/.test(clean)) return 'hipercard';
    return 'credit_card';
  };

  // Inicializa o Card Payment Brick oficial do Mercado Pago
  useEffect(() => {
    let isMounted = true;

    async function initBrick() {
      setIsLoadingSdk(true);
      setSdkError(null);

      try {
        const mp = await getMercadoPagoInstance();
        if (!mp || !isMounted) return;

        // Limpa instância anterior se houver
        if (brickControllerRef.current) {
          try {
            await brickControllerRef.current.unmount();
          } catch {
            // safe
          }
          brickControllerRef.current = null;
        }

        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error('Container do cartão não encontrado no DOM');
        }
        container.innerHTML = '';

        const bricksBuilder = mp.bricks();

        const settings = {
          initialization: {
            amount: Number(amount.toFixed(2)),
            payer: {
              email: customerData.email.trim(),
              identification: {
                type: 'CPF',
                number: (customerData.cpf || '').replace(/\D/g, '')
              }
            }
          },
          customization: {
            visual: {
              style: {
                theme: 'default',
                customVariables: {
                  themeColor: '#49338A',
                  primaryColor: '#49338A',
                  outlinePrimaryColor: '#49338A'
                }
              }
            },
            paymentMethods: {
              maxInstallments: 12,
              minInstallments: 1
            }
          },
          callbacks: {
            onReady: () => {
              if (isMounted) {
                setIsLoadingSdk(false);
              }
            },
            onSubmit: async (cardFormData: any) => {
              return await handleBrickSubmit(cardFormData);
            },
            onError: (error: any) => {
              console.warn('[MERCADO PAGO BRICK] Alerta ou erro no componente:', error);
              if (isMounted) {
                // Se o brick falhar ou for bloqueado por adblocker, podemos ativar o form customizado
                if (!brickControllerRef.current) {
                  setUseFallbackCustomForm(true);
                  setIsLoadingSdk(false);
                }
              }
            }
          }
        };

        const controller = await bricksBuilder.create('cardPayment', containerId, settings);
        if (isMounted) {
          brickControllerRef.current = controller;
          setIsLoadingSdk(false);
        }
      } catch (err: any) {
        console.error('[MERCADO PAGO] Falha ao renderizar Card Payment Brick:', err);
        if (isMounted) {
          setUseFallbackCustomForm(true);
          setIsLoadingSdk(false);
        }
      }
    }

    initBrick();

    return () => {
      isMounted = false;
      if (brickControllerRef.current) {
        try {
          brickControllerRef.current.unmount();
        } catch {
          // safe
        }
        brickControllerRef.current = null;
      }
    };
  }, [amount, customerData.email]);

  // Processa o pagamento enviado pelo Card Payment Brick
  const handleBrickSubmit = async (cardFormData: any): Promise<boolean> => {
    setIsProcessing(true);
    setProcessingStep('Comunicando com o Mercado Pago...');

    try {
      const payload: ProcessPaymentPayload = {
        token: cardFormData.token,
        issuer_id: cardFormData.issuer_id,
        payment_method_id: cardFormData.payment_method_id,
        transaction_amount: cardFormData.transaction_amount || amount,
        installments: cardFormData.installments || 1,
        description: `Hope Cristais - Pedido (${items.length} itens)`,
        payer: {
          email: cardFormData.payer?.email || customerData.email,
          first_name: customerData.fullName.split(' ')[0] || 'Cliente',
          last_name: customerData.fullName.split(' ').slice(1).join(' ') || 'Hope',
          identification: {
            type: cardFormData.payer?.identification?.type || 'CPF',
            number: (cardFormData.payer?.identification?.number || customerData.cpf || '').replace(/\D/g, '')
          },
          phone: {
            area_code: customerData.whatsapp.replace(/\D/g, '').substring(0, 2) || '11',
            number: customerData.whatsapp.replace(/\D/g, '').substring(2) || customerData.whatsapp
          }
        },
        additional_info: {
          items: items.map((i) => ({
            id: i.product.id,
            title: i.product.name,
            description: i.product.shortDescription || i.product.name,
            picture_url: i.product.image.startsWith('http') ? i.product.image : undefined,
            category_id: i.product.category,
            quantity: i.quantity,
            unit_price: Number(i.product.price.toFixed(2))
          }))
        }
      };

      setProcessingStep('Finalizando análise do cartão de crédito...');
      const response = await processCreditCardPayment(payload);

      if (response.success && response.payment) {
        const order = await saveOrder(
          customerData,
          items,
          amount,
          amountFormatted,
          'credit_card',
          {
            id: response.payment.id,
            status: response.payment.status,
            statusDetail: response.payment.status_detail,
            installments: response.payment.installments,
            paymentMethodId: response.payment.payment_method_id,
            cardLastFour: response.payment.card_last_four
          }
        );

        if (response.payment.status === 'approved') {
          onPaymentSuccess(order, response.payment);
          return true;
        } else {
          onPaymentInProcess(order, response.payment);
          return true;
        }
      } else {
        const statusMsg = getPaymentStatusMessage(
          response.payment?.status || 'rejected',
          response.payment?.status_detail || response.status_detail
        );
        const finalError = response.error || statusMsg.description;
        onPaymentRejected(response.payment || null, finalError);
        return false;
      }
    } catch (err: any) {
      console.error('[CHECKOUT] Erro no processamento do pagamento:', err);
      onPaymentRejected(null, err?.message || 'Falha de conexão durante o pagamento.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Processa o pagamento via formulário customizado com mp.createCardToken (fallback de alta segurança)
  const handleCustomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação dos campos
    const errors: Record<string, string> = {};
    const cleanNumber = customCardNumber.replace(/\D/g, '');
    const cleanCpf = customCpf.replace(/\D/g, '');
    const cleanCvv = customCvv.replace(/\D/g, '');

    if (!cleanNumber || cleanNumber.length < 13) {
      errors.cardNumber = 'Informe um número de cartão válido';
    }
    if (!customCardholderName.trim()) {
      errors.cardholderName = 'Informe o nome impresso no cartão';
    }
    const [month, year] = customExpiration.split('/').map((s) => s.trim());
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      errors.expiration = 'Data inválida (MM/AA)';
    } else {
      const numMonth = parseInt(month, 10);
      if (numMonth < 1 || numMonth > 12) {
        errors.expiration = 'Mês inválido (01 a 12)';
      }
    }
    if (!cleanCvv || cleanCvv.length < 3) {
      errors.cvv = 'CVV inválido (3 ou 4 dígitos)';
    }
    if (!cleanCpf || cleanCpf.length !== 11) {
      errors.cpf = 'Informe um CPF válido (11 dígitos)';
    }

    setCustomFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsProcessing(true);
    setProcessingStep('Criptografando dados com Mercado Pago...');

    try {
      const mp = await getMercadoPagoInstance();
      const fullYear = `20${year}`;

      setProcessingStep('Gerando token seguro do cartão...');
      const tokenResult = await mp.createCardToken({
        cardNumber: cleanNumber,
        cardholderName: customCardholderName.trim(),
        cardExpirationMonth: month,
        cardExpirationYear: fullYear,
        securityCode: cleanCvv,
        identificationType: 'CPF',
        identificationNumber: cleanCpf
      });

      if (!tokenResult?.id) {
        throw new Error('Não foi possível gerar a autorização segura do cartão.');
      }

      setProcessingStep('Processando pagamento com o banco emissor...');
      const payload: ProcessPaymentPayload = {
        token: tokenResult.id,
        payment_method_id: detectedBrand === 'credit_card' ? 'visa' : detectedBrand,
        transaction_amount: amount,
        installments: customInstallments,
        description: `Hope Cristais - Pedido (${items.length} itens)`,
        payer: {
          email: customerData.email,
          first_name: customCardholderName.split(' ')[0] || 'Cliente',
          last_name: customCardholderName.split(' ').slice(1).join(' ') || 'Hope',
          identification: {
            type: 'CPF',
            number: cleanCpf
          },
          phone: {
            area_code: customerData.whatsapp.replace(/\D/g, '').substring(0, 2) || '11',
            number: customerData.whatsapp.replace(/\D/g, '').substring(2) || customerData.whatsapp
          }
        },
        additional_info: {
          items: items.map((i) => ({
            id: i.product.id,
            title: i.product.name,
            description: i.product.name,
            quantity: i.quantity,
            unit_price: i.product.price
          }))
        }
      };

      const response = await processCreditCardPayment(payload);

      if (response.success && response.payment) {
        const order = await saveOrder(
          { ...customerData, fullName: customCardholderName, cpf: cleanCpf },
          items,
          amount,
          amountFormatted,
          'credit_card',
          {
            id: response.payment.id,
            status: response.payment.status,
            statusDetail: response.payment.status_detail,
            installments: response.payment.installments,
            paymentMethodId: response.payment.payment_method_id,
            cardLastFour: cleanNumber.slice(-4)
          }
        );

        if (response.payment.status === 'approved') {
          onPaymentSuccess(order, response.payment);
        } else {
          onPaymentInProcess(order, response.payment);
        }
      } else {
        const statusMsg = getPaymentStatusMessage(
          response.payment?.status || 'rejected',
          response.payment?.status_detail || response.status_detail
        );
        onPaymentRejected(response.payment || null, response.error || statusMsg.description);
      }
    } catch (err: any) {
      console.error('[CUSTOM FORM] Erro ao processar:', err);
      onPaymentRejected(null, err?.message || 'Falha ao criptografar cartão no Mercado Pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatação de inputs do form customizado
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCustomCardNumber(formatted);
    setDetectedBrand(detectCardBrand(raw));
    if (customFormErrors.cardNumber) {
      setCustomFormErrors((prev) => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleExpirationChange = (val: string) => {
    let raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCustomExpiration(raw);
    if (customFormErrors.expiration) {
      setCustomFormErrors((prev) => ({ ...prev, expiration: '' }));
    }
  };

  const handleCpfChange = (val: string) => {
    let raw = val.replace(/\D/g, '').slice(0, 11);
    raw = raw.replace(/(\d{3})(\d)/, '$1.$2');
    raw = raw.replace(/(\d{3})(\d)/, '$1.$2');
    raw = raw.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCustomCpf(raw);
    if (customFormErrors.cpf) {
      setCustomFormErrors((prev) => ({ ...prev, cpf: '' }));
    }
  };

  return (
    <div className="mercadopago-credit-card-form" style={{ width: '100%', position: 'relative' }}>
      {/* Banner de Segurança Mercado Pago */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FAF5FF',
          border: '1px solid #E9D5FF',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#6D28D9" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5B21B6' }}>
            Checkout Seguro Mercado Pago
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={12} color="#7C3AED" />
          <span style={{ fontSize: '11px', color: '#6B21A8' }}>SSL 256-bits</span>
        </div>
      </div>

      {/* Loading Skeleton enquanto inicializa a SDK */}
      {isLoadingSdk && (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: '#FAF8FC',
            borderRadius: '14px',
            border: '1px dashed #DDD6FE',
            marginBottom: '16px'
          }}
        >
          <RefreshCw
            size={24}
            color="var(--hope-purple)"
            style={{ animation: 'spin 1.2s linear infinite', margin: '0 auto 12px auto' }}
          />
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--hope-purple-dark)', margin: 0 }}>
            Carregando ambiente seguro de cartão...
          </p>
          <span style={{ fontSize: '11px', color: 'var(--hope-muted)', marginTop: '4px', display: 'block' }}>
            Conectando com Mercado Pago Oficial
          </span>
        </div>
      )}

      {/* Container Oficial do Card Payment Brick */}
      <div
        id={containerId}
        style={{
          display: useFallbackCustomForm ? 'none' : 'block',
          minHeight: isLoadingSdk ? '0' : '380px'
        }}
      />

      {/* Formulário Customizado de Alta Fidelidade (Fallback Seguro) */}
      {useFallbackCustomForm && (
        <form onSubmit={handleCustomFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Visual Card Preview */}
          <div
            style={{
              background: 'linear-gradient(135deg, #33215F 0%, #49338A 50%, #6D28D9 100%)',
              borderRadius: '16px',
              padding: '20px 22px',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(51, 33, 95, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '8px'
            }}
          >
            {/* Background Crystal Aura */}
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.9 }}>
                HOPE CRISTAIS
              </span>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                {detectedBrand === 'credit_card' ? 'Cartão' : detectedBrand.toUpperCase()}
              </div>
            </div>

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                letterSpacing: '0.18em',
                marginBottom: '18px',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)'
              }}
            >
              {customCardNumber || '•••• •••• •••• ••••'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11.5px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '9px', opacity: 0.7, textTransform: 'uppercase' }}>
                  Titular
                </span>
                <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {customCardholderName || 'NOME DO TITULAR'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '9px', opacity: 0.7, textTransform: 'uppercase' }}>
                  Validade
                </span>
                <span style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
                  {customExpiration || 'MM/AA'}
                </span>
              </div>
            </div>
          </div>

          {/* Campo Número do Cartão */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-text)', marginBottom: '5px' }}>
              Número do Cartão *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={customCardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className="form-input"
                style={{ paddingRight: '40px' }}
              />
              <CreditCard
                size={18}
                color="#6D28D9"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}
              />
            </div>
            {customFormErrors.cardNumber && <span className="form-error">{customFormErrors.cardNumber}</span>}
          </div>

          {/* Campo Nome do Titular */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-text)', marginBottom: '5px' }}>
              Nome Impresso no Cartão *
            </label>
            <input
              type="text"
              value={customCardholderName}
              onChange={(e) => {
                setCustomCardholderName(e.target.value);
                if (customFormErrors.cardholderName) {
                  setCustomFormErrors((prev) => ({ ...prev, cardholderName: '' }));
                }
              }}
              placeholder="Como está gravado no cartão"
              className="form-input"
              style={{ textTransform: 'uppercase' }}
            />
            {customFormErrors.cardholderName && <span className="form-error">{customFormErrors.cardholderName}</span>}
          </div>

          {/* Linha Validade e CVV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-text)', marginBottom: '5px' }}>
                Validade (MM/AA) *
              </label>
              <input
                type="text"
                value={customExpiration}
                onChange={(e) => handleExpirationChange(e.target.value)}
                placeholder="MM/AA"
                maxLength={5}
                className="form-input"
              />
              {customFormErrors.expiration && <span className="form-error">{customFormErrors.expiration}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-text)', marginBottom: '5px' }}>
                CVV *
              </label>
              <input
                type="password"
                value={customCvv}
                onChange={(e) => {
                  setCustomCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (customFormErrors.cvv) {
                    setCustomFormErrors((prev) => ({ ...prev, cvv: '' }));
                  }
                }}
                placeholder="123"
                maxLength={4}
                className="form-input"
              />
              {customFormErrors.cvv && <span className="form-error">{customFormErrors.cvv}</span>}
            </div>
          </div>

          {/* Campo CPF do Titular */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-text)', marginBottom: '5px' }}>
              CPF do Titular *
            </label>
            <input
              type="text"
              value={customCpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
              className="form-input"
            />
            {customFormErrors.cpf && <span className="form-error">{customFormErrors.cpf}</span>}
          </div>

          {/* Parcelamento */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-text)', marginBottom: '5px' }}>
              Opções de Parcelamento *
            </label>
            <select
              value={customInstallments}
              onChange={(e) => setCustomInstallments(Number(e.target.value))}
              className="form-input"
              style={{ cursor: 'pointer' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                const partValue = (amount / num).toFixed(2).replace('.', ',');
                return (
                  <option key={num} value={num}>
                    {num}x de R$ {partValue} {num <= 3 ? '(Sem juros)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Botão de Envio do Form Customizado */}
          <button
            type="submit"
            disabled={isProcessing}
            className="btn btn-primary btn-block"
            style={{
              padding: '16px',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            <Lock size={17} />
            <span>PAGAR {amountFormatted} NO CARTÃO</span>
          </button>
        </form>
      )}

      {/* Overlay de Processamento do Pagamento */}
      {isProcessing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(4px)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 50,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#EDE9FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <RefreshCw
              size={28}
              color="var(--hope-purple)"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
          <h4
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '20px',
              color: 'var(--hope-purple-dark)',
              marginBottom: '6px'
            }}
          >
            Processando Pagamento...
          </h4>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--hope-muted)',
              maxWidth: '320px',
              margin: '0 auto 8px auto',
              lineHeight: 1.5
            }}
          >
            {processingStep}
          </p>
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
            Por favor, não atualize nem feche esta janela.
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
