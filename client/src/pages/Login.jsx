import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, KeyRound, X, CheckCircle2, MessageSquare, Eye, EyeOff } from 'lucide-react';
import HeaderToggles from '../components/HeaderToggles';
import authService from '../services/authService';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetMobile, setResetMobile] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!mobileNumber || !password) {
      return setError('Please fill in all fields');
    }

    if (mobileNumber.length < 10) {
      return setError('Please enter a valid 10-digit mobile number');
    }

    setLoading(true);

    try {
      const user = await login(mobileNumber, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetMobile || resetMobile.length < 10) {
      return setResetError('Please enter a valid 10-digit mobile number');
    }
    if (!resetPin || resetPin.length !== 4) {
      return setResetError('Please enter your 4-digit Security PIN');
    }
    if (!newPassword || newPassword.length < 6) {
      return setResetError('New password must be at least 6 characters');
    }

    setResetLoading(true);
    try {
      const res = await authService.resetPasswordWithPin(resetMobile, resetPin, newPassword);
      setResetSuccess(res.message || 'Password reset successfully!');
      setTimeout(() => {
        setForgotModalOpen(false);
        setPassword(newPassword);
        setMobileNumber(resetMobile);
      }, 1500);
    } catch (err) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
        <HeaderToggles />
      </div>
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="auth-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img 
            src="/login-logo.png" 
            alt="Patel Stock & Investments Logo" 
            style={{ 
              width: '220px', 
              height: '220px', 
              objectFit: 'cover',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              marginBottom: '0.5rem'
            }} 
          />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.5rem 0 0 0', textAlign: 'center', letterSpacing: '0.5px' }}>
            {t('appName')}
          </h1>
        </div>

        {error && (
          <div className="alert-message alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mobileNumber">{t('mobileNumber')}</label>
            <div className="input-container">
              <input
                id="mobileNumber"
                type="tel"
                placeholder={language === 'en' ? "Enter 10-digit mobile number" : "૧૦-આંકડાનો મોબાઈલ નંબર દાખલ કરો"}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <div className="input-container" style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={language === 'en' ? "Enter password" : "પાસવર્ડ દાખલ કરો"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.2rem'
                }}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  setResetMobile(mobileNumber);
                  setResetError('');
                  setResetSuccess('');
                  setForgotModalOpen(true);
                }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('loading') : t('signIn')}
          </button>
        </form>

        <div className="auth-footer">
          {t('dontHaveAccount')}{' '}
          <Link to="/signup" className="auth-link">
            {t('registerHere')}
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', maxWidth: '420px', width: '100%', border: '1px solid #334155', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <KeyRound size={24} />
              </div>
              <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Reset Password</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Enter your registered mobile & 4-digit Security PIN</p>
            </div>

            {resetError && (
              <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={14} /> {resetError}
              </div>
            )}
            {resetSuccess && (
              <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.5rem', color: '#34d399', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} /> {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={resetMobile}
                  onChange={(e) => setResetMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#ffffff', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#ffffff', fontSize: '0.85rem', letterSpacing: '2px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 2.5rem 0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#ffffff', fontSize: '0.85rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.2rem'
                    }}
                    tabIndex={-1}
                    title={showResetPassword ? "Hide password" : "Show password"}
                  >
                    {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.65rem', marginTop: '0.25rem', justifyContent: 'center' }}
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            {/* Support / Admin Contact Option */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Forgot 4-digit PIN too?</p>
              <a
                href={`https://wa.me/918866823025?text=Hello%20Dev%20Patel,%20I%20forgot%20my%20Patel%20Stocks%20login%20password%20and%20Security%20PIN%20for%20mobile%20${resetMobile || 'number'}.%20Please%20reset%20my%20account.`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#25d366', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', backgroundColor: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.3)' }}
              >
                <MessageSquare size={14} /> Contact Dev Patel (8866823025)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
