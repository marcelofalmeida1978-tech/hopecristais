import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { handleImageError, getFallbackImage } from '../../utils/imageFallback';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  index = 0
}) => {
  const { addToCart } = useCart();

  const maxStock = product.quantity !== undefined
    ? Math.max(0, product.quantity)
    : (product.inStock === false ? 0 : 999);
  const isOutOfStock = product.inStock === false || maxStock <= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--hope-white)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--hope-border)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.35s var(--transition-smooth)'
      }}
    >
      {/* Top Image Container with Strict 4/5 Aspect Ratio */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 5',
          overflow: 'hidden',
          backgroundColor: 'var(--hope-soft)',
          cursor: 'pointer'
        }}
        onClick={() => onOpenDetail(product)}
      >
        <img
          src={product.image || getFallbackImage(product.category)}
          alt={product.name}
          loading="lazy"
          onError={(e) => handleImageError(e, product.category)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.7s var(--transition-smooth)'
          }}
          className="product-img"
        />

        {/* Tag / Badge if any */}
        {isOutOfStock ? (
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(41, 35, 53, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Esgotado
          </span>
        ) : product.tag ? (
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--hope-purple)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {product.tag}
          </span>
        ) : null}



        {/* Quick View Hover Indicator */}
        <div
          className="quick-view-overlay"
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%) translateY(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--hope-purple)',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Eye size={14} />
          <span>Ver Detalhes</span>
        </div>
      </div>

      {/* Card Content Area (Standardized Height, Flex Column with Space-Between) */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between'
        }}
      >
        {/* Info Block */}
        <div>
          {/* Small Category */}
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--hope-lavender)',
              marginBottom: '6px',
              display: 'block'
            }}
          >
            {product.category}
          </span>

          {/* Product Name */}
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '19px',
              fontWeight: 600,
              lineHeight: 1.25,
              color: 'var(--hope-text)',
              marginBottom: '8px',
              cursor: 'pointer'
            }}
            onClick={() => onOpenDetail(product)}
            className="product-name"
          >
            {product.name}
          </h3>

          {/* Price & Stock info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--hope-purple)'
              }}
            >
              {product.priceFormatted}
            </div>

            {!isOutOfStock && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: maxStock === 1 ? '#B45309' : maxStock <= 4 ? 'var(--hope-purple)' : '#059669',
                  backgroundColor: maxStock === 1 ? '#FEF3C7' : maxStock <= 4 ? '#F3E8FF' : '#ECFDF5',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}
              >
                {maxStock === 1 ? '✨ 1 peça' : `📦 ${maxStock} peças`}
              </span>
            )}
          </div>
        </div>

        {/* Action Button at the Bottom */}
        {isOutOfStock ? (
          <button
            disabled
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EBE8F0',
              color: '#8A8594',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'not-allowed',
              marginTop: 'auto',
              border: 'none'
            }}
          >
            <span>Peça Esgotada</span>
          </button>
        ) : (
          <button
            onClick={() => addToCart(product, 1)}
            className="btn-add-cart"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--hope-purple)',
              color: 'var(--hope-white)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s var(--transition-smooth)',
              cursor: 'pointer',
              marginTop: 'auto'
            }}
          >
            <ShoppingBag size={15} />
            <span>Adicionar à Sacola</span>
          </button>
        )}
      </div>

      <style>{`
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
          border-color: var(--hope-lavender);
        }
        .product-card:hover .product-img {
          transform: scale(1.05);
        }
        .product-card:hover .quick-view-overlay {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .product-name:hover {
          color: var(--hope-purple);
        }
        .btn-add-cart:hover {
          background-color: var(--hope-purple-dark);
          transform: translateY(-1px);
        }
      `}</style>
    </motion.article>
  );
};
