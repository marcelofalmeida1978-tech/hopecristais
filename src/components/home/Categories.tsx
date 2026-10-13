import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORIES_DATA } from '../../data/products';

interface CategoriesProps {
  onSelectCategory: (category: string) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ onSelectCategory }) => {
  return (
    <section id="categorias" className="section" style={{ backgroundColor: 'var(--hope-white)' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-eyebrow">COLEÇÕES & CURADORIA</span>
          <h2 className="section-title">Encontre o Cristal que Combina com Você</h2>
          <p className="section-subtitle">
            Peças escolhidas para diferentes momentos, ambientes e intenções.
          </p>
          <div className="section-divider" />
        </div>

        {/* 4 Columns Categories Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '24px'
          }}
          className="categories-grid"
        >
          {CATEGORIES_DATA.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: index * 0.12,
                ease: [0.22, 1, 0.36, 1]
              }}
              onClick={() => {
                onSelectCategory(cat.categoryKey);
                const elem = document.getElementById('produtos');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="category-card"
              style={{
                backgroundColor: 'var(--hope-cream)',
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer',
                border: '1px solid var(--hope-border)',
                transition: 'all 0.4s var(--transition-smooth)',
                position: 'relative'
              }}
            >
              {/* Card Image Area with Fixed Aspect Ratio */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '4 / 4.8',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: 'var(--hope-soft)'
                }}
              >
                <img
                  src={cat.image}
                  alt={`Categoria ${cat.name}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.7s var(--transition-smooth)'
                  }}
                  className="cat-img"
                  loading="lazy"
                />

                {/* Subtle Lavender Tint on Hover */}
                <div
                  className="cat-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(73, 51, 138, 0.12)',
                    opacity: 0,
                    transition: 'opacity 0.4s ease'
                  }}
                />

                {/* Floating Arrow Badge */}
                <div
                  className="cat-arrow"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--hope-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--hope-purple)',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: 0.85,
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ArrowUpRight size={18} />
                </div>
              </div>

              {/* Card Content Footer (Uniform Height) */}
              <div
                style={{
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '20px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: 'var(--hope-text)',
                      marginBottom: '8px'
                    }}
                  >
                    {cat.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      color: 'var(--hope-muted)',
                      lineHeight: 1.5,
                      fontWeight: 300
                    }}
                  >
                    {cat.subtitle}
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '16px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--hope-purple)'
                  }}
                >
                  <span>EXPLORAR</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .category-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-hover);
          border-color: var(--hope-lavender);
        }
        .category-card:hover .cat-img {
          transform: scale(1.06);
        }
        .category-card:hover .cat-overlay {
          opacity: 1;
        }
        .category-card:hover .cat-arrow {
          background-color: var(--hope-purple);
          color: var(--hope-white) !important;
          transform: translateY(-2px);
          opacity: 1;
        }

        @media (max-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 20px !important;
          }
        }
        @media (max-width: 600px) {
          .categories-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
};
