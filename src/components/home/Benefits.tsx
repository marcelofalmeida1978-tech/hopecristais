import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gem, HeartHandshake, Award } from 'lucide-react';

export const Benefits: React.FC = () => {
  const benefits = [
    {
      icon: Sparkles,
      title: 'SELEÇÃO ESPECIAL',
      description: 'Cristais escolhidos com cuidado'
    },
    {
      icon: Gem,
      title: 'PEDRAS NATURAIS',
      description: 'Beleza única em cada peça'
    },
    {
      icon: HeartHandshake,
      title: 'FEITO COM CARINHO',
      description: 'Cada detalhe pensado para você'
    },
    {
      icon: Award,
      title: 'EXPERIÊNCIA HOPE',
      description: 'Mais do que uma compra'
    }
  ];

  return (
    <section
      style={{
        backgroundColor: 'var(--hope-cream)',
        paddingTop: '60px',
        paddingBottom: '60px',
        borderTop: '1px solid var(--hope-border)',
        borderBottom: '1px solid var(--hope-border)'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '32px'
          }}
          className="benefits-grid"
        >
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--hope-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--hope-purple)',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>

                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--hope-text)',
                      marginBottom: '4px'
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      color: 'var(--hope-muted)',
                      fontWeight: 300,
                      lineHeight: 1.45
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .benefits-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 520px) {
          .benefits-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </section>
  );
};
