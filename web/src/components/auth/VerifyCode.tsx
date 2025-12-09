import React, { useState } from 'react';

interface VerifyCodeProps {
  email: string;
  onSuccess: (token: string) => void;
  onBack: () => void;
}

const VerifyCode: React.FC<VerifyCodeProps> = ({ email, onSuccess, onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/password/verify-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const token = data.data?.token || data.token;
        if (token) {
          onSuccess(token);
        } else {
          setError('No se recibió el token de verificación.');
        }
      } else {
        setError(data.message || 'Código incorrecto o expirado.');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <>
      <button onClick={onBack} className="back-link" disabled={loading}>
        ← Volver
      </button>

      <p className="form-description">
        Ingresa el código de 6 dígitos que enviamos a <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <div className="login-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <div className="input-wrapper">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              className="form-input code-input"
              placeholder="123456"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          <p className="input-hint">El código expira en 10 minutos</p>
        </div>

        <button type="submit" className="btn-submit" disabled={loading || code.length !== 6}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Verificando...
            </>
          ) : (
            'Verificar Código'
          )}
        </button>
      </form>
    </>
  );
};

export default VerifyCode;
