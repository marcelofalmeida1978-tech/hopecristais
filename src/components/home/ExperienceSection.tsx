import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ExperienceSectionProps {
  onSelectCategory: (category: string) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ onSelectCategory }) => {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  const imgY = useTransform(scrollYProgress, [0, 1], [-25, 25]);

  return (
    <section
      ref={sectionRef}
      className="section"
      style={{
        backgroundColor: 'var(--hope-white)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '64px',
            alignItems: 'center'
          }}
          className="experience-grid"
        >
          {/* Large Image with Soft Parallax Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-editorial)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-floating)',
              backgroundColor: 'var(--hope-soft)'
            }}
          >
            <motion.div style={{ y: imgY }}>
              <img
                src="/assets/produto_kit_agata_aromas.jpg"
                alt="Composição decorativa com ágata natural e aromatizador difusor da Hope Cristais"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '620px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                loading="lazy"
              />
            </motion.div>

            {/* Subtle editorial watermark caption */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={13} color="var(--hope-purple)" />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--hope-purple)'
                }}
              >
                Atmosfera & Conforto
              </span>
            </div>
          </motion.div>

          {/* Editorial Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <span className="section-eyebrow">EXPERIÊNCIA & AMBIÊNCIA</span>

            <h2
              className="section-title"
              style={{
                textAlign: 'left',
                fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
                marginBottom: '24px'
              }}
            >
              Um toque de natureza para o seu espaço
            </h2>

            <div
              style={{
                width: '48px',
                height: '2px',
                backgroundColor: 'var(--hope-lavender)',
                borderRadius: '2px',
                marginBottom: '28px'
              }}
            />

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                lineHeight: 1.8,
                color: 'var(--hope-muted)',
                fontWeight: 400,
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                marginBottom: '36px'
              }}
            >
              Pedras naturais, cristais e detalhes que transformam espaços em ambientes mais acolhedores e especiais.
            </p>

            <div>
              <button
                onClick={() => {
                  onSelectCategory('Decoração');
                  const elem = document.getElementById('produtos');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-primary"
              >
                <span>DESCOBRIR DECORAÇÃO</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .experience-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
};
