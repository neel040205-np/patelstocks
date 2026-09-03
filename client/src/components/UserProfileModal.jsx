import React from 'react';
import { X, User, Phone, Mail, Calendar, PhoneCall, MessageCircle, LogOut, ShieldCheck } from 'lucide-react';

const UserProfileModal = ({ isOpen, onClose, user, investmentStartDate, onLogout }) => {
  if (!isOpen) return null;

  // Helper to compute initials from full name
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const initials = getInitials(user?.name);
  const startDateStr = formatDate(investmentStartDate || user?.createdAt);

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="modal-content" style={{ backgroundColor: 'var(--bg-card, #1e293b)', borderRadius: '1rem', maxWidth: '440px', width: '100%', border: '1px solid var(--border-card, #334155)', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)', animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Header Profile Cover */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', padding: '1.75rem 1.5rem 1.25rem 1.5rem', textAlign: 'center', position: 'relative' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            title="Close"
          >
            <X size={18} />
          </button>
          
          {/* Monogram Badge ("NP") */}
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, margin: '0 auto 0.75rem auto', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', border: '3px solid rgba(255,255,255,0.9)' }}>
            {initials}
          </div>
          
          <h2 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 700, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {user?.name || 'Neel Patel'}
          </h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>
            <ShieldCheck size={12} /> {user?.role === 'ADMIN' ? 'ADMINISTRATOR' : 'CLIENT INVESTOR'}
          </span>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Client Info Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={16} style={{ color: 'var(--secondary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Neel Patel'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={16} style={{ color: 'var(--secondary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone Number</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.mobileNumber || 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={16} style={{ color: 'var(--secondary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email || 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={16} style={{ color: 'var(--secondary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date Started Investing</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981' }}>{startDateStr}</div>
              </div>
            </div>
          </div>

          {/* Developer Contact Card */}
          <div style={{ backgroundColor: 'rgba(6, 186, 212, 0.08)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(6, 186, 212, 0.2)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📞 Developer & Technical Support
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              +91 8866823025
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href="tel:8866823025"
                style={{ flex: 1, padding: '0.45rem', backgroundColor: 'var(--secondary)', color: '#ffffff', borderRadius: '0.375rem', textDecoration: 'none', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <PhoneCall size={14} /> Call Developer
              </a>
              <a
                href="https://wa.me/918866823025"
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: '0.45rem', backgroundColor: '#25D366', color: '#ffffff', borderRadius: '0.375rem', textDecoration: 'none', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={onLogout}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
          >
            <LogOut size={16} /> Logout Account
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
