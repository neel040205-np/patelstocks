import { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import { useLanguage } from '../../context/LanguageContext';
import { CircleAlert, Receipt, RefreshCw } from 'lucide-react';

const ClientPayments = () => {
  const { language, t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentService.getClientPayments();
      setPayments(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
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
      hour: '2-digit',
      minute: '2-digit',
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
        <h3 className="panel-title" style={{ marginBottom: '0.5rem' }}>Error Loading Payments</h3>
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchPayments} className="btn-primary" style={{ margin: '0 auto' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{t('paymentsHistory')}</h1>
          <p className="page-subtitle">{t('appName')}</p>
        </div>
        <button onClick={fetchPayments} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={14} /> {language === 'en' ? 'Refresh' : 'તાજું કરો'}
        </button>
      </div>

      <div className="card-panel">
        {payments.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('amount')}</th>
                  <th>{language === 'en' ? 'Payment Type' : 'ચૂકવણી પ્રકાર'}</th>
                  <th>{t('status')}</th>
                  <th>{language === 'en' ? 'Description' : 'વર્ણન'}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td style={{ fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className="status-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}>
                        {payment.paymentType}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${payment.status.toLowerCase()}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {payment.description || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Receipt size={64} className="empty-state-icon" />
            <h2 className="empty-state-title">No Payment Records Found</h2>
            <p style={{ maxWidth: '400px' }}>
              You have not made any payments or receipts yet. Once a payment is recorded by the admin, it will display here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPayments;
