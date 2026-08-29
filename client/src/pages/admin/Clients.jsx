import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Filter, CircleAlert, Eye, RefreshCw, Trash2, TriangleAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Clients = () => {
  const { language, t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchClientsList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await portfolioService.getAdminClients(searchQuery, statusFilter);
      setClients(res);
    } catch (err) {
      setError(err.message || 'Failed to load clients directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsList();
  }, [statusFilter]); // Re-fetch on filter change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClientsList();
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await portfolioService.deleteClient(clientToDelete.id);
      setToastMessage(t('deleteSuccess'));
      setClientToDelete(null);
      await fetchClientsList();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{language === 'en' ? 'Clients Directory' : 'ગ્રાહકોની ડિરેક્ટરી'}</h1>
          <p className="page-subtitle">{t('appNameAdmin')}</p>
        </div>
        <button onClick={fetchClientsList} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={14} /> {language === 'en' ? 'Refresh' : 'તાજું કરો'}
        </button>
      </div>

      {toastMessage && (
        <div className="alert-message alert-success" style={{ marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="card-panel filter-bar" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="search-input-wrapper" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder={language === 'en' ? "Search by client name or mobile number..." : "ગ્રાહકનું નામ અથવા મોબાઈલ નંબર દ્વારા શોધો..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem', marginTop: 0 }}>
            <Search size={16} />
            <span>{language === 'en' ? 'Search' : 'શોધો'}</span>
          </button>
        </div>

        <div className="filter-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} className="text-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="ALL">{language === 'en' ? 'All Statuses' : 'બધી સ્થિતિ'}</option>
            <option value="ACTIVE">{t('active')}</option>
            <option value="PENDING">{t('pending')}</option>
            <option value="COMPLETED">{t('completed')}</option>
            <option value="INACTIVE">{language === 'en' ? 'Inactive (No Investment)' : 'નિષ્ક્રિય (કોઈ રોકાણ નથી)'}</option>
          </select>
        </div>
      </form>

      {error && (
        <div className="alert-message alert-danger" style={{ marginBottom: '1.5rem' }}>
          <CircleAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="card-panel">
        {loading ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        ) : clients.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{language === 'en' ? 'Client Name' : 'ગ્રાહકનું નામ'}</th>
                  <th>{t('mobileNumber')}</th>
                  <th>{t('totalInvested')}</th>
                  <th>{t('totalPaid')}</th>
                  <th>{language === 'en' ? 'Outstanding Due' : 'બાકી રકમ'}</th>
                  <th>{t('portfolioValue')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 600 }}>{client.name}</td>
                    <td>{client.mobileNumber}</td>
                    <td>{formatCurrency(client.totalInvestment)}</td>
                    <td>{formatCurrency(client.totalReceived)}</td>
                    <td style={{ color: client.totalDue > 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {formatCurrency(client.totalDue)}
                    </td>
                    <td className="text-success" style={{ fontWeight: 'bold' }}>
                      {formatCurrency(client.portfolioValue)}
                    </td>
                    <td>
                      <span className={`status-badge ${client.status.toLowerCase()}`}>
                        {client.status === 'ACTIVE' ? t('active') : client.status === 'PENDING' ? t('pending') : client.status === 'COMPLETED' ? t('completed') : t('inactive')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link 
                          to={`/admin/clients/${client.id}`} 
                          className="btn-secondary" 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content', padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          <Eye size={12} /> {t('viewDetails')}
                        </Link>
                        <button
                          onClick={() => setClientToDelete(client)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          title={t('deleteUser')}
                        >
                          <Trash2 size={12} /> {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Search size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">{t('noClientsFound')}</h3>
            <p>{t('noClientsMessage')}</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {clientToDelete && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card, #1e293b)', padding: '1.5rem', borderRadius: '0.75rem', maxWidth: '420px', width: '90%', border: '1px solid var(--border-color, #334155)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', margin: 0, fontSize: '1.1rem' }}>
                <TriangleAlert size={20} />
                {t('deleteConfirmTitle')}
              </h3>
              <button onClick={() => setClientToDelete(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', margin: 0 }}>
                {t('deleteConfirmMessage')}
              </p>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{clientToDelete.name}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{clientToDelete.mobileNumber}</div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="btn-secondary"
                disabled={isDeleting}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                disabled={isDeleting}
              >
                {isDeleting ? t('loading') : (
                  <>
                    <Trash2 size={16} />
                    {t('delete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
