import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Landmark, CreditCard, PiggyBank, RefreshCw, CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [utilityLoading, setUtilityLoading] = useState(false);
  const [utilityMessage, setUtilityMessage] = useState('');
  const [utilityError, setUtilityError] = useState('');

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

      {/* Admin Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stats-card">
          <span className="stats-title">{language === 'en' ? 'Total Registered Clients' : 'કુલ નોંધાયેલ ગ્રાહકો'}</span>
          <span className="stats-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} className="text-secondary" /> {stats?.totalClients}
          </span>
        </div>
        <div className="stats-card cyan">
          <span className="stats-title">{t('totalInvested')}</span>
          <span className="stats-value">{formatCurrency(stats?.totalInvested)}</span>
        </div>
        <div className="stats-card success">
          <span className="stats-title">{t('totalProfit')}</span>
          <span className="stats-value">{formatCurrency(stats?.totalProfit)}</span>
        </div>
        <div className="stats-card text-primary" style={{ borderLeftColor: 'var(--secondary)' }}>
          <span className="stats-title">{t('totalGain')}</span>
          <span className="stats-value">{formatCurrency((stats?.totalInvested || 0) + (stats?.totalProfit || 0))}</span>
        </div>
        <div className="stats-card amber">
          <span className="stats-title">{t('totalPaid')}</span>
          <span className="stats-value">{formatCurrency(stats?.totalReceived)}</span>
        </div>
        <div className="stats-card rose">
          <span className="stats-title">{t('portfolioValue')}</span>
          <span className="stats-value">{formatCurrency(stats?.totalPortfolioValue)}</span>
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
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

        {/* Scalability Load Testing Panel */}
        <div className="card-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              {language === 'en' ? 'Performance Load Testing' : 'લોડ ટેસ્ટિંગ યુટિલિટી'}
            </h2>
            {utilityLoading ? (
              <span className="status-badge active">{language === 'en' ? 'Processing...' : 'પ્રોસેસિંગ...'}</span>
            ) : (
              <span className="status-badge success">{language === 'en' ? 'Ready' : 'તૈયાર'}</span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5', fontSize: '0.9rem' }}>
            {language === 'en'
              ? 'Simulate real scalability by seeding 105 active test client profiles with compound interest timelines and yield returns, and wipe them cleanly afterwards.'
              : '૧૦૫ સક્રિય ટેસ્ટ ગ્રાહકોના નકલી ડેટા ઉમેરી સિસ્ટમ લોડ ટેસ્ટ કરો અને ટેસ્ટ પછી બધો જ ડેટા એક ક્લિકમાં સાફ કરો.'}
          </p>
          
          {utilityMessage && (
            <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1.25rem' }}>
              {utilityMessage}
            </div>
          )}

          {utilityError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem' }}>
              {utilityError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleSeedTestUsers} 
              className="btn-primary" 
              disabled={utilityLoading}
              style={{ fontSize: '0.85rem', flex: 1, minWidth: '140px', justifyContent: 'center' }}
            >
              {language === 'en' ? 'Seed 105 Clients' : '૧૦૫ ટેસ્ટ ડેટા ઉમેરો'}
            </button>
            <button 
              onClick={handleWipeTestData} 
              className="btn-secondary" 
              disabled={utilityLoading}
              style={{ fontSize: '0.85rem', border: '1px solid var(--accent)', color: 'var(--accent)', flex: 1, minWidth: '140px', justifyContent: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {language === 'en' ? 'Wipe Test Data' : 'ટેસ્ટ ડેટા સાફ કરો'}
            </button>
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
