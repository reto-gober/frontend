import React, { useState } from 'react';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
  onBack: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onSuccess, onBack }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const validatePasswordStrength = (password: string) => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [hasUpper, hasLower, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(validatePasswordStrength(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(newPassword)) {
      setError('La contraseña debe contener mayúscula, número y símbolo.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/password/reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        setError(data.message || 'No se pudo cambiar la contraseña.');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={onBack} className="back-link" disabled={loading}>
        ← Volver
      </button>

      <p className="form-description">
        Ingresa tu nueva contraseña. Debe ser segura y fácil de recordar.
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
              type="password"
              value={newPassword}
              onChange={handlePasswordChange}
              className="form-input"
              placeholder="Nueva contraseña"
              required
              disabled={loading}
              minLength={8}
            />
          </div>
          
          {newPassword && (
            <div className="password-strength">
              <div className={`strength-bar strength-${passwordStrength}`}>
                <div className="strength-fill"></div>
              </div>
              <p className="strength-text">
                Seguridad: <span className={`strength-${passwordStrength}`}>
                  {passwordStrength === 'weak' && 'Débil'}
                  {passwordStrength === 'medium' && 'Media'}
                  {passwordStrength === 'strong' && 'Fuerte'}
                </span>
              </p>
            </div>
          )}

          <ul className="password-requirements">
            <li>Mínimo 8 caracteres</li>
            <li>Al menos una mayúscula</li>
            <li>Al menos un número</li>
            <li>Al menos un símbolo (!@#$%...)</li>
          </ul>
        </div>

        <div className="form-group">
          <div className="input-wrapper">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirmar contraseña"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Cambiando...
            </>
          ) : (
            'Cambiar Contraseña'
          )}
        </button>
      </form>
    </>
  );
};

export default ResetPassword;
