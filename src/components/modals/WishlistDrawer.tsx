import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types';
import { handleImageError, getFallbackImage } from '../../utils/imageFallback';

interface WishlistDrawerProps {
  onOpenDetail: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ onOpenDetail }) => {
  const { wishlist, isWishlistOpen, closeWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { products } = useProducts();

  const favoritedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWishlist}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(41, 35, 53, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 100
            }}
          />

          {/* Drawer */}
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
              maxWidth: '420px',
              backgroundColor: 'var(--hope-white)',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-floating)'
            }}
          >
            {/* Header */}
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
                <Heart size={20} color="var(--hope-purple)" fill="var(--hope-purple)" />
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'var(--hope-text)'
                  }}
                >
                  Meus Favoritos
                </h3>
              </div>

              <button
                onClick={closeWishlist}
                aria-label="Fechar Favoritos"
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

            {/* Content List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {favoritedProducts.length === 0 ? (
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
                    <Heart size={28} />
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '20px',
                      marginBottom: '8px',
                      color: 'var(--hope-text)'
                    }}
                  >
                    Nenhuma peça salva ainda
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--hope-muted)',
                      maxWidth: '260px',
                      marginBottom: '24px'
                    }}
                  >
                    Toque no coração dos produtos que você mais gostou para guardá-los nesta lista.
                  </p>
                  <button onClick={closeWishlist} className="btn btn-primary btn-sm">
                    <span>EXPLORAR CRISTAIS</span>
                  </button>
                </div>
              ) : (
                favoritedProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: '16px',
                      border: '1px solid var(--hope-border)',
                      backgroundColor: 'var(--hope-cream)',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={product.image || getFallbackImage(product.category)}
                      alt={product.name}
                      onError={(e) => handleImageError(e, product.category)}
                      style={{
                        width: '70px',
                        height: '84px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        onOpenDetail(product);
                        closeWishlist();
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--hope-lavender)'
                        }}
                      >
                        {product.category}
                      </span>
                      <h4
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--hope-text)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          onOpenDetail(product);
                          closeWishlist();
                        }}
                      >
                        {product.name}
                      </h4>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hope-purple)' }}>
                        {product.priceFormatted}
                      </span>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {product.inStock === false || (product.quantity !== undefined && product.quantity <= 0) ? (
                          <button
                            disabled
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: '#EBE8F0',
                              color: '#8A8594',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'not-allowed',
                              border: 'none'
                            }}
                          >
                            <span>Esgotado</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              addToCart(product, 1);
                              closeWishlist();
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: 'var(--hope-purple)',
                              color: 'var(--hope-white)',
                              fontSize: '11px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <ShoppingBag size={12} />
                            <span>Adicionar</span>
                          </button>
                        )}

                        <button
                          onClick={() => toggleWishlist(product.id)}
                          aria-label="Remover dos favoritos"
                          style={{
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: 'var(--hope-white)',
                            color: 'var(--hope-muted)',
                            border: '1px solid var(--hope-border)'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
