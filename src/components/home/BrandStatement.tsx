import React from 'react';
import { motion } from 'framer-motion';

export const BrandStatement: React.FC = () => {
  return (
    <section
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        backgroundColor: 'var(--hope-cream)',
        position: 'relative',
        textAlign: 'center',
        borderTop: '1px solid var(--hope-border)',
        borderBottom: '1px solid var(--hope-border)'
      }}
    >
      <div className="container" style={{ maxWidth: '860px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Subtle Wing Icon from Logo as Watermark/Accent */}
          <div
            style={{
              width: '40px',
              height: '24px',
              marginBottom: '20px',
              color: 'var(--hope-lavender)'
            }}
          >
            <svg viewBox="100 200 1800 980" fill="currentColor" style={{ width: '100%', height: '100%' }}>
              <path fillRule="evenodd" d="M 1103.340 864.519 L 1043.544 760.949 L 1103.340 657.378 L 1163.137 760.947 Z M 1003.869 1036.807 L 944.072 933.238 L 1003.869 829.667 L 1063.665 933.237 Z M 844.601 760.950 L 904.397 657.378 L 964.194 760.949 L 904.398 864.519 Z M 1003.868 485.088 L 1063.665 588.659 L 1003.868 692.230 L 944.071 588.659 Z M 1684.226 554.366 L 1282.408 554.366 L 1202.812 692.229 L 1143.016 588.659 L 1222.610 450.796 L 1744.022 450.796 L 1783.693 382.083 L 1783.693 382.077 L 1182.935 382.077 L 1103.340 519.940 L 1043.543 416.369 L 1123.138 278.505 L 1843.494 278.505 L 1883.169 209.785 L 1083.464 209.785 L 1003.868 347.650 L 924.272 209.785 L 124.643 209.785 L 164.319 278.505 L 884.597 278.505 L 964.194 416.369 L 904.397 519.941 L 824.800 382.077 L 224.117 382.077 L 263.792 450.796 L 785.125 450.796 L 864.722 588.661 L 804.925 692.231 L 725.328 554.366 L 323.588 554.366 L 363.264 623.085 L 685.653 623.085 L 1003.869 1174.247 L 1322.083 623.085 L 1644.552 623.085 Z" />
            </svg>
          </div>

          {/* Statement Quote */}
          <blockquote
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)',
              lineHeight: 1.28,
              fontWeight: 400,
              color: 'var(--hope-text)',
              marginBottom: '28px',
              fontStyle: 'normal'
            }}
          >
            “Mais do que cristais. <br />
            <span style={{ fontStyle: 'italic', color: 'var(--hope-purple)' }}>
              Pequenos detalhes que transformam ambientes, momentos e sentimentos.
            </span>”
          </blockquote>

          {/* Decorative Lavender Line */}
          <div
            style={{
              width: '60px',
              height: '2px',
              backgroundColor: 'var(--hope-lavender)',
              borderRadius: '2px',
              marginBottom: '16px'
            }}
          />

          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--hope-muted)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.25)'
            }}
          >
            Filosofia Hope Cristais
          </span>
        </motion.div>
      </div>
    </section>
  );
};
