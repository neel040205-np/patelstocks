import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import HeaderToggles from '../components/HeaderToggles';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Clients Management', path: '/admin/clients', icon: Users },
  ];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="brand-logo admin-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img 
              src="/logo.png" 
              alt="Patel Stock & Investments Logo" 
              style={{ width: '42px', height: '42px', objectFit: 'contain' }} 
            />
            <span className="brand-text" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{t('appNameAdmin')}</span>
          </div>
        </div>
        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HeaderToggles />
          <span className="user-greeting">{t('welcome')}, <strong>{user?.name}</strong></span>
          <span className="user-badge admin-badge">{t('admin')}</span>
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
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span>{t(item.name === 'Dashboard' ? 'dashboard' : 'clientsManagement')}</span>
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

export default AdminLayout;
