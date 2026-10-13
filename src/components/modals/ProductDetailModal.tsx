import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { handleImageError, getFallbackImage } from '../../utils/imageFallback';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose
}) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const maxStock = product
    ? (product.quantity !== undefined ? Math.max(0, product.quantity) : (product.inStock === false ? 0 : 999))
    : 0;
  const isOutOfStock = !product || product.inStock === false || maxStock <= 0;

  useEffect(() => {
    if (product) {
      setQuantity(1);
    }
  }, [product?.id]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

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
          padding: '20px'
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(41, 35, 53, 0.6)',
            backdropFilter: 'blur(8px)'
          }}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 25 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '960px',
            maxHeight: '92vh',
            backgroundColor: 'var(--hope-white)',
            borderRadius: 'var(--radius-editorial)',
            boxShadow: 'var(--shadow-floating)',
            overflowY: 'auto',
            zIndex: 1
          }}
        >
          {/* Top Bar with Return Navigation & Close Button */}
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
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--hope-purple)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar para produtos</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Fechar Detalhes"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--hope-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--hope-text)'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Grid: Image Column & Info Column */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.05fr 0.95fr',
              gap: '44px',
              padding: '36px 32px'
            }}
            className="detail-grid"
          >
            {/* Left Image Showcase */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 5',
                  borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--hope-soft)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <img
                  src={product.image || getFallbackImage(product.category)}
                  alt={product.name}
                  onError={(e) => handleImageError(e, product.category)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />


              </div>

              {/* Natural Stone Authenticity Note */}
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'var(--hope-soft)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  color: 'var(--hope-purple)'
                }}
              >
                <ShieldCheck size={18} />
                <span>Peça mineral 100% autêntica com formação geológica natural.</span>
              </div>
            </div>

            {/* Right Information & Action Panel */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--hope-lavender)',
                  marginBottom: '8px'
                }}
              >
                {product.category}
              </span>

              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '32px',
                  fontWeight: 600,
                  color: 'var(--hope-text)',
                  lineHeight: 1.2,
                  marginBottom: '12px'
                }}
              >
                {product.name}
              </h2>

              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--hope-purple)',
                  marginBottom: '20px'
                }}
              >
                {product.priceFormatted}
              </div>

              {/* Product Full Description */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: 'var(--hope-muted)',
                  fontWeight: 300,
                  marginBottom: '24px'
                }}
              >
                {product.description}
              </p>

              {/* Specific Highlights */}
              <div style={{ marginBottom: '28px' }}>
                <h4
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '10px'
                  }}
                >
                  Destaques da Peça
                </h4>
                <ul
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13px',
                    color: 'var(--hope-text)'
                  }}
                >
                  {product.details.map((detail, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={13} color="var(--hope-lavender)" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Care Instructions if available */}
              {product.careInstructions && (
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--hope-cream)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '28px',
                    fontSize: '12px',
                    color: 'var(--hope-muted)',
                    lineHeight: 1.6
                  }}
                >
                  <strong style={{ color: 'var(--hope-text)', display: 'block', marginBottom: '4px' }}>
                    Cuidados com o seu cristal:
                  </strong>
                  {product.careInstructions}
                </div>
              )}

              {/* Quantity Selector & Action CTAs */}
              <div style={{ marginTop: 'auto' }}>
                {isOutOfStock ? (
                  <div style={{ marginBottom: '16px', padding: '14px', backgroundColor: '#F8F6FA', borderRadius: '12px', border: '1px solid var(--hope-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6A6375', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8A8594' }} />
                      <span>Peça Esgotada / Baixada</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--hope-muted)', lineHeight: 1.5 }}>
                      Esta peça exclusiva já encontrou seu guardião. Você pode consultar nossa equipe no WhatsApp para encomendar uma formação similar.
                    </p>
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hope-purple-dark)' }}>
                          Quantidade:
                        </span>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid var(--hope-border)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '4px 10px',
                            backgroundColor: 'var(--hope-soft)'
                          }}
                        >
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            aria-label="Diminuir quantidade"
                            style={{
                              padding: '4px',
                              color: quantity <= 1 ? '#CBD5E1' : 'var(--hope-text)',
                              cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                              border: 'none',
                              background: 'none',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          <span
                            style={{
                              minWidth: '28px',
                              textAlign: 'center',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              color: 'var(--hope-purple-dark)'
                            }}
                          >
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                            disabled={quantity >= maxStock}
                            aria-label="Aumentar quantidade"
                            style={{
                              padding: '4px',
                              color: quantity >= maxStock ? '#CBD5E1' : 'var(--hope-text)',
                              cursor: quantity >= maxStock ? 'not-allowed' : 'pointer',
                              border: 'none',
                              background: 'none',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Stock availability badge */}
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>
                        {maxStock === 1 ? (
                          <span style={{ color: '#B45309', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✨ Peça Única (1 un. disponível)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--hope-purple)', backgroundColor: '#F3E8FF', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            📦 {maxStock} unidades disponíveis para compra
                          </span>
                        )}
                      </div>
                    </div>

                    {quantity >= maxStock && maxStock > 1 && (
                      <p style={{ fontSize: '11.5px', color: '#6B7280', margin: '8px 0 0 0' }}>
                        * Quantidade máxima disponível selecionada ({maxStock} peças).
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {isOutOfStock ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: '#EBE8F0',
                        color: '#8A8594',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'not-allowed',
                        border: 'none'
                      }}
                    >
                      <span>INDISPONÍVEL PARA COMPRA</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="btn btn-primary btn-block"
                      style={{ padding: '16px' }}
                    >
                      <ShoppingBag size={18} />
                      <span>ADICIONAR À SACOLA</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};
