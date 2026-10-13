import React from 'react';
import { Logo } from '../ui/Logo';
import { Instagram, MessageCircle, ArrowUp } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../../data/products';

interface FooterProps {
  onSelectCategory?: (cat: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappUrl = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de atendimento na Hope Cristais.')}`
    : 'https://wa.me/?text=' + encodeURIComponent('Olá! Gostaria de atendimento na Hope Cristais.');

  return (
    <footer
      id="contato"
      style={{
        backgroundColor: 'var(--hope-purple-dark)',
        color: 'rgba(255, 255, 255, 0.85)',
        paddingTop: '80px',
        paddingBottom: '32px',
        position: 'relative'
      }}
    >
      <div className="container">
        {/* Top Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            gap: '48px',
            paddingBottom: '60px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
          }}
          className="footer-grid"
        >
          {/* Brand Presentation Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Logo variant="white" height={44} layout="horizontal" />

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.7,
                maxWidth: '340px',
                fontWeight: 300
              }}
            >
              Cristais e pedras naturais selecionados com carinho e respeito à natureza, para transformar ambientes e inspirar beleza e bem-estar.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <a
                href="https://instagram.com/hopecristais"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da Hope Cristais"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--hope-white)',
                  transition: 'background 0.3s ease'
                }}
                className="footer-social-btn"
              >
                <Instagram size={18} />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp da Hope Cristais"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--hope-white)',
                  transition: 'background 0.3s ease'
                }}
                className="footer-social-btn"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Navigation Column: HOPE CRISTAIS */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '17px',
                letterSpacing: '0.08em',
                color: 'var(--hope-white)',
                marginBottom: '20px',
                fontWeight: 600
              }}
            >
              HOPE CRISTAIS
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#sobre" className="footer-link">Nossa história</a>
              </li>
              <li>
                <a
                  href="#produtos"
                  onClick={() => onSelectCategory && onSelectCategory('Cristais')}
                  className="footer-link"
                >
                  Cristais
                </a>
              </li>
              <li>
                <a
                  href="#produtos"
                  onClick={() => onSelectCategory && onSelectCategory('Decoração')}
                  className="footer-link"
                >
                  Decoração
                </a>
              </li>
              <li>
                <a
                  href="#produtos"
                  onClick={() => onSelectCategory && onSelectCategory('Pulseiras')}
                  className="footer-link"
                >
                  Pulseiras
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column: ATENDIMENTO */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '17px',
                letterSpacing: '0.08em',
                color: 'var(--hope-white)',
                marginBottom: '20px',
                fontWeight: 600
              }}
            >
              ATENDIMENTO
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a
                  href="https://wa.me/5519997456270"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Info Column: INFORMAÇÕES */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '17px',
                letterSpacing: '0.08em',
                color: 'var(--hope-white)',
                marginBottom: '20px',
                fontWeight: 600
              }}
            >
              INFORMAÇÕES
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#inicio" onClick={(e) => { e.preventDefault(); alert('Política de Privacidade da Hope Cristais: preservamos o sigilo total de todos os dados cadastrais.'); }} className="footer-link">
                  Política de privacidade
                </a>
              </li>
              <li>
                <a href="#inicio" onClick={(e) => { e.preventDefault(); alert('Termos de Uso: todas as peças são 100% naturais e únicas.'); }} className="footer-link">
                  Termos de uso
                </a>
              </li>
              <li>
                <a href="#inicio" onClick={(e) => { e.preventDefault(); alert('Trocas e Devoluções: até 7 dias corridos após o recebimento com suporte humanizado.'); }} className="footer-link">
                  Trocas e devoluções
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Copyright */}
        <div
          style={{
            paddingTop: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.55)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>© 2026 Hope Cristais. Todos os direitos reservados.</span>
            <span style={{ color: 'var(--hope-lavender)' }}>•</span>
            <a
              href={`https://wa.me/5519992601663?text=${encodeURIComponent('Olá, vi o site da Hope Cristais e queria informações sobre o site.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
            >
              Feito por Marcelo Almeida
            </a>
          </div>

          <button
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
            className="back-to-top-btn"
          >
            <span>Voltar ao topo</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>

      <style>{`
        .footer-link {
          font-family: var(--font-sans);
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-block;
        }
        .footer-link:hover {
          color: var(--hope-lavender-light);
          transform: translateX(3px);
        }
        .footer-social-btn:hover {
          background-color: var(--hope-purple) !important;
          color: var(--hope-white) !important;
        }
        .back-to-top-btn:hover {
          color: var(--hope-white) !important;
        }

        @media (max-width: 960px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 36px !important;
          }
        }
        @media (max-width: 540px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </footer>
  );
};
