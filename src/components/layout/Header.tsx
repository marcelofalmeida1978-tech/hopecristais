import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Menu } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useCart } from '../../context/CartContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onSelectCategory?: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onSelectCategory
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems, openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'INÍCIO', href: '#inicio' },
    { label: 'CRISTAIS', href: '#produtos', category: 'Cristais' },
    { label: 'PULSEIRAS', href: '#produtos', category: 'Pulseiras' },
    { label: 'DECORAÇÃO', href: '#produtos', category: 'Decoração' },
    { label: 'SOBRE', href: '#sobre' },
    { label: 'CONTATO', href: '#contato' }
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: { href: string; category?: string }) => {
    if (item.category && onSelectCategory) {
      onSelectCategory(item.category);
    }
  };

  return (
    <>
      {/* Micro Announcement Bar */}
      <div
        style={{
          backgroundColor: 'var(--hope-purple)',
          color: 'var(--hope-soft)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          padding: '8px 16px',
          textAlign: 'center',
          fontWeight: 500,
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 60
        }}
      >
        <span>Cristais naturais e peças especiais escolhidas com carinho • Envio para todo o Brasil</span>
      </div>

      {/* Main Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.94)' : 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: isScrolled ? '1px solid var(--hope-border)' : '1px solid rgba(229, 223, 238, 0.4)',
          boxShadow: isScrolled ? '0 10px 30px rgba(45, 30, 70, 0.05)' : 'none',
          transition: 'all 0.4s var(--transition-smooth)',
          height: isScrolled ? 'var(--header-height-scrolled)' : 'var(--header-height)'
        }}
      >
        <div
          className="container"
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Mobile Hamburger Button */}
          <div style={{ display: 'none' }} className="mobile-only-left">
            <button
              onClick={onOpenMobileMenu}
              aria-label="Abrir Menu de Navegação"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                color: 'var(--hope-text)'
              }}
            >
              <Menu size={24} strokeWidth={1.75} />
            </button>
          </div>

          {/* Brand Official Logo */}
          <a
            href="#inicio"
            aria-label="Hope Cristais Página Inicial"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}
          >
            <Logo
              variant="purple"
              height={isScrolled ? 36 : 42}
              layout="horizontal"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Navegação Principal"
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px'
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  color: 'var(--hope-text)',
                  position: 'relative',
                  padding: '6px 0',
                  transition: 'color 0.25s ease'
                }}
                className="nav-link"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            {/* Search Icon */}
            <button
              onClick={onOpenSearch}
              aria-label="Buscar Cristais e Produtos"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                color: 'var(--hope-text)',
                transition: 'all 0.25s ease'
              }}
              className="icon-action-btn"
            >
              <Search size={20} strokeWidth={1.8} />
            </button>

            {/* Cart Icon with Counter */}
            <button
              onClick={openCart}
              aria-label={`Sacola de compras com ${totalItems} itens`}
              style={{
                height: '42px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--hope-soft)',
                border: '1px solid var(--hope-border)',
                color: 'var(--hope-purple)',
                position: 'relative',
                transition: 'all 0.3s var(--transition-smooth)'
              }}
              className="cart-action-btn"
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.04em'
                }}
              >
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      <style>{`
        .nav-link:hover {
          color: var(--hope-purple) !important;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1.5px;
          background-color: var(--hope-purple);
          transition: width 0.3s var(--transition-smooth);
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .icon-action-btn:hover {
          background-color: var(--hope-soft);
          color: var(--hope-purple) !important;
        }
        .cart-action-btn:hover {
          background-color: var(--hope-purple);
          color: var(--hope-white) !important;
          border-color: var(--hope-purple);
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-only-left {
            display: block !important;
          }
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
