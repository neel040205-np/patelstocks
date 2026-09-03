import { useState, useEffect, useCallback } from 'react';
import portfolioService from '../../services/portfolioService';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Filter, CircleAlert, Eye, RefreshCw, Trash2, TriangleAlert, X, RotateCcw } from 'lucide-react';
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

  const fetchClientsList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await portfolioService.getAdminClients(searchQuery, statusFilter);
      const sorted = [...(res || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setClients(sorted);
    } catch (err) {
      setError(err.message || 'Failed to load clients directory');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Real-time live search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientsList();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchClientsList]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClientsList();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
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

      {/* Modern Enhanced Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="card-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Search Input Box */}
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #94a3b8)', pointerEvents: 'none' }} 
              />
              <input
                type="text"
                placeholder={language === 'en' ? "Search by client name or mobile number..." : "ગ્રાહકનું નામ અથવા મોબાઈલ નંબર દ્વારા શોધો..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  paddingLeft: '2.6rem', 
                  paddingRight: searchQuery ? '2.5rem' : '1rem',
                  paddingTop: '0.65rem',
                  paddingBottom: '0.65rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color, #334155)',
                  backgroundColor: 'var(--bg-input, #0f172a)',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '0.9rem'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem'
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Filter Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                <Filter size={16} />
                <span>{language === 'en' ? 'Status:' : 'સ્થિતિ:'}</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ 
                  padding: '0.65rem 1rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid var(--border-color, #334155)',
                  backgroundColor: 'var(--bg-input, #0f172a)',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">{language === 'en' ? 'All Statuses' : 'બધી સ્થિતિ'}</option>
                <option value="ACTIVE">{t('active')}</option>
                <option value="PENDING">{t('pending')}</option>
                <option value="COMPLETED">{t('completed')}</option>
                <option value="INACTIVE">{language === 'en' ? 'Inactive (No Investment)' : 'નિષ્ક્રિય (કોઈ રોકાણ નથી)'}</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: '0.5rem',
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} />
                <span>{language === 'en' ? 'Reset Filters' : 'ફિલ્ટર રિસેટ કરો'}</span>
              </button>
            )}
          </div>

          {/* Filter Status Count Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>
              {loading ? (
                language === 'en' ? 'Searching...' : 'શોધી રહ્યું છે...'
              ) : (
                `${language === 'en' ? 'Showing' : 'દર્શાવે છે'} ${clients.length} ${language === 'en' ? (clients.length === 1 ? 'client' : 'clients') : 'ગ્રાહકો'}`
              )}
            </span>
            {(searchQuery || statusFilter !== 'ALL') && (
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                {searchQuery && `Search: "${searchQuery}" `}
                {statusFilter !== 'ALL' && `• Status: ${statusFilter}`}
              </span>
            )}
          </div>
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
                  <th>{language === 'en' ? 'Registered Date' : 'નોંધણી તારીખ'}</th>
                  <th>{t('totalInvested')}</th>
                  <th>{t('totalPaid')}</th>
                  <th>{language === 'en' ? 'Outstanding Due' : 'બાકી રકમ'}</th>
                  <th>{t('portfolioValue')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const isNew = client.createdAt && (new Date() - new Date(client.createdAt)) < 7 * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{client.name}</span>
                          {isNew && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 800, 
                              backgroundColor: 'rgba(56, 189, 248, 0.2)', 
                              color: '#38bdf8', 
                              border: '1px solid rgba(56, 189, 248, 0.4)', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '0.25rem',
                              letterSpacing: '0.5px'
                            }}>
                              NEW
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{client.mobileNumber}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
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
                );
              })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <Search size={48} className="empty-state-icon" style={{ opacity: 0.4, marginBottom: '1rem' }} />
            <h3 className="empty-state-title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              {searchQuery || statusFilter !== 'ALL' ? (language === 'en' ? 'No Matching Clients Found' : 'કોઈ મળતા ગ્રાહકો મળ્યા નથી') : t('noClientsFound')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {searchQuery || statusFilter !== 'ALL' 
                ? (language === 'en' ? `No clients match "${searchQuery || statusFilter}". Try adjusting your search query or status filter.` : `જણાવેલ વિગતો સાથે કોઈ ગ્રાહક મળ્યો નથી.`)
                : t('noClientsMessage')}
            </p>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button onClick={handleResetFilters} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                <RotateCcw size={14} /> {language === 'en' ? 'Clear All Filters' : 'બધા ફિલ્ટર દૂર કરો'}
              </button>
            )}
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
