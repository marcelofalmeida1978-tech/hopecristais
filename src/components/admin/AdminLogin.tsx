import React, { useState } from 'react';
import { Logo } from '../ui/Logo';
import { Lock, User, Eye, EyeOff, Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      const isValidUser = cleanUser === 'denisehopecristais';
      const isValidPassword = cleanPass === 'hope@cristais2026';

      if (isValidUser && isValidPassword) {
        const sessionPayload = JSON.stringify({
          user: 'denisehopecristais',
          loggedInAt: new Date().toISOString()
        });

        if (rememberMe) {
          localStorage.setItem('hope_admin_session', sessionPayload);
        } else {
          sessionStorage.setItem('hope_admin_session', sessionPayload);
        }
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Usuário ou senha incorretos. Por favor, verifique os dados digitados.');
      }
    }, 500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8F6F4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative'
      }}
    >
      {/* Background Decorative Circles */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(142, 68, 173, 0.08) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 163, 115, 0.12) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 45px rgba(58, 20, 77, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(142, 68, 173, 0.12)',
          padding: '44px 36px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', marginBottom: '16px' }}>
            <Logo variant="purple" height={42} layout="horizontal" />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F3E8FF',
              color: 'var(--hope-purple)',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}
          >
            <ShieldCheck size={14} />
            Painel da Proprietária
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '26px',
              color: 'var(--hope-purple-dark)',
              fontWeight: 500,
              margin: '4px 0 8px'
            }}
          >
            Gestão do Catálogo
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: 'var(--hope-gray-600)',
              lineHeight: 1.5
            }}
          >
            Acesse para editar preços, cadastrar novas peças, dar baixa em vendas e atualizar a loja.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #F87171',
              color: '#B91C1C',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* User Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--hope-purple-dark)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Usuário
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--hope-purple-light)'
                }}
              >
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Digite seu usuário"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans)',
                  color: '#1E293B',
                  backgroundColor: '#FAFAF9',
                  outline: 'none',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--hope-purple)')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--hope-purple-dark)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Senha de Acesso
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--hope-purple-light)'
                }}
              >
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans)',
                  color: '#1E293B',
                  backgroundColor: '#FAFAF9',
                  outline: 'none',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--hope-purple)')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#64748B' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--hope-purple)' }}
              />
              Lembrar acesso neste dispositivo
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              backgroundColor: 'var(--hope-purple)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(107, 43, 114, 0.35)',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <Sparkles size={16} />
                Entrar no Painel
              </>
            )}
          </button>
        </form>



        {/* Back to Public Store */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBackToStore}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--hope-purple)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px'
            }}
          >
            <ArrowLeft size={16} />
            Voltar para a Loja Pública
          </button>
        </div>
      </div>
    </div>
  );
};
