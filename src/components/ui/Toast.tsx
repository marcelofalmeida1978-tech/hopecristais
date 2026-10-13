import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const Toast: React.FC = () => {
  const { toast, hideToast, openCart } = useCart();

  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <AnimatePresence>
      {toast?.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            backgroundColor: 'var(--hope-purple-dark)',
            color: 'var(--hope-white)',
            padding: '14px 20px',
            borderRadius: 'var(--radius-pill)',
            boxShadow: 'var(--shadow-floating)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 150,
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--hope-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--hope-white)',
              flexShrink: 0
            }}
          >
            <Check size={16} strokeWidth={2.5} />
          </div>

          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hope-white)' }}>
              {toast.message}
            </p>
            {toast.productName && (
              <p style={{ fontSize: '11px', color: 'var(--hope-lavender-light)', fontWeight: 400 }}>
                {toast.productName}
              </p>
            )}
          </div>

          <button
            onClick={openCart}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--hope-white)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              marginLeft: '6px',
              cursor: 'pointer'
            }}
          >
            Ver Sacola
          </button>

          <button
            onClick={hideToast}
            aria-label="Fechar Notificação"
            style={{ color: 'rgba(255, 255, 255, 0.6)', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
