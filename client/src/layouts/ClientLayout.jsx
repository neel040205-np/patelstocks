import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Wallet, Receipt, LogOut, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import HeaderToggles from '../components/HeaderToggles';
import UserProfileModal from '../components/UserProfileModal';
import portfolioService from '../services/portfolioService';

const ClientLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [investmentStartDate, setInvestmentStartDate] = useState(null);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        const data = await portfolioService.getClientDashboard();
        if (data && data.investments && data.investments.length > 0) {
          // Find earliest investment start date
          const sorted = [...data.investments].sort(
            (a, b) => new Date(a.investmentStartDate) - new Date(b.investmentStartDate)
          );
          setInvestmentStartDate(sorted[0].investmentStartDate);
        }
      } catch (err) {
        console.warn('Could not load client investment start date for profile:', err.message);
      }
    };

    if (user) {
      fetchDashboardDetails();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to compute initials from full name (e.g. "Neel Patel" -> "NP")
  const getInitials = (name) => {
    if (!name) return 'NP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'NP';
  };

  const initials = getInitials(user?.name);

  const menuItems = [
    { name: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/client/portfolio', icon: Wallet },
    { name: 'Payments History', path: '/client/payments', icon: Receipt },
  ];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Menu">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img 
              src="/logo.png" 
              alt="Patel Stock & Investments Logo" 
              style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
            />
            <span className="brand-text" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{t('appName')}</span>
          </div>
        </div>

        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HeaderToggles />

          {/* User Name Greeting (Desktop) */}
          <span className="user-greeting desktop-only-greeting" style={{ fontSize: '0.875rem' }}>
            {t('welcome')}, <strong>{user?.name}</strong>
          </span>

          {/* Top-Right Monogram Avatar Badge ("NP") */}
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="monogram-avatar-btn"
            title="View Profile Details & Developer Contact"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              fontFamily: 'var(--font-family)',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {initials}
          </button>

          {/* Header Logout Button */}
          <button onClick={handleLogout} className="btn-logout desktop-logout-btn" title={t('logout')}>
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </header>

      <div className="main-wrapper">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header-profile" style={{ padding: '0.75rem 1rem 1.25rem 1rem', borderBottom: '1px solid var(--border-card)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              onClick={() => { setProfileModalOpen(true); setSidebarOpen(false); }}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                onClick={() => { setProfileModalOpen(true); setSidebarOpen(false); }}
                style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
              >
                {user?.name || 'Neel Patel'}
              </div>
              <span className="user-badge client-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{t('client')}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span>{t(item.name === 'Dashboard' ? 'dashboard' : item.name === 'Portfolio' ? 'portfolio' : 'paymentsHistory')}</span>
                </Link>
              );
            })}

            {/* Profile Details Link in Mobile Sidebar */}
            <button
              type="button"
              className="nav-item"
              onClick={() => { setProfileModalOpen(true); setSidebarOpen(false); }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-family)' }}
            >
              <User size={18} style={{ color: 'var(--secondary)' }} />
              <span>Profile & Dev Contact</span>
            </button>
          </nav>

          {/* Always Visible Mobile Sidebar Logout Button */}
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
            <button
              onClick={handleLogout}
              className="btn-logout"
              style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.9rem' }}
            >
              <LogOut size={18} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Backdrop Overlay on Mobile */}
        {sidebarOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 'var(--navbar-height)',
              left: 0,
              width: '100vw',
              height: 'calc(100vh - var(--navbar-height))',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(3px)',
              zIndex: 85,
              transition: 'opacity 0.25s ease',
            }}
          />
        )}

        {/* Content */}
        <main className="content-area">
          <div className="content-container">{children}</div>
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        investmentStartDate={investmentStartDate}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default ClientLayout;
