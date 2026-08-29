import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import portfolioService from '../../services/portfolioService';
import { Wallet, Landmark, TrendingUp, CircleAlert, Calendar, Percent, RefreshCw, PiggyBank } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await portfolioService.getClientDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <h3 className="panel-title" style={{ marginBottom: '0.5rem' }}>Error Loading Dashboard</h3>
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary" style={{ margin: '0 auto' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  const { summary, investment } = data || {};
  const activePrincipal = Math.max(0, (summary?.totalInvested || 0) - (summary?.totalReceived || 0));
  const accruedProfit = summary?.totalProfit || 0;
  const totalReceived = summary?.totalReceived || 0;

  const pieData = [
    { name: language === 'en' ? 'Active Capital' : 'સક્રિય મૂડી', value: activePrincipal, color: '#06b6d4' },
    { name: language === 'en' ? 'Profit Earned' : 'કમાયેલ નફો', value: accruedProfit, color: '#10b981' },
    { name: language === 'en' ? 'Payouts Received' : 'મેળવેલ ચૂકવણી', value: totalReceived, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Mock growth chart data points for visual excellence
  // If user has investment, plot a monthly compounded profit projection
  const hasInvestment = !!investment && investment.principalAmount > 0;
  const principal = hasInvestment ? investment.principalAmount : 0;
  const rate = hasInvestment ? investment.annualInterestRate : 12;
  const monthlyRate = rate / 12 / 100;

  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const elapsedMonths = index + 1;
    // Compounded growth logic for mock visual
    const value = principal > 0 
      ? principal + (principal * monthlyRate * elapsedMonths)
      : 0;

    return {
      month: monthNames[index],
      'Portfolio Value': Math.round(value),
    };
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{t('dashboard')}</h1>
          <p className="page-subtitle">{t('appName')}</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={14} /> {language === 'en' ? 'Refresh' : 'તાજું કરો'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <span className="stats-title">{t('totalInvested')}</span>
          <span className="stats-value">{formatCurrency(summary?.totalInvested)}</span>
        </div>
        <div className="stats-card success">
          <span className="stats-title">{t('totalProfit')}</span>
          <span className="stats-value">{formatCurrency(summary?.totalProfit)}</span>
        </div>
        <div className="stats-card cyan">
          <span className="stats-title">{t('totalGain')}</span>
          <span className="stats-value">{formatCurrency((summary?.totalInvested || 0) + (summary?.totalProfit || 0))}</span>
        </div>
        <div className="stats-card amber">
          <span className="stats-title">{t('totalReceived')}</span>
          <span className="stats-value">{formatCurrency(summary?.totalReceived)}</span>
        </div>
        <div className="stats-card rose">
          <span className="stats-title">{t('portfolioValue')}</span>
          <span className="stats-value">{formatCurrency(summary?.currentPortfolioValue)}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Growth Chart */}
        <div className="card-panel">
          <div className="panel-header">
            <h2 className="panel-title">{language === 'en' ? 'Portfolio Growth (Projected)' : 'પોર્ટફોલિયો વૃદ્ધિ (અંદાજિત)'}</h2>
            <span className="status-badge active">{language === 'en' ? '6-Month Trend' : '૬-મહિનાનો ટ્રેન્ડ'}</span>
          </div>
          <div style={{ width: '100%', height: 300, minHeight: 250 }}>
            {hasInvestment ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickFormatter={(val) => `₹${val / 1000}k`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: '#f8fafc' 
                    }}
                    formatter={(val) => [formatCurrency(val), 'Value']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Portfolio Value" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#090d16' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <TrendingUp size={48} className="empty-state-icon" />
                <p className="empty-state-title">{language === 'en' ? 'No Investment Data to Plot' : 'પ્લોટ કરવા માટે કોઈ રોકાણ ડેટા નથી'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Allocation Pie/Donut Chart */}
        <div className="card-panel">
          <div className="panel-header">
            <h2 className="panel-title">{language === 'en' ? 'Portfolio Allocation' : 'પોર્ટફોલિયો વિતરણ'}</h2>
            <span className="status-badge success">{language === 'en' ? 'Asset Mix' : 'સંપત્તિ મિશ્રણ'}</span>
          </div>
          <div style={{ width: '100%', height: 300, minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {hasInvestment ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: '#f8fafc',
                      borderRadius: '8px'
                    }}
                    formatter={(val) => [formatCurrency(val), 'Amount']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <PiggyBank size={48} className="empty-state-icon" />
                <p className="empty-state-title">{language === 'en' ? 'No Allocation' : 'કોઈ વિતરણ નથી'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Details Panel */}
      <div className="card-panel" style={{ marginBottom: '2rem' }}>
        <div className="panel-header">
          <h2 className="panel-title">{t('activeInvestments')}</h2>
        </div>
        {data?.investments && data.investments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.investments.map((inv, idx) => (
              <div key={inv._id} style={{ borderBottom: idx < data.investments.length - 1 ? '1px dashed var(--border-card)' : 'none', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {language === 'en' ? `Investment Plan #${idx + 1}` : `રોકાણ યોજના #${idx + 1}`}
                  </span>
                  <span className={`status-badge ${inv.status.toLowerCase()}`}>
                    {inv.status === 'ACTIVE' ? t('active') : t('pending')}
                  </span>
                </div>
                <div className="detail-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('principal')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)' }}>{formatCurrency(inv.principalAmount)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('individualProfit')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--success)' }}>{formatCurrency(inv.calculations?.accruedInterest)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('individualGain')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--secondary)' }}>{formatCurrency(inv.calculations?.individualGain)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('annualRate')}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{inv.annualInterestRate}% ({t(inv.investmentType.toLowerCase())})</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('startDateLabel')}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(inv.investmentStartDate)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <Landmark size={36} className="empty-state-icon" />
            <p className="empty-state-title" style={{ fontSize: '1rem' }}>{t('noInvestments')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
