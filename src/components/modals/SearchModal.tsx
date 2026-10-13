import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct
}) => {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const term = searchTerm.trim().toLowerCase();

  const results = term
    ? products.filter((p) => {
        const inName = p.name.toLowerCase().includes(term);
        const inCategory = p.category.toLowerCase().includes(term);
        const inKeywords = p.keywords ? p.keywords.some((k) => k.toLowerCase().includes(term)) : false;
        const inDesc = p.description.toLowerCase().includes(term);
        return inName || inCategory || inKeywords || inDesc;
      })
    : [];

  const quickKeywords = ['Ametista', 'Pulseira', 'Decoração', 'Ágata', 'Zen'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px'
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
            backgroundColor: 'rgba(41, 35, 53, 0.65)',
            backdropFilter: 'blur(8px)'
          }}
        />

        {/* Search Modal Box */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '680px',
            backgroundColor: 'var(--hope-white)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-floating)',
            overflow: 'hidden',
            zIndex: 1,
            marginTop: '40px'
          }}
        >
          {/* Input Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid var(--hope-border)',
              gap: '12px'
            }}
          >
            <Search size={22} color="var(--hope-purple)" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, gema ou categoria (ex: Ametista, Pulseira)..."
              autoFocus
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--hope-text)',
                backgroundColor: 'transparent'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ padding: '4px', color: 'var(--hope-muted)' }}
              >
                <X size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--hope-soft)',
                fontSize: '12px',
                color: 'var(--hope-purple)',
                fontWeight: 600
              }}
            >
              Fechar
            </button>
          </div>

          {/* Quick Keywords Suggestions */}
          <div
            style={{
              padding: '14px 24px',
              backgroundColor: 'var(--hope-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              fontSize: '12px'
            }}
          >
            <span style={{ color: 'var(--hope-muted)', fontWeight: 500 }}>Sugestões rápidas:</span>
            {quickKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => setSearchTerm(kw)}
                style={{
                  backgroundColor: 'var(--hope-white)',
                  border: '1px solid var(--hope-border)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '11px',
                  color: 'var(--hope-purple)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Search Results List or Empty State */}
          <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px 24px' }}>
            {term === '' ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--hope-muted)' }}>
                <Sparkles size={28} color="var(--hope-lavender)" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '14px' }}>
                  Digite o que você procura para encontrar tesouros e cristais naturais da Hope.
                </p>
              </div>
            ) : results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--hope-muted)',
                    marginBottom: '4px'
                  }}
                >
                  {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                </span>

                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--hope-cream)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    className="search-item"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '52px',
                        height: '62px',
                        borderRadius: '8px',
                        objectFit: 'cover'
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
                          color: 'var(--hope-text)'
                        }}
                      >
                        {product.name}
                      </h4>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple)' }}>
                        {product.priceFormatted}
                      </span>
                    </div>

                    <ArrowRight size={16} color="var(--hope-lavender)" />
                  </div>
                ))}
              </div>
            ) : (
              /* Required Empty State */
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '20px',
                    color: 'var(--hope-text)',
                    marginBottom: '8px'
                  }}
                >
                  Nenhum produto encontrado para “{searchTerm}”
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--hope-muted)',
                    marginBottom: '24px'
                  }}
                >
                  Verifique a ortografia ou experimente outros termos de busca como Ametista ou Decoração.
                </p>
                <button
                  onClick={onClose}
                  className="btn btn-secondary btn-sm"
                >
                  <span>VOLTAR AOS PRODUTOS</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        .search-item:hover {
          background-color: var(--hope-soft) !important;
          transform: translateX(3px);
        }
      `}</style>
    </AnimatePresence>
  );
};
