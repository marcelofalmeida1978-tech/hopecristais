import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const EditorialBanner: React.FC = () => {
  return (
    <section
      style={{
        position: 'relative',
        backgroundColor: 'var(--hope-purple)',
        color: 'var(--hope-white)',
        paddingTop: '88px',
        paddingBottom: '88px',
        overflow: 'hidden',
        textAlign: 'center'
      }}
    >
      {/* Subtle Geometric Crystal Watermark in Background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '640px',
          height: '640px',
          opacity: 0.06,
          pointerEvents: 'none'
        }}
      >
        <svg viewBox="100 200 1800 980" fill="#FFFFFF" style={{ width: '100%', height: '100%' }}>
          <path fillRule="evenodd" d="M 1103.340 864.519 L 1043.544 760.949 L 1103.340 657.378 L 1163.137 760.947 Z M 1003.869 1036.807 L 944.072 933.238 L 1003.869 829.667 L 1063.665 933.237 Z M 844.601 760.950 L 904.397 657.378 L 964.194 760.949 L 904.398 864.519 Z M 1003.868 485.088 L 1063.665 588.659 L 1003.868 692.230 L 944.071 588.659 Z M 1684.226 554.366 L 1282.408 554.366 L 1202.812 692.229 L 1143.016 588.659 L 1222.610 450.796 L 1744.022 450.796 L 1783.693 382.083 L 1783.693 382.077 L 1182.935 382.077 L 1103.340 519.940 L 1043.543 416.369 L 1123.138 278.505 L 1843.494 278.505 L 1883.169 209.785 L 1083.464 209.785 L 1003.868 347.650 L 924.272 209.785 L 124.643 209.785 L 164.319 278.505 L 884.597 278.505 L 964.194 416.369 L 904.397 519.941 L 824.800 382.077 L 224.117 382.077 L 263.792 450.796 L 785.125 450.796 L 864.722 588.661 L 804.925 692.231 L 725.328 554.366 L 323.588 554.366 L 363.264 623.085 L 685.653 623.085 L 1003.869 1174.247 L 1322.083 623.085 L 1644.552 623.085 Z" />
        </svg>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '780px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--hope-lavender-light)',
              display: 'inline-block',
              marginBottom: '16px'
            }}
          >
            ESSÊNCIA DA NATUREZA
          </span>

          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 3.4rem)',
              fontWeight: 500,
              color: 'var(--hope-white)',
              letterSpacing: '0.02em',
              lineHeight: 1.15,
              marginBottom: '20px'
            }}
          >
            CRISTAIS ESCOLHIDOS COM CARINHO
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(15px, 1.2vw, 18px)',
              fontWeight: 300,
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.6,
              marginBottom: '36px'
            }}
          >
            Porque cada pedra carrega uma beleza única.
          </p>

          <a
            href="#produtos"
            className="btn btn-outline-white"
            style={{ padding: '15px 36px' }}
          >
            <span>VER COLEÇÃO</span>
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
