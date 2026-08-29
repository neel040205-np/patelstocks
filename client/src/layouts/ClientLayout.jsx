import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Wallet, Receipt, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

const ClientLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.body.classList.add('light-theme');
      return 'light';
    }
    document.body.classList.remove('light-theme');
    return 'dark';
  });

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img 
              src="/logo.png" 
              alt="Patel Stock & Investments Logo" 
              style={{ width: '42px', height: '42px', objectFit: 'contain' }} 
            />
            <span className="brand-text" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{t('appName')}</span>
          </div>
        </div>
        <div className="navbar-user">
          <button 
            onClick={toggleLanguage} 
            className="btn-lang-toggle" 
            title="Switch Language / ભાષા બદલો"
            style={{
              background: 'none',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              marginRight: '0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'var(--font-family)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {language === 'en' ? 'EN' : 'ગુજ'}
          </button>
          <button 
            onClick={toggleTheme} 
            className="btn-theme-toggle" 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              borderRadius: '50%',
              marginRight: '0.75rem',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="user-greeting">{t('welcome')}, <strong>{user?.name}</strong></span>
          <span className="user-badge client-badge">{t('client')}</span>
          <button onClick={handleLogout} className="btn-logout" title={t('logout')}>
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </header>

      <div className="main-wrapper">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
          </nav>
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
    </div>
  );
};

export default ClientLayout;
