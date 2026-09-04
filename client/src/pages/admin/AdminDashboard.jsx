import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Landmark, CreditCard, PiggyBank, RefreshCw, CircleAlert, ScanFace, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, registerPasskey } = useAuth();
  const { language, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [utilityLoading, setUtilityLoading] = useState(false);
  const [utilityMessage, setUtilityMessage] = useState('');
  const [utilityError, setUtilityError] = useState('');

  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySuccess, setPasskeySuccess] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  const isPasskeyAvailable = authService.isPasskeySupported();

  const handleEnableFaceID = async () => {
    setPasskeyError('');
    setPasskeySuccess('');
    setPasskeyLoading(true);
    try {
      await registerPasskey();
      setPasskeySuccess('Face ID / Biometrics enabled successfully for your Admin account!');
    } catch (err) {
      setPasskeyError(err.message || 'Failed to enable Face ID');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleSeedTestUsers = async () => {
    setUtilityLoading(true);
    setUtilityMessage('');
    setUtilityError('');
    try {
      const res = await portfolioService.seedTestUsers();
      setUtilityMessage(res.message);
      await fetchStats();
    } catch (err) {
      setUtilityError(err.message || 'Failed to seed test users');
    } finally {
      setUtilityLoading(false);
    }
  };

  const handleWipeTestData = async () => {
    setUtilityLoading(true);
    setUtilityMessage('');
    setUtilityError('');
    try {
      const res = await portfolioService.wipeTestData();
      setUtilityMessage(res.message);
      await fetchStats();
    } catch (err) {
      setUtilityError(err.message || 'Failed to wipe test data');
    } finally {
      setUtilityLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await portfolioService.getAdminDashboard();
      setStats(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <CircleAlert size={48} className="text-danger" style={{ marginBottom: '1rem' }} />
        <h3 className="panel-title" style={{ marginBottom: '0.5rem' }}>Error Loading Stats</h3>
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchStats} className="btn-primary" style={{ margin: '0 auto' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{t('dashboard')}</h1>
          <p className="page-subtitle">{t('appNameAdmin')}</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={14} /> {language === 'en' ? 'Refresh' : 'તાજું કરો'}
        </button>
      </div>

      {/* Face ID / Passkey Enrollment Banner */}
      {isPasskeyAvailable && !user?.hasPasskeySet && (
        <div style={{
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ScanFace size={24} />
            </div>
            <div>
              <h4 style={{ color: '#f8fafc', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                Enable Admin Biometrics & Face ID
              </h4>
              <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0', fontSize: '0.82rem' }}>
                Unlock the Admin portal seamlessly using Fingerprint, Face Unlock, or iPhone Face ID without re-typing your PIN.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableFaceID}
            disabled={passkeyLoading}
            style={{
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '0.6rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <ScanFace size={16} />
            {passkeyLoading ? 'Setting up...' : 'Enable Face ID'}
          </button>
        </div>
      )}

      {passkeySuccess && (
        <div className="alert-message alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{passkeySuccess}</span>
        </div>
      )}

      {passkeyError && (
        <div className="alert-message alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CircleAlert size={18} />
          <span>{passkeyError}</span>
        </div>
      )}

      {/* Admin Summary Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <span className="stats-title">{language === 'en' ? 'Total Registered Clients' : 'કુલ નોંધાયેલ ગ્રાહકો'}</span>
          <span className="stats-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} className="text-secondary" /> {stats?.totalClients}
          </span>
        </div>
        <div className="stats-card cyan">
          <span className="stats-title">{t('totalInvested')}</span>
          <span className="stats-value" title={formatCurrency(stats?.totalInvested)}>{formatCurrency(stats?.totalInvested)}</span>
        </div>
        <div className="stats-card success">
          <span className="stats-title">{t('totalProfit')}</span>
          <span className="stats-value" title={formatCurrency(stats?.totalProfit)}>{formatCurrency(stats?.totalProfit)}</span>
        </div>
        <div className="stats-card text-primary" style={{ borderLeftColor: 'var(--secondary)' }}>
          <span className="stats-title">{t('totalGain')}</span>
          <span className="stats-value" title={formatCurrency((stats?.totalInvested || 0) + (stats?.totalProfit || 0))}>
            {formatCurrency((stats?.totalInvested || 0) + (stats?.totalProfit || 0))}
          </span>
        </div>
        <div className="stats-card amber">
          <span className="stats-title">{t('totalPaid')}</span>
          <span className="stats-value" title={formatCurrency(stats?.totalReceived)}>{formatCurrency(stats?.totalReceived)}</span>
        </div>
        <div className="stats-card rose">
          <span className="stats-title">{t('portfolioValue')}</span>
          <span className="stats-value" title={formatCurrency(stats?.totalPortfolioValue)}>{formatCurrency(stats?.totalPortfolioValue)}</span>
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card-panel">
          <div className="panel-header">
            <h2 className="panel-title">{language === 'en' ? 'Clients Directory' : 'ગ્રાહકોની ડિરેક્ટરી'}</h2>
            <Link to="/admin/clients" className="btn-action-view">{language === 'en' ? 'View All' : 'બધા જુઓ'}</Link>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {language === 'en' 
              ? 'View list of registered client profiles, update their interest rates, start dates, payment records, and search/filter by mobile number or name.'
              : 'નોંધાયેલા ગ્રાહકોની પ્રોફાઇલ જુઓ, તેમના વ્યાજના દર, શરૂઆતની તારીખ, ચૂકવણીના રેકોર્ડ્સ અપડેટ કરો અને શોધ/ફિલ્ટર કરો.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/admin/clients" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
              {t('clientsManagement')}
            </Link>
          </div>
        </div>

        <div className="card-panel">
          <div className="panel-header">
            <h2 className="panel-title">System Status</h2>
            <span className="status-badge success">Online</span>
          </div>
          <div className="detail-list">
            <div className="detail-item">
              <span className="detail-label">API Gateway</span>
              <span className="detail-val text-success">Healthy</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Database Connection</span>
              <span className="detail-val text-success">Connected</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Active Portfolios</span>
              <span className="detail-val">{stats?.totalClients} Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
