import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotalFormatted,
    openCheckout
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(41, 35, 53, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 100
            }}
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--hope-white)',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-floating)'
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid var(--hope-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={20} color="var(--hope-purple)" />
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'var(--hope-text)'
                  }}
                >
                  Sua Sacola Hope
                </h3>
              </div>

              <button
                onClick={closeCart}
                aria-label="Fechar Sacola"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--hope-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--hope-text)',
                  transition: 'background 0.2s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Free Shipping / Care Notice */}
            <div
              style={{
                backgroundColor: 'var(--hope-soft)',
                padding: '12px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--hope-purple)'
              }}
            >
              <Sparkles size={14} color="var(--hope-lavender)" />
              <span>Embalagem especial protegida para envio de cristais naturais</span>
            </div>

            {/* Cart Items List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {items.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '40px 0'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--hope-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--hope-lavender)',
                      marginBottom: '16px'
                    }}
                  >
                    <ShoppingBag size={28} />
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '20px',
                      marginBottom: '8px',
                      color: 'var(--hope-text)'
                    }}
                  >
                    Sua sacola está vazia
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--hope-muted)',
                      maxWidth: '260px',
                      marginBottom: '24px'
                    }}
                  >
                    Explore nossas peças em pedras autênticas e leve boas energias para seu ambiente.
                  </p>
                  <button
                    onClick={closeCart}
                    className="btn btn-primary btn-sm"
                  >
                    <span>EXPLORAR CRISTAIS</span>
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      paddingBottom: '20px',
                      borderBottom: '1px solid var(--hope-border)'
                    }}
                  >
                    {/* Item Image */}
                    <div
                      style={{
                        width: '80px',
                        height: '96px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--hope-soft)',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Item Details */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--hope-lavender)',
                            display: 'block'
                          }}
                        >
                          {item.product.category}
                        </span>
                        <h4
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: 'var(--hope-text)'
                          }}
                        >
                          {item.product.name}
                        </h4>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--hope-purple)',
                            marginTop: '2px',
                            display: 'block'
                          }}
                        >
                          {item.product.priceFormatted}
                        </span>
                      </div>

                      {/* Quantity Controller & Remove */}
                      {(() => {
                        const maxStock = item.product.quantity !== undefined
                          ? Math.max(0, item.product.quantity)
                          : (item.product.inStock === false ? 0 : 999);
                        const isMax = item.quantity >= maxStock;

                        return (
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '10px'
                              }}
                            >
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  border: '1px solid var(--hope-border)',
                                  borderRadius: 'var(--radius-pill)',
                                  padding: '2px 8px',
                                  backgroundColor: 'var(--hope-white)'
                                }}
                              >
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  aria-label="Diminuir quantidade"
                                  style={{
                                    padding: '4px',
                                    color: 'var(--hope-text)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Minus size={13} />
                                </button>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    minWidth: '24px',
                                    textAlign: 'center'
                                  }}
                                >
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  disabled={isMax}
                                  aria-label="Aumentar quantidade"
                                  style={{
                                    padding: '4px',
                                    color: isMax ? '#CBD5E1' : 'var(--hope-text)',
                                    cursor: isMax ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none'
                                  }}
                                  title={isMax ? `Limite de estoque atingido (${maxStock} un.)` : undefined}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                aria-label="Remover item da sacola"
                                style={{
                                  color: 'var(--hope-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                className="remove-btn"
                              >
                                <Trash2 size={13} />
                                <span>Remover</span>
                              </button>
                            </div>

                            {isMax && maxStock > 1 && (
                              <div style={{ fontSize: '10px', color: 'var(--hope-purple)', fontWeight: 600, marginTop: '4px' }}>
                                Máximo disponível adicionado ({maxStock} un.)
                              </div>
                            )}
                            {maxStock === 1 && (
                              <div style={{ fontSize: '10px', color: '#B45309', fontWeight: 600, marginTop: '4px' }}>
                                Peça única exclusiva (1 un.)
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer with Subtotal & Checkout CTA */}
            {items.length > 0 && (
              <div
                style={{
                  padding: '24px 28px',
                  borderTop: '1px solid var(--hope-border)',
                  backgroundColor: 'var(--hope-cream)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}
                >
                  <span style={{ fontSize: '14px', color: 'var(--hope-muted)', fontWeight: 400 }}>
                    Subtotal do Pedido
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '22px',
                      fontWeight: 600,
                      color: 'var(--hope-purple)'
                    }}
                  >
                    {subtotalFormatted}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--hope-muted)',
                    marginBottom: '20px'
                  }}
                >
                  O frete e as opções de pagamento serão calculados na próxima etapa.
                </p>

                <button
                  onClick={openCheckout}
                  className="btn btn-primary btn-block"
                  style={{ padding: '16px 24px' }}
                >
                  <span>FINALIZAR PEDIDO</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
