import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle } from 'lucide-react';
import HeaderToggles from '../components/HeaderToggles';

const Signup = () => {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name || !mobileNumber || !password || !confirmPassword) {
      return setError('Please fill in all required fields');
    }

    if (mobileNumber.length !== 10) {
      return setError('Mobile number must be exactly 10 digits');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      await signup(name, mobileNumber, password, email);
      navigate('/client/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Mobile number might already be in use.');
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
            <label htmlFor="name">{t('fullName')} *</label>
            <input
              id="name"
              type="text"
              placeholder={language === 'en' ? "Enter full name" : "પૂરું નામ દાખલ કરો"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mobileNumber">{t('mobileNumber')} *</label>
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

          <div className="form-group">
            <label htmlFor="email">{t('emailAddress')} ({language === 'en' ? 'Optional' : 'વૈકલ્પિક'})</label>
            <input
              id="email"
              type="email"
              placeholder={language === 'en' ? "Enter email address" : "ઈમેલ એડ્રેસ દાખલ કરો"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')} *</label>
            <input
              id="password"
              type="password"
              placeholder={language === 'en' ? "Min 6 characters" : "ઓછામાં ઓછા ૬ અક્ષર"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('confirmPassword')} *</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder={language === 'en' ? "Re-enter password" : "પાસવર્ડ ફરીથી દાખલ કરો"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('loading') : t('register')}
          </button>
        </form>

        <div className="auth-footer">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="auth-link">
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
