import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import { useLanguage } from '../../context/LanguageContext';
import { CircleAlert, Landmark, Calendar, Percent, ShieldCheck, RefreshCw, History } from 'lucide-react';

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                          <History size={14} className="text-secondary" />
                          <span>{language === 'en' ? 'Yearly Interest Rate Breakdown' : 'વાર્ષિક વ્યાજના દરોની વિગત'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                          {inv.rateHistory.map((rh, rhIdx) => {
                            const yearNum = rhIdx + 1;
                            let suffix = 'th';
                            if (yearNum % 10 === 1 && yearNum % 100 !== 11) suffix = 'st';
                            else if (yearNum % 10 === 2 && yearNum % 100 !== 12) suffix = 'nd';
                            else if (yearNum % 10 === 3 && yearNum % 100 !== 13) suffix = 'rd';
                            const yearLabel = language === 'en' 
                              ? `${yearNum}${suffix} Year` 
                              : (yearNum === 1 ? '૧લું વર્ષ' : yearNum === 2 ? '૨જું વર્ષ' : yearNum === 3 ? '૩જું વર્ષ' : `${yearNum}મું વર્ષ`);

                            return (
                              <div key={rhIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.5rem 0.75rem', backgroundColor: !rh.effectiveTo ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '6px', border: !rh.effectiveTo ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)' }}>
                                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                  {yearLabel}: <strong style={{ color: '#38bdf8', marginLeft: '0.25rem' }}>{rh.annualInterestRate}%</strong>
                                  {!rh.effectiveTo && (
                                    <span className="status-badge active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', marginLeft: '0.4rem' }}>
                                      {language === 'en' ? 'Active' : 'સક્રિય'}
                                    </span>
                                  )}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                  {formatDate(rh.effectiveFrom)} - {formatDate(rh.effectiveTo)}
                                </span>
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
