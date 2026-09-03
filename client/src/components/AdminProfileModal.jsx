import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, Edit2, Check, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();

  const [editingMobile, setEditingMobile] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setMobileNumber(user.mobileNumber || '');
      setEmail(user.email || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSaveMobile = async () => {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await updateProfile(mobileNumber, email);
      setMessage('Mobile number updated successfully');
      setEditingMobile(false);
    } catch (err) {
      setError(err.message || 'Failed to update mobile number');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await updateProfile(mobileNumber, email);
      setMessage('Email address updated successfully');
      setEditingEmail(false);
    } catch (err) {
      setError(err.message || 'Failed to update email address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="modal-content" style={{ backgroundColor: 'var(--bg-card, #0f172a)', borderRadius: '1rem', maxWidth: '420px', width: '100%', border: '1px solid var(--border-card, #334155)', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Header Profile Cover */}
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', padding: '1.75rem 1.5rem 1.25rem 1.5rem', textAlign: 'center', position: 'relative' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Close"
          >
            <X size={18} />
          </button>
          
          {/* DP Monogram Badge */}
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, margin: '0 auto 0.75rem auto', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', border: '3px solid rgba(255,255,255,0.9)' }}>
            DP
          </div>
          
          <h2 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 800, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            Dev Patel
          </h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>
            <ShieldCheck size={12} /> ADMINISTRATOR
          </span>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Notification Alert Messages */}
          {error && (
            <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {message && (
            <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.5rem', color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={14} /> {message}
            </div>
          )}

          {/* Field 1: Mobile Number with Edit Option */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Phone size={14} style={{ color: '#f59e0b' }} />
                <span>Mobile Number</span>
              </div>
              {!editingMobile ? (
                <button
                  type="button"
                  onClick={() => setEditingMobile(true)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingMobile(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>

            {!editingMobile ? (
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.mobileNumber || '8866823025'}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={handleSaveMobile}
                  disabled={saving}
                  style={{ padding: '0.4rem 0.75rem', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Field 2: Email Address with Edit Option */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Mail size={14} style={{ color: '#f59e0b' }} />
                <span>Email Address</span>
              </div>
              {!editingEmail ? (
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingEmail(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>

            {!editingEmail ? (
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.email || 'devpatel@patelstocks.com'}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={saving}
                  style={{ padding: '0.4rem 0.75rem', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={logout}
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
          >
            <LogOut size={16} /> Logout Account
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminProfileModal;
