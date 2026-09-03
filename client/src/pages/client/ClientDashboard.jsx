import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import portfolioService from '../../services/portfolioService';
import { Wallet, Landmark, TrendingUp, CircleAlert, Calendar, Percent, RefreshCw, PiggyBank, History } from 'lucide-react';
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

  // Helper to calculate exact elapsed months
  const calculateElapsedMonthsLocal = (startD, endD) => {
    const start = new Date(startD);
    const end = new Date(endD);
    if (end <= start) return 0;

    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (endDay !== startDay) {
      if (endDay > startDay) {
        const daysInEndMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
        months += (endDay - startDay) / daysInEndMonth;
      } else {
        months -= 1;
        const daysInPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        months += (endDay + (daysInPrevMonth - startDay)) / daysInPrevMonth;
      }
    }
    return months;
  };

  // Sort investments by start date to find client's earliest investment start date
  const sortedInvestments = data?.investments && data.investments.length > 0
    ? [...data.investments].sort((a, b) => new Date(a.investmentStartDate) - new Date(b.investmentStartDate))
    : [];

  const hasInvestment = sortedInvestments.length > 0;
  const earliestInvestment = sortedInvestments[0];
  const startDate = earliestInvestment ? new Date(earliestInvestment.investmentStartDate) : new Date();

  // Generate 6 trend data points starting from the client's actual investment start date
  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const pointDate = new Date(startDate);
    pointDate.setMonth(startDate.getMonth() + index);

    const monthLabel = pointDate.toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit',
    });

    let totalValueAtPoint = 0;

    if (hasInvestment) {
      sortedInvestments.forEach((inv) => {
        const invStart = new Date(inv.investmentStartDate);
        if (pointDate >= invStart) {
          const parsedPrincipal = Number(inv.principalAmount) || 0;
          const parsedRate = Number(inv.annualInterestRate) || 0;
          let accrued = 0;

          if (inv.rateHistory && Array.isArray(inv.rateHistory) && inv.rateHistory.length > 0) {
            const history = [...inv.rateHistory].sort(
              (a, b) => new Date(a.effectiveFrom) - new Date(b.effectiveFrom)
            );
            for (let i = 0; i < history.length; i++) {
              const entry = history[i];
              const pRate = Number(entry.annualInterestRate) || 0;
              const pStart = new Date(entry.effectiveFrom);
              let pEnd = pointDate;
              if (entry.effectiveTo) {
                pEnd = new Date(entry.effectiveTo);
              } else if (i < history.length - 1) {
                pEnd = new Date(history[i + 1].effectiveFrom);
              }
              if (pEnd > pointDate) pEnd = pointDate;
              if (pEnd > pStart) {
                const elMonths = calculateElapsedMonthsLocal(pStart, pEnd);
                accrued += parsedPrincipal * (pRate / 12 / 100) * elMonths;
              }
            }
          } else {
            const elMonths = calculateElapsedMonthsLocal(invStart, pointDate);
            accrued = parsedPrincipal * (parsedRate / 12 / 100) * elMonths;
          }

          totalValueAtPoint += (parsedPrincipal + accrued);
        }
      });
    }

    return {
      month: monthLabel,
      'Portfolio Value': Math.round(totalValueAtPoint),
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
            <h2 className="panel-title">{language === 'en' ? 'Portfolio Growth Trend' : 'પોર્ટફોલિયો વૃદ્ધિ ટ્રેન્ડ'}</h2>
            <span className="status-badge active">{language === 'en' ? '6-Month Trend (From Start Date)' : '૬-મહિનાનો ટ્રેન્ડ (શરૂઆતથી)'}</span>
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
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{inv.calculations?.activeAnnualRate || inv.annualInterestRate}% ({t(inv.investmentType.toLowerCase())})</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('startDateLabel')}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(inv.investmentStartDate)}</div>
                  </div>
                </div>

                {/* Yearly Interest Rate Breakdown for Client */}
                {inv.rateHistory && inv.rateHistory.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                      <History size={15} className="text-secondary" />
                      <span>{language === 'en' ? 'Yearly Interest Rate Breakdown' : 'વાર્ષિક વ્યાજના દરોની વિગત'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                      {inv.rateHistory.map((rh, rhIdx) => {
                        const yearNum = rhIdx + 1;
                        let suffix = 'th';
                        if (yearNum % 10 === 1 && yearNum % 100 !== 11) suffix = 'st';
                        else if (yearNum % 10 === 2 && yearNum % 100 !== 12) suffix = 'nd';
                        else if (yearNum % 10 === 3 && yearNum % 100 !== 13) suffix = 'rd';
                        const yearLabel = language === 'en' 
                          ? `${yearNum}${suffix} Year` 
                          : (yearNum === 1 ? '૧લું વર્ષ' : yearNum === 2 ? '૨જું વર્ષ' : yearNum === 3 ? '૩જું વર્ષ' : `${yearNum}મું વર્ષ`);

                        const isActive = !rh.effectiveTo;

                        return (
                          <div 
                            key={rhIdx} 
                            style={{ 
                              padding: '0.6rem 0.8rem', 
                              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)', 
                              borderRadius: '8px', 
                              border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--text-primary)' }}>
                                {yearLabel}: <span style={{ color: '#38bdf8' }}>{rh.annualInterestRate}%</span>
                              </span>
                              {isActive && (
                                <span className="status-badge active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                  {language === 'en' ? 'Active' : 'સક્રિય'}
                                </span>
                              )}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500 }}>
                              {formatDate(rh.effectiveFrom)} - {formatDate(rh.effectiveTo)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
