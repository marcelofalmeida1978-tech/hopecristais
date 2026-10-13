import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="sobre" className="section" style={{ backgroundColor: 'var(--hope-soft)' }}>
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr',
            gap: '64px',
            alignItems: 'center'
          }}
          className="about-grid"
        >
          {/* Left Column — Real Founders Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative' }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-editorial)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-floating)',
                backgroundColor: 'var(--hope-white)'
              }}
            >
              <img
                src="/assets/team_founders.jpg"
                alt="Sócios e equipe Hope Cristais compartilhando sua paixão por cristais naturais"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover',
                  display: 'block'
                }}
                loading="lazy"
              />
            </div>

            {/* Subtle floating badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '-16px',
                right: '20px',
                backgroundColor: 'var(--hope-purple)',
                color: 'var(--hope-white)',
                padding: '12px 20px',
                borderRadius: 'var(--radius-pill)',
                boxShadow: 'var(--shadow-hover)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Heart size={14} fill="var(--hope-lavender-light)" color="var(--hope-lavender-light)" />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase'
                }}
              >
                Curadoria Manual
              </span>
            </div>
          </motion.div>

          {/* Right Column — Official History Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span className="section-eyebrow" style={{ marginBottom: 0 }}>
                DESDE 2022
              </span>
              <div
                style={{
                  width: '32px',
                  height: '1px',
                  backgroundColor: 'var(--hope-lavender)'
                }}
              />
            </div>

            <h2
              className="section-title"
              style={{ textAlign: 'left', marginBottom: '24px' }}
            >
              Nossa história
            </h2>

            <div
              style={{
                width: '48px',
                height: '2px',
                backgroundColor: 'var(--hope-lavender-light)',
                borderRadius: '2px',
                marginBottom: '28px'
              }}
            />

            {/* Official Text Exactly Preserved */}
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                lineHeight: 1.8,
                color: 'var(--hope-text)',
                fontWeight: 300,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <p>
                De uma pequena coleção nasceu uma grande paixão. Em 2022, surgiu a Hope Cristais, que há 4 anos transforma o amor pelos cristais em uma forma de levar beleza, harmonia, bem-estar, amor e positividade para a sua vida e para o seu ambiente.
              </p>

              <p>
                Cada cristal é escolhido com muito carinho e cuidado, buscando levar até você lindas peças em pedras naturais, cheias de beleza e significado.
              </p>

              <p>
                Acreditamos na força e na conexão que os cristais despertam e, principalmente, na beleza única que a natureza nos oferece.
              </p>

              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '19px',
                  fontStyle: 'italic',
                  color: 'var(--hope-purple)',
                  fontWeight: 500,
                  marginTop: '10px'
                }}
              >
                Hope Cristais — cristais escolhidos com carinho para levar boas energias até você.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  );
};
