import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Filter, CircleAlert, Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Clients = () => {
  const { language, t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
                      <Link 
                        to={`/admin/clients/${client.id}`} 
                        className="btn-secondary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content', padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
                      >
                        <Eye size={12} /> {t('viewDetails')}
                      </Link>
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
    </div>
  );
};

export default Clients;
