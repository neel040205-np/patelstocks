import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Globe, Sun, Moon } from 'lucide-react';

const HeaderToggles = ({ className = '', style = {} }) => {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`header-toggles-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', ...style }}>
      {/* Language Toggle Button */}
      <button
        type="button"
        onClick={toggleLanguage}
        className="toggle-pill btn-lang-pill"
        title="Switch Language / ભાષા બદલો"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-card)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: '0.825rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          fontFamily: 'var(--font-family)',
          userSelect: 'none',
        }}
      >
        <Globe size={14} style={{ color: 'var(--secondary)' }} />
        <span>{language === 'en' ? 'English' : 'ગુજરાતી'}</span>
        <span
          style={{
            fontSize: '0.65rem',
            padding: '0.1rem 0.4rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(6, 186, 212, 0.15)',
            color: 'var(--secondary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginLeft: '0.15rem',
          }}
        >
          {language === 'en' ? 'GUJ' : 'ENG'}
        </span>
      </button>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className="toggle-pill btn-theme-pill"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-card)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: '0.825rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          fontFamily: 'var(--font-family)',
          userSelect: 'none',
        }}
      >
        {theme === 'dark' ? (
          <>
            <Moon size={14} style={{ color: '#818cf8' }} />
            <span>Dark</span>
          </>
        ) : (
          <>
            <Sun size={14} style={{ color: '#f59e0b' }} />
            <span>Light</span>
          </>
        )}
      </button>
    </div>
  );
};

export default HeaderToggles;
