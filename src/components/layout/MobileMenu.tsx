import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Instagram, MessageCircle, ChevronRight } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { WHATSAPP_NUMBER } from '../../data/products';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onSelectCategory?: (category: string) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onOpenSearch,
  onSelectCategory
}) => {

  const navLinks = [
    { label: 'Início', href: '#inicio' },
    { label: 'Cristais Naturais', href: '#produtos', category: 'Cristais' },
    { label: 'Pulseiras em Pedras', href: '#produtos', category: 'Pulseiras' },
    { label: 'Decoração & Ambientes', href: '#produtos', category: 'Decoração' },
    { label: 'Nossa História', href: '#sobre' },
    { label: 'Fale Conosco', href: '#contato' }
  ];

  const handleLinkClick = (link: { href: string; category?: string }) => {
    if (link.category && onSelectCategory) {
      onSelectCategory(link.category);
    }
    onClose();
  };

  const whatsappUrl = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vim pelo site da Hope Cristais.')}`
    : 'https://wa.me/?text=' + encodeURIComponent('Olá! Gostaria de falar com a Hope Cristais.');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(41, 35, 53, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 90
            }}
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '88%',
              maxWidth: '380px',
              backgroundColor: 'var(--hope-white)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-floating)',
              padding: '28px 24px'
            }}
          >
            {/* Header with Logo & Close */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--hope-border)'
              }}
            >
              <Logo variant="purple" height={36} layout="horizontal" />
              <button
                onClick={onClose}
                aria-label="Fechar Menu"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'var(--hope-soft)',
                  color: 'var(--hope-text)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Actions Search */}
            <div style={{ margin: '20px 0' }}>
              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--hope-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  color: 'var(--hope-text)',
                  fontWeight: 500
                }}
              >
                <Search size={16} color="var(--hope-purple)" />
                <span>Buscar cristais e produtos</span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => handleLinkClick(link)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: 'var(--hope-text)',
                      transition: 'background 0.2s ease'
                    }}
                    className="mobile-nav-item"
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={16} color="var(--hope-lavender)" />
                  </a>
                ))}
              </div>
            </nav>

            {/* Bottom Contacts & Social */}
            <div
              style={{
                paddingTop: '20px',
                borderTop: '1px solid var(--hope-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="https://instagram.com/hopecristais"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    border: '1px solid var(--hope-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--hope-purple)'
                  }}
                >
                  <Instagram size={16} />
                  <span>@hopecristais</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    backgroundColor: 'var(--hope-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--hope-purple)'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </a>
              </div>

              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--hope-muted)',
                  textAlign: 'center',
                  marginTop: '4px'
                }}
              >
                Hope Cristais • Desde 2022
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
