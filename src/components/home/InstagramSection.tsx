import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, ArrowUpRight } from 'lucide-react';
import { INSTAGRAM_POSTS } from '../../data/products';

export const InstagramSection: React.FC = () => {
  return (
    <section className="section" style={{ backgroundColor: 'var(--hope-white)', paddingBottom: '70px' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '40px' }}>
          <span className="section-eyebrow">CONECTE-SE CONOSCO</span>
          <h2 className="section-title">SIGA A HOPE</h2>
          <p className="section-subtitle" style={{ fontSize: '17px', color: 'var(--hope-text)' }}>
            Um universo de cristais, beleza e inspiração.
          </p>
          <a
            href="https://instagram.com/hopecristais"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'var(--hope-purple)',
              fontWeight: 600
            }}
          >
            <Instagram size={18} />
            <span>@hopecristais</span>
          </a>
          <div className="section-divider" style={{ marginTop: '16px' }} />
        </div>

        {/* 6 Images Grid with Real Assets */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: '16px',
            marginBottom: '40px'
          }}
          className="insta-grid"
        >
          {INSTAGRAM_POSTS.map((post, idx) => (
            <motion.a
              key={post.id}
              href="https://instagram.com/hopecristais"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                backgroundColor: 'var(--hope-soft)',
                boxShadow: 'var(--shadow-card)',
                display: 'block'
              }}
              className="insta-card"
            >
              <img
                src={post.image}
                alt={post.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s var(--transition-smooth)'
                }}
                className="insta-img"
                loading="lazy"
              />

              {/* Hover Overlay */}
              <div
                className="insta-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(73, 51, 138, 0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--hope-white)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <Instagram size={24} />
              </div>
            </motion.a>
          ))}
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center' }}>
          <a
            href="https://instagram.com/hopecristais"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <Instagram size={17} />
            <span>SEGUIR NO INSTAGRAM</span>
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>

      <style>{`
        .insta-card:hover .insta-img {
          transform: scale(1.08);
        }
        .insta-card:hover .insta-overlay {
          opacity: 1;
        }

        @media (max-width: 1024px) {
          .insta-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 14px !important;
          }
        }
        @media (max-width: 560px) {
          .insta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </section>
  );
};
