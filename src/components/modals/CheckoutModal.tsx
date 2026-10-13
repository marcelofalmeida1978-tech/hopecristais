import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  MessageCircle,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  CreditCard,
  Lock,
  AlertTriangle,
  Clock,
  Sparkles,
  Truck,
  MapPin
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getCartWhatsAppUrl, getPaidOrderWhatsAppUrl } from '../../utils/whatsapp';
import { MercadoPagoCreditCardForm } from '../checkout/MercadoPagoCreditCardForm';
import { ShippingCalculator } from '../checkout/ShippingCalculator';
import { PaymentResult } from '../../lib/mercadopago';
import { HopeOrder, saveOrder } from '../../services/paymentService';
import { ShippingOption, ShippingAddress } from '../../types';
import confetti from 'canvas-confetti';

export const CheckoutModal: React.FC = () => {
  const { items, subtotal, subtotalFormatted, isCheckoutOpen, closeCheckout, clearCart } = useCart();

  // Dados do comprador
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    email: '',
    cpf: ''
  });

  // Frete selecionado (SuperFrete) e Endereço
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);

  // Totais com frete
  const shippingPrice = selectedShipping ? selectedShipping.price : 0;
  const totalWithShipping = subtotal + shippingPrice;
  const totalWithShippingFormatted = `R$ ${totalWithShipping.toFixed(2).replace('.', ',')}`;

  // Forma de pagamento selecionada: 'credit_card' | 'pix' | 'whatsapp'
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'whatsapp'>('credit_card');

  // Estados de resultado do pagamento
  const [completedOrder, setCompletedOrder] = useState<HopeOrder | null>(null);
  const [completedPayment, setCompletedPayment] = useState<PaymentResult | null>(null);
  const [isOrderInReview, setIsOrderInReview] = useState(false);
  const [paymentErrorAlert, setPaymentErrorAlert] = useState<string | null>(null);

  // Erros de validação dos campos de contato
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal PIX
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [copiedPixKey, setCopiedPixKey] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (paymentErrorAlert) {
      setPaymentErrorAlert(null);
    }
  };

  const validateContactForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Por favor, informe seu nome completo';
    if (!formData.whatsapp.trim()) errs.whatsapp = 'Por favor, informe seu WhatsApp';

    if (paymentMethod === 'credit_card') {
      if (!formData.email.trim() || !formData.email.includes('@')) {
        errs.email = 'Informe um e-mail válido para receber o comprovante';
      }
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      if (!cleanCpf || cleanCpf.length !== 11) {
        errs.cpf = 'Informe um CPF válido (11 dígitos)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Sucesso de Pagamento com Cartão
  const handlePaymentSuccess = (order: HopeOrder, payment: PaymentResult) => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // safe
    }
    setCompletedOrder(order);
    setCompletedPayment(payment);
    setIsOrderInReview(false);
    clearCart();
  };

  // Pagamento em Análise (in_process)
  const handlePaymentInProcess = (order: HopeOrder, payment: PaymentResult) => {
    setCompletedOrder(order);
    setCompletedPayment(payment);
    setIsOrderInReview(true);
    clearCart();
  };

  // Pagamento Recusado
  const handlePaymentRejected = (payment: PaymentResult | null, errorMessage: string) => {
    setPaymentErrorAlert(errorMessage);
  };

  // Finalização via WhatsApp direta
  const handleWhatsAppCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateContactForm()) return;

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }

    const shippingPayload = {
      fullName: formData.fullName,
      whatsapp: formData.whatsapp,
      email: formData.email,
      selectedShipping: selectedShipping || undefined,
      cep: shippingAddress?.cep,
      street: shippingAddress?.street,
      number: shippingAddress?.number,
      complement: shippingAddress?.complement,
      neighborhood: shippingAddress?.neighborhood,
      city: shippingAddress?.city,
      state: shippingAddress?.state
    };

    const whatsappUrl = getCartWhatsAppUrl(items, totalWithShippingFormatted, shippingPayload);
    window.open(whatsappUrl, '_blank');
  };

  // Abrir PIX
  const handleOpenPixModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.whatsapp.trim()) {
      setErrors({
        fullName: !formData.fullName.trim() ? 'Informe seu nome completo' : '',
        whatsapp: !formData.whatsapp.trim() ? 'Informe seu WhatsApp' : ''
      });
      return;
    }
    setIsPixModalOpen(true);
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText('oliveira.deniser7@gmail.com');
    setCopiedPixKey(true);
    setTimeout(() => setCopiedPixKey(false), 2500);
  };

  const handlePixWhatsAppCheckout = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe
    }

    const shippingPayload = {
      fullName: formData.fullName,
      whatsapp: formData.whatsapp,
      email: formData.email,
      selectedShipping: selectedShipping || undefined,
      cep: shippingAddress?.cep,
      street: shippingAddress?.street,
      number: shippingAddress?.number,
      complement: shippingAddress?.complement,
      neighborhood: shippingAddress?.neighborhood,
      city: shippingAddress?.city,
      state: shippingAddress?.state
    };

    const whatsappUrl = getCartWhatsAppUrl(items, totalWithShippingFormatted, shippingPayload, true);
    window.open(whatsappUrl, '_blank');
  };

  // Link WhatsApp com Pedido Pago
  const handleNotifyPaidOrderWhatsApp = () => {
    if (!completedOrder) return;
    const whatsappUrl = getPaidOrderWhatsAppUrl(
      completedOrder.orderId,
      completedOrder.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        priceFormatted: i.priceFormatted
      })),
      completedOrder.totalFormatted || completedOrder.subtotalFormatted,
      { fullName: completedOrder.customer.fullName, whatsapp: completedOrder.customer.whatsapp },
      {
        id: completedPayment?.id || '',
        cardLastFour: completedPayment?.card_last_four,
        installments: completedPayment?.installments
      },
      {
        option: selectedShipping
          ? {
              name: selectedShipping.name,
              priceFormatted: selectedShipping.priceFormatted,
              deliveryTimeText: selectedShipping.deliveryTimeText
            }
          : undefined,
        address: shippingAddress || undefined
      }
    );
    window.open(whatsappUrl, '_blank');
  };

  const handleCloseAndReset = () => {
    setCompletedOrder(null);
    setCompletedPayment(null);
    setIsOrderInReview(false);
    setPaymentErrorAlert(null);
    closeCheckout();
  };

  if (!isCheckoutOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseAndReset}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(41, 35, 53, 0.6)',
            backdropFilter: 'blur(6px)'
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '880px',
            maxHeight: '92vh',
            backgroundColor: 'var(--hope-white)',
            borderRadius: 'var(--radius-editorial)',
            boxShadow: 'var(--shadow-floating)',
            overflowY: 'auto',
            zIndex: 1
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: '20px 28px',
              borderBottom: '1px solid var(--hope-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--hope-white)',
              zIndex: 10
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--hope-purple)',
                    display: 'block'
                  }}
                >
                  CHECKOUT INTEGRADO
                </span>
                <span
                  style={{
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  Mercado Pago & SuperFrete
                </span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--hope-text)',
                  margin: '2px 0 0 0'
                }}
              >
                Finalização do Pedido
              </h3>
            </div>

            <button
              onClick={handleCloseAndReset}
              aria-label="Fechar Checkout"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--hope-soft)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--hope-text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '28px' }}>
            {/* TELA DE SUCESSO DO PAGAMENTO */}
            {completedOrder && !isOrderInReview ? (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px auto',
                    border: '2px solid #A7F3D0'
                  }}
                >
                  <CheckCircle size={38} />
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#059669'
                  }}
                >
                  PAGAMENTO APROVADO
                </span>

                <h4
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '30px',
                    fontWeight: 600,
                    color: 'var(--hope-purple-dark)',
                    margin: '6px 0 12px 0'
                  }}
                >
                  Pedido Confirmado com Sucesso!
                </h4>

                <p
                  style={{
                    fontSize: '14.5px',
                    color: 'var(--hope-muted)',
                    maxWidth: '520px',
                    margin: '0 auto 24px auto',
                    lineHeight: 1.6
                  }}
                >
                  Obrigado por sua compra na <strong>Hope Cristais</strong>! Seu pagamento com cartão de crédito foi processado e aprovado com segurança pelo Mercado Pago.
                </p>

                {/* Card de Detalhes do Pedido */}
                <div
                  style={{
                    maxWidth: '520px',
                    margin: '0 auto 28px auto',
                    backgroundColor: '#FAF8FC',
                    border: '1px solid #EDE8F5',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E9E4F0' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--hope-muted)' }}>Identificador do Pedido:</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '13.5px', color: 'var(--hope-purple)' }}>
                      #{completedOrder.orderId}
                    </strong>
                  </div>

                  {completedPayment?.id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E9E4F0' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--hope-muted)' }}>Comprovante Mercado Pago:</span>
                      <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: '#4B5563' }}>
                        #{completedPayment.id}
                      </strong>
                    </div>
                  )}

                  {selectedShipping && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E9E4F0' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--hope-muted)' }}>Modalidade de Envio:</span>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--hope-text)' }}>
                        {selectedShipping.name} ({selectedShipping.deliveryTimeText})
                      </span>
                    </div>
                  )}

                  {shippingAddress?.street && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E9E4F0' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--hope-muted)' }}>Endereço de Entrega:</span>
                      <span style={{ fontSize: '12px', color: 'var(--hope-text)', maxWidth: '280px', textAlign: 'right' }}>
                        {shippingAddress.street}{shippingAddress.number ? `, ${shippingAddress.number}` : ''}, {shippingAddress.city} - {shippingAddress.state}
                      </span>
                    </div>
                  )}

                  {completedPayment?.card_last_four && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E9E4F0' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--hope-muted)' }}>Cartão Utilizado:</span>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--hope-text)' }}>
                        •••• {completedPayment.card_last_four} ({completedPayment.installments || 1}x)
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hope-text)' }}>Valor Total:</span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--hope-purple)' }}>
                      {totalWithShippingFormatted}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px', margin: '0 auto' }}>
                  <button
                    onClick={handleNotifyPaidOrderWhatsApp}
                    className="btn btn-primary"
                    style={{
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>AVISAR EQUIPE NO WHATSAPP</span>
                  </button>

                  <button
                    onClick={handleCloseAndReset}
                    style={{
                      padding: '12px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--hope-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--hope-text)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    CONTINUAR NAVEGANDO NA LOJA
                  </button>
                </div>
              </div>
            ) : completedOrder && isOrderInReview ? (
              /* TELA DE PAGAMENTO EM ANÁLISE */
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px auto',
                    border: '2px solid #FDE68A'
                  }}
                >
                  <Clock size={36} />
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#D97706'
                  }}
                >
                  EM ANÁLISE DE SEGURANÇA
                </span>

                <h4
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    fontWeight: 600,
                    color: 'var(--hope-purple-dark)',
                    margin: '6px 0 12px 0'
                  }}
                >
                  Pagamento em Análise
                </h4>

                <p
                  style={{
                    fontSize: '14.5px',
                    color: 'var(--hope-muted)',
                    maxWidth: '520px',
                    margin: '0 auto 24px auto',
                    lineHeight: 1.6
                  }}
                >
                  Seu pedido <strong>#{completedOrder.orderId}</strong> foi registrado! O Mercado Pago está realizando uma breve checagem preventiva no cartão de crédito. Avisaremos você por e-mail e WhatsApp assim que a liberação for concluída.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
                  <button
                    onClick={handleNotifyPaidOrderWhatsApp}
                    className="btn btn-primary"
                    style={{
                      padding: '14px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>FALAR COM SUPORTE NO WHATSAPP</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FLUXO NORMAL DO CHECKOUT */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.25fr 0.75fr',
                  gap: '36px'
                }}
                className="checkout-grid"
              >
                {/* Coluna Esquerda: Dados, Frete e Pagamento */}
                <div>
                  {/* Alerta de erro de pagamento (se houver) */}
                  {paymentErrorAlert && (
                    <div
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '13px', color: '#991B1B', display: 'block', marginBottom: '2px' }}>
                          Não foi possível concluir a transação
                        </strong>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#B91C1C', lineHeight: 1.4 }}>
                          {paymentErrorAlert}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 1. Dados de Contato e Documento */}
                  <div style={{ marginBottom: '22px' }}>
                    <h4
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '18px',
                        color: 'var(--hope-text)',
                        marginBottom: '14px',
                        fontWeight: 600
                      }}
                    >
                      1. Dados do Comprador
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          placeholder="Ex: Maria Clara Silva"
                          className="form-input"
                        />
                        {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                          WhatsApp (com DDD) *
                        </label>
                        <input
                          type="tel"
                          value={formData.whatsapp}
                          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="form-input"
                        />
                        {errors.whatsapp && <span className="form-error">{errors.whatsapp}</span>}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                          CPF *
                        </label>
                        <input
                          type="text"
                          value={formData.cpf}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 11);
                            val = val.replace(/(\d{3})(\d)/, '$1.$2');
                            val = val.replace(/(\d{3})(\d)/, '$1.$2');
                            val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                            handleInputChange('cpf', val);
                          }}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className="form-input"
                        />
                        {errors.cpf && <span className="form-error">{errors.cpf}</span>}
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                          E-mail (para envio do comprovante) *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="seuemail@exemplo.com"
                          className="form-input"
                        />
                        {errors.email && <span className="form-error">{errors.email}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 2. Simulação de Frete e Endereço de Entrega (SuperFrete) */}
                  <div style={{ marginBottom: '22px' }}>
                    <h4
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '18px',
                        color: 'var(--hope-text)',
                        marginBottom: '14px',
                        fontWeight: 600
                      }}
                    >
                      2. Opções de Entrega (SuperFrete)
                    </h4>

                    <ShippingCalculator
                      items={items}
                      selectedOption={selectedShipping}
                      onSelectOption={(option, address) => {
                        setSelectedShipping(option);
                        if (address) setShippingAddress(address);
                      }}
                      onAddressChange={(address) => {
                        setShippingAddress(address);
                      }}
                    />
                  </div>

                  {/* 3. Seleção da Forma de Pagamento */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '18px',
                        color: 'var(--hope-text)',
                        marginBottom: '14px',
                        fontWeight: 600
                      }}
                    >
                      3. Forma de Pagamento
                    </h4>

                    {/* Abas Modernas de Escolha */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        marginBottom: '20px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('credit_card');
                          setPaymentErrorAlert(null);
                        }}
                        style={{
                          padding: '12px 10px',
                          border: paymentMethod === 'credit_card' ? '2px solid var(--hope-purple)' : '1px solid var(--hope-border)',
                          backgroundColor: paymentMethod === 'credit_card' ? '#FAF5FF' : 'var(--hope-white)',
                          color: paymentMethod === 'credit_card' ? 'var(--hope-purple-dark)' : 'var(--hope-text)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <CreditCard size={20} color={paymentMethod === 'credit_card' ? '#6D28D9' : '#64748B'} />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>Cartão de Crédito</span>
                        <span style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 600 }}>Até 12x</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('pix');
                          setPaymentErrorAlert(null);
                        }}
                        style={{
                          padding: '12px 10px',
                          border: paymentMethod === 'pix' ? '2px solid var(--hope-purple)' : '1px solid var(--hope-border)',
                          backgroundColor: paymentMethod === 'pix' ? '#FAF5FF' : 'var(--hope-white)',
                          color: paymentMethod === 'pix' ? 'var(--hope-purple-dark)' : 'var(--hope-text)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <QrCode size={20} color={paymentMethod === 'pix' ? '#6D28D9' : '#64748B'} />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>PIX</span>
                        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>Instantâneo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('whatsapp');
                          setPaymentErrorAlert(null);
                        }}
                        style={{
                          padding: '12px 10px',
                          border: paymentMethod === 'whatsapp' ? '2px solid var(--hope-purple)' : '1px solid var(--hope-border)',
                          backgroundColor: paymentMethod === 'whatsapp' ? '#FAF5FF' : 'var(--hope-white)',
                          color: paymentMethod === 'whatsapp' ? 'var(--hope-purple-dark)' : 'var(--hope-text)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <MessageCircle size={20} color={paymentMethod === 'whatsapp' ? '#6D28D9' : '#64748B'} />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>WhatsApp</span>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>Atendimento</span>
                      </button>
                    </div>

                    {/* CONTEÚDO DA FORMA DE PAGAMENTO */}
                    {paymentMethod === 'credit_card' && (
                      <div>
                        {/* Se o cliente ainda não preencheu o e-mail ou nome, dá um aviso amigável */}
                        {(!formData.fullName || !formData.email || !formData.cpf) ? (
                          <div
                            style={{
                              backgroundColor: '#F8F6FA',
                              border: '1px dashed #DDD6FE',
                              borderRadius: '12px',
                              padding: '14px 16px',
                              marginBottom: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <Sparkles size={18} color="var(--hope-purple)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: 'var(--hope-purple-dark)' }}>
                              Preencha seu <strong>Nome</strong>, <strong>WhatsApp</strong>, <strong>CPF</strong> e <strong>E-mail</strong> no passo 1 acima para ativar o pagamento com cartão.
                            </span>
                          </div>
                        ) : null}

                        {/* Componente do Mercado Pago com o valor total recalculado com o frete */}
                        <MercadoPagoCreditCardForm
                          amount={totalWithShipping}
                          amountFormatted={totalWithShippingFormatted}
                          customerData={formData}
                          items={items}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentInProcess={handlePaymentInProcess}
                          onPaymentRejected={handlePaymentRejected}
                        />
                      </div>
                    )}

                    {paymentMethod === 'pix' && (
                      <div
                        style={{
                          backgroundColor: '#FAF5FF',
                          border: '1.5px dashed #DDD6FE',
                          borderRadius: '14px',
                          padding: '24px 20px',
                          textAlign: 'center'
                        }}
                      >
                        <QrCode size={38} color="var(--hope-purple)" style={{ margin: '0 auto 10px auto' }} />
                        <h5 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--hope-purple-dark)', margin: '0 0 6px 0' }}>
                          Pague via PIX com QR Code
                        </h5>
                        <p style={{ fontSize: '12.5px', color: 'var(--hope-muted)', margin: '0 auto 16px auto', maxWidth: '340px' }}>
                          Aprovação imediata. Clique abaixo para abrir o QR Code e a chave copia e cola.
                        </p>

                        <button
                          type="button"
                          onClick={handleOpenPixModal}
                          className="btn btn-primary"
                          style={{
                            padding: '14px 24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: 700
                          }}
                        >
                          <QrCode size={18} />
                          <span>ABRIR QR CODE PIX ({totalWithShippingFormatted})</span>
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'whatsapp' && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: '14px',
                          padding: '24px 20px',
                          textAlign: 'center'
                        }}
                      >
                        <MessageCircle size={38} color="#16A34A" style={{ margin: '0 auto 10px auto' }} />
                        <h5 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#166534', margin: '0 0 6px 0' }}>
                          Atendimento Personalizado via WhatsApp
                        </h5>
                        <p style={{ fontSize: '12.5px', color: '#15803D', margin: '0 auto 16px auto', maxWidth: '360px' }}>
                          Finalize seu pedido diretamente com nossa equipe, tire dúvidas e combine entrega personalizada.
                        </p>

                        <button
                          type="button"
                          onClick={handleWhatsAppCheckout}
                          style={{
                            padding: '14px 24px',
                            backgroundColor: '#16A34A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <MessageCircle size={18} />
                          <span>CONTINUAR NO WHATSAPP</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna Direita: Resumo da Compra */}
                <div
                  style={{
                    backgroundColor: 'var(--hope-soft)',
                    padding: '22px',
                    borderRadius: 'var(--radius-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: 'fit-content'
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '18px',
                        color: 'var(--hope-text)',
                        marginBottom: '16px',
                        fontWeight: 600
                      }}
                    >
                      Resumo da Compra
                    </h4>

                    {/* Lista de Produtos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {items.map((item) => (
                        <div
                          key={item.product.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.product.image && (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <span style={{ fontWeight: 500, display: 'block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.product.name}
                              </span>
                              <span style={{ color: 'var(--hope-muted)', fontSize: '11px' }}>
                                x{item.quantity}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--hope-purple)' }}>
                            {item.product.priceFormatted}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid var(--hope-border)',
                        paddingTop: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--hope-muted)' }}>Subtotal</span>
                        <span style={{ fontWeight: 500 }}>{subtotalFormatted}</span>
                      </div>

                      {/* Frete SuperFrete */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <div>
                          <span style={{ color: 'var(--hope-muted)' }}>
                            Frete {selectedShipping ? `(${selectedShipping.name})` : ''}
                          </span>
                          {selectedShipping && (
                            <span style={{ display: 'block', fontSize: '10.5px', color: '#16A34A', fontWeight: 600 }}>
                              {selectedShipping.deliveryTimeText}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            color: selectedShipping ? 'var(--hope-purple)' : 'var(--hope-muted)',
                            fontWeight: selectedShipping ? 600 : 400
                          }}
                        >
                          {selectedShipping ? selectedShipping.priceFormatted : 'Calcule pelo CEP'}
                        </span>
                      </div>

                      <div
                        style={{
                          borderTop: '1px solid var(--hope-border)',
                          paddingTop: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline'
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 600 }}>
                          Total Final
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '24px',
                            fontWeight: 700,
                            color: 'var(--hope-purple)'
                          }}
                        >
                          {totalWithShippingFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selo de Garantia */}
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '12px',
                      backgroundColor: 'var(--hope-white)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '11px',
                      color: 'var(--hope-muted)'
                    }}
                  >
                    <ShieldCheck size={20} color="var(--hope-purple)" style={{ flexShrink: 0 }} />
                    <span>Ambiente seguro com rastreamento Correios e proteção Mercado Pago.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal PIX */}
      <AnimatePresence>
        {isPixModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 130,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPixModalOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(30, 20, 45, 0.75)',
                backdropFilter: 'blur(8px)'
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                maxHeight: '92vh',
                overflowY: 'auto',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
                padding: '28px 24px',
                zIndex: 1,
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#EDE9FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6D28D9'
                    }}
                  >
                    <QrCode size={18} />
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: 'var(--hope-purple-dark)',
                      margin: 0
                    }}
                  >
                    Pagamento via PIX
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPixModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Valor Total com Frete */}
              <div
                style={{
                  backgroundColor: '#F8F6FA',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  border: '1px solid #EDE8F5'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--hope-muted)',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '2px'
                  }}
                >
                  Valor Total a Pagar (com frete)
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '26px',
                    fontWeight: 700,
                    color: 'var(--hope-purple)'
                  }}
                >
                  {totalWithShippingFormatted}
                </span>
                {selectedShipping && (
                  <span style={{ display: 'block', fontSize: '11px', color: '#16A34A', marginTop: '2px' }}>
                    Inclui {selectedShipping.name} ({selectedShipping.priceFormatted})
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    width: '210px',
                    height: '210px',
                    margin: '0 auto',
                    borderRadius: '14px',
                    padding: '8px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(73, 51, 138, 0.1)',
                    border: '2px solid #E9D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src="/assets/pix_qrcode.jpg"
                    alt="QR Code PIX Hope Cristais"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11.5px',
                    color: '#64748B',
                    display: 'block',
                    marginTop: '6px'
                  }}
                >
                  Aponte a câmera do aplicativo do seu banco para o QR Code acima
                </span>
              </div>

              {/* Chave PIX */}
              <div style={{ marginBottom: '18px', textAlign: 'left' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '5px',
                    display: 'block'
                  }}
                >
                  Chave PIX (E-mail):
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#FAF5FF',
                    border: '1px solid #DDD6FE',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    gap: '8px'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: '#5B21B6',
                      wordBreak: 'break-all',
                      fontWeight: 600
                    }}
                  >
                    oliveira.deniser7@gmail.com
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPixKey}
                    style={{
                      backgroundColor: copiedPixKey ? '#059669' : 'var(--hope-purple)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedPixKey ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedPixKey ? 'Copiada!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Instrução */}
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  textAlign: 'left'
                }}
              >
                <ShieldCheck size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF', lineHeight: 1.5 }}>
                  Após efetuar o PIX, encaminhe o comprovante pelo WhatsApp clicando no botão abaixo para darmos sequência no envio do seu pedido!
                </p>
              </div>

              {/* Botão Finalizar */}
              <button
                type="button"
                onClick={handlePixWhatsAppCheckout}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: 'var(--hope-purple)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(73, 51, 138, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageCircle size={18} />
                <span>FINALIZAR PELO WHATSAPP</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--hope-border);
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--hope-text);
          background-color: var(--hope-white);
          outline: none;
          transition: border-color 0.2s ease;
        }
        .form-input:focus {
          border-color: var(--hope-purple);
        }
        .form-error {
          font-size: 11px;
          color: #DC2626;
          margin-top: 4px;
          display: block;
        }
        @media (max-width: 780px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};
