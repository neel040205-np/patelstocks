import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Users, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import HeaderToggles from '../components/HeaderToggles';
import AdminProfileModal from '../components/AdminProfileModal';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Menu">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="brand-logo admin-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img 
              src="/logo.png" 
              alt="Patel Stock & Investments Logo" 
              style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
            />
            <span className="brand-text" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{t('appNameAdmin')}</span>
          </div>
        </div>
        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HeaderToggles />

          <span className="user-greeting desktop-only-greeting" style={{ fontSize: '0.875rem' }}>
            {t('welcome')}, <strong>{user?.name || 'System Admin'}</strong>
          </span>

          {/* Top-Right Monogram Avatar Badge ("SA") */}
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="monogram-avatar-btn"
            title="System Admin Profile"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              fontFamily: 'var(--font-family)',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            SA
          </button>

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
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
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
              SA
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                onClick={() => { setProfileModalOpen(true); setSidebarOpen(false); }}
                style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
              >
                System Admin
              </div>
              <span className="user-badge admin-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{t('admin')}</span>
            </div>
          </div>

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

            <button
              type="button"
              className="nav-item"
              onClick={() => { setProfileModalOpen(true); setSidebarOpen(false); }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-family)' }}
            >
              <ShieldCheck size={18} style={{ color: '#f59e0b' }} />
              <span>System Admin Profile</span>
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

      <AdminProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
