import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Phone, AlertCircle } from 'lucide-react';
import HeaderToggles from '../components/HeaderToggles';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
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
            <div className="input-container">
              <input
                id="password"
                type="password"
                placeholder={language === 'en' ? "Enter password" : "પાસવર્ડ દાખલ કરો"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
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
    </div>
  );
};

export default Login;
