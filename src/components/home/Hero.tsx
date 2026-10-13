import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy handled
      });
    }
  }, []);
  return (
    <section
      id="inicio"
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--hope-white)',
        paddingTop: '40px',
        paddingBottom: '80px',
        minHeight: 'calc(90vh - var(--header-height))',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Subtle organic gradient shapes in background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184, 179, 226, 0.25) 0%, rgba(245, 242, 250, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-5%',
          left: '2%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230, 223, 240, 0.35) 0%, rgba(255, 255, 255, 0) 70%)',
          filter: 'blur(50px)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: '64px',
            alignItems: 'center'
          }}
          className="hero-grid"
        >
          {/* Left Column — Editorial Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}
            >
              <Sparkles size={15} color="var(--hope-lavender)" />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--hope-purple)'
                }}
              >
                HOPE CRISTAIS
              </span>
            </div>

            {/* Main H1 Title */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.5rem, 4.8vw, 4.2rem)',
                lineHeight: 1.1,
                fontWeight: 500,
                color: 'var(--hope-text)',
                marginBottom: '24px'
              }}
            >
              Beleza natural. <br />
              <span style={{ fontStyle: 'italic', color: 'var(--hope-purple)' }}>
                Energia que transforma.
              </span>
            </h1>

            {/* Body Text */}
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(15px, 1.15vw, 17px)',
                lineHeight: 1.75,
                color: 'var(--hope-muted)',
                fontWeight: 400,
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                marginBottom: '36px',
                maxWidth: '540px'
              }}
            >
              Descubra cristais escolhidos com carinho para levar beleza, harmonia, bem-estar, amor e positividade para sua vida e para o seu ambiente.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '40px'
              }}
            >
              <a href="#produtos" className="btn btn-primary">
                <span>EXPLORAR CRISTAIS</span>
                <ArrowRight size={16} />
              </a>

              <a href="#sobre" className="btn btn-secondary">
                <span>CONHEÇA A HOPE</span>
              </a>
            </div>

            {/* Reassurance Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                paddingTop: '24px',
                borderTop: '1px solid var(--hope-border)'
              }}
              className="hero-reassurance"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--hope-purple)" />
                <span style={{ fontSize: '12px', color: 'var(--hope-muted)', fontWeight: 500 }}>
                  Cristais 100% Naturais
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--hope-lavender)'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--hope-muted)', fontWeight: 500 }}>
                  Curadoria Afetiva
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--hope-lavender)'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--hope-muted)', fontWeight: 500 }}>
                  Desde 2022
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column — Video Card with Editorial Frame */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {/* Elegant Translucent Frame Aura */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-18px',
                right: '-18px',
                bottom: '18px',
                left: '18px',
                border: '1px solid var(--hope-lavender-light)',
                borderRadius: 'var(--radius-editorial)',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />

            {/* Soft Purple Backdrop Shape */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: '92%',
                height: '92%',
                backgroundColor: 'var(--hope-soft)',
                borderRadius: 'var(--radius-editorial)',
                transform: 'rotate(-2deg)',
                zIndex: 0
              }}
            />

            {/* Main Video Container */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '480px',
                borderRadius: 'var(--radius-editorial)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-floating)',
                backgroundColor: '#1B1429',
                aspectRatio: '4 / 5'
              }}
            >
              <video
                ref={videoRef}
                src="/assets/hopehero.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

              {/* Discreet Editorial Badge Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  padding: '14px 18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '14px',
                  border: '1px solid rgba(229, 223, 238, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--hope-text)'
                    }}
                  >
                    Coleção Hope Cristais
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: 'var(--hope-muted)'
                    }}
                  >
                    Beleza natural em movimento
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--hope-purple)',
                    backgroundColor: 'var(--hope-soft)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)'
                  }}
                >
                  Hope
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .hero-reassurance {
            flex-wrap: wrap;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
};
