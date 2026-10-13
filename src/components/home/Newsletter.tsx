import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    setError('');
    setIsSubmitted(true);
  };

  return (
    <section
      style={{
        backgroundColor: 'var(--hope-soft)',
        paddingTop: '80px',
        paddingBottom: '80px',
        borderTop: '1px solid var(--hope-border)'
      }}
    >
      <div className="container" style={{ maxWidth: '680px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--hope-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--hope-purple)',
              margin: '0 auto 20px auto',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Mail size={22} strokeWidth={1.8} />
          </div>

          <span className="section-eyebrow">CONEXÃO & NOVIDADES</span>

          <h2
            className="section-title"
            style={{ marginBottom: '14px' }}
          >
            Receba novidades da Hope
          </h2>

          <p
            className="section-subtitle"
            style={{ marginBottom: '32px' }}
          >
            Cadastre seu e-mail e fique por dentro de novidades, coleções e peças especiais.
          </p>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                backgroundColor: 'var(--hope-white)',
                padding: '24px',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--hope-purple)'
              }}
            >
              <CheckCircle size={22} color="var(--hope-purple)" />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                Gratidão! Seu e-mail foi cadastrado com sucesso. Em breve você receberá nossas novidades.
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  backgroundColor: 'var(--hope-white)',
                  padding: '8px',
                  borderRadius: 'var(--radius-pill)',
                  boxShadow: 'var(--shadow-card)',
                  border: error ? '1px solid #D32F2F' : '1px solid var(--hope-border)'
                }}
                className="newsletter-form-container"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Seu melhor e-mail"
                  aria-label="Seu melhor e-mail"
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--hope-text)',
                    backgroundColor: 'transparent'
                  }}
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  <span>QUERO RECEBER</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {error && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#D32F2F',
                    marginTop: '8px',
                    textAlign: 'left',
                    paddingLeft: '20px'
                  }}
                >
                  {error}
                </p>
              )}

              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--hope-muted)',
                  marginTop: '14px'
                }}
              >
                Respeitamos sua privacidade. Jamais enviaremos mensagens indesejadas.
              </p>
            </form>
          )}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 580px) {
          .newsletter-form-container {
            flex-direction: column !important;
            border-radius: 16px !important;
            padding: 12px !important;
          }
          .newsletter-form-container input {
            padding: 10px !important;
          }
          .newsletter-form-container button {
            width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
};
