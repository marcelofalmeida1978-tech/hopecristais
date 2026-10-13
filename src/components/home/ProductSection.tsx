import React from 'react';
import { useProducts } from '../../context/ProductContext';
import { ProductCard } from '../ui/ProductCard';
import { Product } from '../../types';

interface ProductSectionProps {
  onOpenDetail: (product: Product) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  onOpenDetail,
  selectedCategory,
  onSelectCategory
}) => {
  const { products, categories: dynamicCategories } = useProducts();
  const categories = ['Todos', ...dynamicCategories];

  const filteredProducts =
    selectedCategory === 'Todos'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <section id="produtos" className="section" style={{ backgroundColor: 'var(--hope-white)' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-eyebrow">CATÁLOGO EXCLUSIVO</span>
          <h2 className="section-title">Peças que Encantam</h2>
          <p
            className="section-subtitle"
            style={{
              fontWeight: 400,
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.25)'
            }}
          >
            Conheça alguns dos tesouros naturais selecionados pela Hope.
          </p>
          <div className="section-divider" />
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '48px'
          }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                style={{
                  padding: '9px 24px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: isActive ? '1px solid var(--hope-purple)' : '1px solid var(--hope-border)',
                  backgroundColor: isActive ? 'var(--hope-purple)' : 'var(--hope-soft)',
                  color: isActive ? 'var(--hope-white)' : 'var(--hope-text)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Rigorous 4-Columns Product Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '24px'
          }}
          className="product-grid"
        >
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetail={onOpenDetail}
              index={idx}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .product-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 20px !important;
          }
        }
        @media (max-width: 820px) {
          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </section>
  );
};
