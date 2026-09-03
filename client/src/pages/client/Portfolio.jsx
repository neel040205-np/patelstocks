import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import { useLanguage } from '../../context/LanguageContext';
import { CircleAlert, Landmark, Calendar, Percent, ShieldCheck, RefreshCw, History, TrendingUp } from 'lucide-react';

const Portfolio = () => {
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPortfolioData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await portfolioService.getClientDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present';
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
        <h3 className="panel-title" style={{ marginBottom: '0.5rem' }}>Error Loading Portfolio</h3>
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchPortfolioData} className="btn-primary" style={{ margin: '0 auto' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  const { investments, summary } = data || {};
  const hasInvestments = investments && investments.length > 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{t('portfolio')}</h1>
          <p className="page-subtitle">{t('appName')}</p>
        </div>
        <button onClick={fetchPortfolioData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={14} /> {language === 'en' ? 'Refresh' : 'તાજું કરો'}
        </button>
      </div>

      {hasInvestments ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Global Portfolio Summary */}
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

          {/* Monthly Money Growth Breakdown Table ("How Money Increases Each Month") */}
          <div className="card-panel">
            <div className="panel-header" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 className="panel-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} className="text-success" />
                  <span>{language === 'en' ? 'Monthly Money Growth Breakdown (How Money Increases)' : 'માસિક નાણાકીય વૃદ્ધિ વિગત (કેવી રીતે પૈસા વધે છે)'}</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {language === 'en' ? 'Detailed breakdown showing monthly, annual, and daily money generated for each interest rate period' : 'દરેક વ્યાજ દર સમયગાળા મુજબ માસિક, વાર્ષિક અને દૈનિક વધારાની ગણતરી'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {investments.map((inv, invIdx) => {
                const history = inv.rateHistory && inv.rateHistory.length > 0
                  ? inv.rateHistory
                  : [{ annualInterestRate: inv.annualInterestRate, effectiveFrom: inv.investmentStartDate, effectiveTo: null }];

                return (
                  <div key={inv._id} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                      {language === 'en' ? `Investment Plan #${invIdx + 1}` : `રોકાણ યોજના #${invIdx + 1}`} — Principal: {formatCurrency(inv.principalAmount)}
                    </div>

                    <div className="table-container">
                      <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>{language === 'en' ? 'Period / Year' : 'સમયગાળો / વર્ષ'}</th>
                            <th>{language === 'en' ? 'Interest Rate' : 'વ્યાજ દર'}</th>
                            <th>{language === 'en' ? 'Monthly Gain (+ ₹/mo)' : 'માસિક વધારો (+ ₹/મહિનો)'}</th>
                            <th>{language === 'en' ? 'Annual Gain (+ ₹/yr)' : 'વાર્ષિક વધારો (+ ₹/વર્ષ)'}</th>
                            <th>{language === 'en' ? 'Daily Gain (+ ₹/day)' : 'દૈનિક વધારો (+ ₹/દિવસ)'}</th>
                            <th>{language === 'en' ? 'Date Range' : 'સમય મર્યાદા'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((rh, rhIdx) => {
                            const yearNum = rhIdx + 1;
                            let suffix = 'th';
                            if (yearNum % 10 === 1 && yearNum % 100 !== 11) suffix = 'st';
                            else if (yearNum % 10 === 2 && yearNum % 100 !== 12) suffix = 'nd';
                            else if (yearNum % 10 === 3 && yearNum % 100 !== 13) suffix = 'rd';
                            const yearLabel = language === 'en' 
                              ? `${yearNum}${suffix} Year` 
                              : (yearNum === 1 ? '૧લું વર્ષ' : yearNum === 2 ? '૨જું વર્ષ' : yearNum === 3 ? '૩જું વર્ષ' : `${yearNum}મું વર્ષ`);

                            const rateP = Number(rh.annualInterestRate) || 0;
                            const monthlyGain = (inv.principalAmount * (rateP / 12)) / 100;
                            const annualGain = (inv.principalAmount * rateP) / 100;
                            const dailyGain = annualGain / 365;
                            const isActive = !rh.effectiveTo;

                            return (
                              <tr key={rhIdx} style={{ backgroundColor: isActive ? 'rgba(16, 185, 129, 0.04)' : 'transparent' }}>
                                <td>
                                  <strong style={{ color: 'var(--text-primary)' }}>{yearLabel}</strong>
                                  {isActive && (
                                    <span className="status-badge active" style={{ fontSize: '0.65rem', marginLeft: '0.4rem', padding: '0.05rem 0.35rem' }}>
                                      {language === 'en' ? 'Active' : 'સક્રિય'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontWeight: 700, color: '#38bdf8' }}>{rateP}%</td>
                                <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                                  + {formatCurrency(monthlyGain)} / mo
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                                  + {formatCurrency(annualGain)} / yr
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>
                                  + ₹{dailyGain.toFixed(2)} / day
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {formatDate(rh.effectiveFrom)} - {formatDate(rh.effectiveTo)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="panel-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={20} className="text-secondary" />
              <span>{language === 'en' ? 'Individual Investment Breakdown' : 'વ્યક્તિગત રોકાણ વિગત'}</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {investments.map((inv, idx) => {
                const activeRate = inv.calculations?.activeAnnualRate || inv.annualInterestRate;
                const monthlyReturns = (inv.principalAmount * (activeRate / 12)) / 100;
                const yearlyReturns = (inv.principalAmount * activeRate) / 100;
                const duration = inv.calculations?.elapsedMonths || 0;

                return (
                  <div key={inv._id} className="card-panel">
                    <div className="panel-header">
                      <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                        <ShieldCheck className="text-success" size={20} />
                        <span>{language === 'en' ? `Investment Plan #${idx + 1}` : `રોકાણ યોજના #${idx + 1}`}</span>
                      </h3>
                      <span className="status-badge active">{inv.status === 'ACTIVE' ? t('active') : t('pending')}</span>
                    </div>

                    <div className="detail-grid">
                      {/* Left Column: Core Stats */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('principal')}</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {formatCurrency(inv.principalAmount)}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t('annualRate')}</div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Percent size={16} /> {activeRate}%
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{language === 'en' ? 'Investment Duration' : 'રોકાણ સમયગાળો'}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {Math.round(duration * 100) / 100} {t('months')} {language === 'en' ? 'Active' : 'સક્રિય'}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Performance Projections */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 className="panel-title" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem', marginBottom: 0 }}>
                          {language === 'en' ? 'Yield & Growth Breakdown' : 'વળતર અને વિકાસ વિગત'}
                        </h4>
                        <div className="detail-list">
                          <div className="detail-item">
                            <span className="detail-label">{language === 'en' ? 'Calculated Monthly Return' : 'ગણતરી કરેલ માસિક વળતર'}</span>
                            <span className="detail-val text-success">{formatCurrency(monthlyReturns)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">{language === 'en' ? 'Calculated Annual Return' : 'ગણતરી કરેલ વાર્ષિક વળતર'}</span>
                            <span className="detail-val text-success">{formatCurrency(yearlyReturns)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">{t('individualProfit')}</span>
                            <span className="detail-val text-success">{formatCurrency(inv.calculations?.accruedInterest)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">{t('individualGain')}</span>
                            <span className="detail-val" style={{ fontWeight: 'bold' }}>{formatCurrency(inv.calculations?.individualGain)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">{t('investmentType')}</span>
                            <span className="detail-val">{t(inv.investmentType.toLowerCase())}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">{t('startDateLabel')}</span>
                            <span className="detail-val">{formatDate(inv.investmentStartDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rate History Timeline Breakdown for Client */}
                    {inv.rateHistory && inv.rateHistory.length > 0 && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                          <History size={16} className="text-secondary" />
                          <span>{language === 'en' ? 'Yearly Interest Rate Breakdown' : 'વાર્ષિક વ્યાજના દરોની વિગત'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
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
                                  padding: '0.75rem 0.9rem', 
                                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)', 
                                  borderRadius: '8px', 
                                  border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.25rem'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                                  <span style={{ color: 'var(--text-primary)' }}>
                                    {yearLabel}: <span style={{ color: '#38bdf8' }}>{rh.annualInterestRate}%</span>
                                  </span>
                                  {isActive && (
                                    <span className="status-badge active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                      {language === 'en' ? 'Active' : 'સક્રિય'}
                                    </span>
                                  )}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>
                                  {formatDate(rh.effectiveFrom)} - {formatDate(rh.effectiveTo)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-panel empty-state">
          <Landmark size={64} className="empty-state-icon" />
          <h2 className="empty-state-title">{t('noInvestments')}</h2>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
