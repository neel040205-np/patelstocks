import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, LogOut, CheckCircle2, ArrowRight, ScanFace } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const SecurityPinGuard = ({ children }) => {
  const { user, isAuthenticated, logout, refreshUser, loginWithPasskey } = useAuth();
  
  // Local session state for PIN verification
  const [isPinVerified, setIsPinVerified] = useState(() => {
    return sessionStorage.getItem('pin_verified') === 'true';
  });

  // Setup PIN state
  const [setupPin, setSetupPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState(1); // 1 = Enter PIN, 2 = Confirm PIN

  // Verification state
  const [verifyPin, setVerifyPin] = useState(['', '', '', '']);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const isPasskeyAvailable = authService.isPasskeySupported();

  // Input refs
  const setupRefs = [useRef(), useRef(), useRef(), useRef()];
  const confirmRefs = [useRef(), useRef(), useRef(), useRef()];
  const verifyRefs = [useRef(), useRef(), useRef(), useRef()];

  // Focus first input box when PIN screen opens
  useEffect(() => {
    if (isAuthenticated) {
      if (!user?.hasPinSet) {
        setTimeout(() => setupRefs[0]?.current?.focus(), 150);
      } else if (!isPinVerified) {
        setTimeout(() => verifyRefs[0]?.current?.focus(), 150);
      }
    }
  }, [isAuthenticated, user?.hasPinSet, isPinVerified]);

  if (!isAuthenticated || !user) {
    return children;
  }

  const handleFaceIdVerify = async () => {
    if (!user?.mobileNumber) return;
    setLoading(true);
    setError('');
    try {
      await loginWithPasskey(user.mobileNumber);
      sessionStorage.setItem('pin_verified', 'true');
      setIsPinVerified(true);
    } catch (err) {
      triggerShake();
      setError(err.message || 'Face ID verification failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to handle auto-advance input digit fields
  const handleDigitChange = (val, index, pinArray, setPinArray, refArray) => {
    if (!/^\d*$/.test(val)) return;
    const newArr = [...pinArray];
    newArr[index] = val.slice(-1);
    setPinArray(newArr);
    setError('');

    if (val && index < 3) {
      refArray[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (e, index, pinArray, refArray) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      refArray[index - 1]?.current?.focus();
    }
  };

  // Submit Handler: First-time PIN setup
  const handleSetupPinSubmit = async (e) => {
    e?.preventDefault();
    const pinStr = setupPin.join('');
    const confirmStr = confirmPin.join('');

    if (step === 1) {
      if (pinStr.length !== 4) {
        return setError('Please enter a complete 4-digit PIN');
      }
      setError('');
      setStep(2);
      setTimeout(() => confirmRefs[0]?.current?.focus(), 150);
      return;
    }

    if (step === 2) {
      if (confirmStr.length !== 4) {
        return setError('Please confirm your 4-digit PIN');
      }
      if (pinStr !== confirmStr) {
        triggerShake();
        setConfirmPin(['', '', '', '']);
        setTimeout(() => confirmRefs[0]?.current?.focus(), 150);
        return setError('PINs do not match. Please try again.');
      }

      setLoading(true);
      setError('');
      try {
        await authService.setPin(pinStr);
        sessionStorage.setItem('pin_verified', 'true');
        setIsPinVerified(true);
        if (refreshUser) refreshUser();
      } catch (err) {
        setError(err.message || 'Failed to set security PIN');
      } finally {
        setLoading(false);
      }
    }
  };

  // Submit Handler: PIN Verification
  const handleVerifyPinSubmit = async (enteredPinStr) => {
    const pinStr = enteredPinStr || verifyPin.join('');
    if (pinStr.length !== 4) {
      return setError('Please enter a 4-digit PIN');
    }

    setLoading(true);
    setError('');
    try {
      await authService.verifyPin(pinStr);
      sessionStorage.setItem('pin_verified', 'true');
      setIsPinVerified(true);
    } catch (err) {
      triggerShake();
      const nextAttempts = attemptsLeft - 1;
      setAttemptsLeft(nextAttempts);
      setVerifyPin(['', '', '', '']);
      setTimeout(() => verifyRefs[0]?.current?.focus(), 150);

      if (nextAttempts <= 0) {
        setError('Maximum PIN attempts exceeded (3/3). You have been logged out for security.');
        setTimeout(() => {
          logout();
        }, 1200);
      } else {
        setError(`Incorrect PIN. ${nextAttempts} attempt${nextAttempts > 1 ? 's' : ''} remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Keypad Helper
  const handleKeypadPress = (digit) => {
    if (!user?.hasPinSet) {
      if (step === 1) {
        const emptyIdx = setupPin.findIndex(d => d === '');
        if (emptyIdx !== -1) {
          handleDigitChange(digit, emptyIdx, setupPin, setSetupPin, setupRefs);
        }
      } else {
        const emptyIdx = confirmPin.findIndex(d => d === '');
        if (emptyIdx !== -1) {
          handleDigitChange(digit, emptyIdx, confirmPin, setConfirmPin, confirmRefs);
        }
      }
    } else {
      const emptyIdx = verifyPin.findIndex(d => d === '');
      if (emptyIdx !== -1) {
        const newPin = [...verifyPin];
        newPin[emptyIdx] = digit;
        setVerifyPin(newPin);
        setError('');
        if (emptyIdx < 3) {
          verifyRefs[emptyIdx + 1]?.current?.focus();
        }
        if (emptyIdx === 3) {
          handleVerifyPinSubmit(newPin.join(''));
        }
      }
    }
  };

  const handleKeypadBackspace = () => {
    if (!user?.hasPinSet) {
      if (step === 1) {
        const lastIdx = setupPin.map(d => d !== '').lastIndexOf(true);
        if (lastIdx !== -1) {
          const newPin = [...setupPin];
          newPin[lastIdx] = '';
          setSetupPin(newPin);
        }
      } else {
        const lastIdx = confirmPin.map(d => d !== '').lastIndexOf(true);
        if (lastIdx !== -1) {
          const newPin = [...confirmPin];
          newPin[lastIdx] = '';
          setConfirmPin(newPin);
        }
      }
    } else {
      const lastIdx = verifyPin.map(d => d !== '').lastIndexOf(true);
      if (lastIdx !== -1) {
        const newPin = [...verifyPin];
        newPin[lastIdx] = '';
        setVerifyPin(newPin);
      }
    }
  };

  // If user already has PIN set AND it's verified for this session, render app children!
  if (user.hasPinSet && isPinVerified) {
    return children;
  }

  // Otherwise, display Security PIN Screen
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#090d16', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', fontFamily: 'var(--font-family)' }}>
      <div 
        style={{ 
          backgroundColor: '#0f172a', 
          border: '1px solid #1e293b', 
          borderRadius: '1.25rem', 
          maxWidth: '420px', 
          width: '100%', 
          padding: '2rem 1.5rem', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
          animation: shake ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none',
          position: 'relative'
        }}
      >
        <style>{`
          @keyframes shake {
            10%, 90% { transform: translate3d(-2px, 0, 0); }
            20%, 80% { transform: translate3d(4px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
            40%, 60% { transform: translate3d(6px, 0, 0); }
          }
          .pin-box:focus {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25) !important;
            outline: none;
          }
        `}</style>

        {/* Lock Icon Header */}
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', color: '#10b981' }}>
          <Lock size={32} />
        </div>

        <h2 style={{ color: '#f8fafc', fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          {!user.hasPinSet 
            ? (step === 1 ? 'Set Up 4-Digit Security PIN' : 'Confirm Your 4-Digit PIN')
            : 'Enter 4-Digit Security PIN'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {!user.hasPinSet 
            ? 'Create a compulsory 4-digit PIN to secure your account'
            : `Welcome back, ${user.name || 'User'}. Enter your PIN to continue.`}
        </p>

        {/* Failed Attempt Warning Banner */}
        {user.hasPinSet && (
          <div style={{ marginBottom: '1.25rem', padding: '0.5rem 0.75rem', backgroundColor: attemptsLeft === 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)', border: `1px solid ${attemptsLeft === 1 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, borderRadius: '0.5rem', color: attemptsLeft === 1 ? '#ef4444' : '#f59e0b', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} />
            <span>Attempts Remaining: {attemptsLeft} / 3</span>
          </div>
        )}

        {/* Error Alert Message */}
        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* 4 Digit Input Field Boxes */}
        <form onSubmit={!user.hasPinSet ? handleSetupPinSubmit : (e) => { e.preventDefault(); handleVerifyPinSubmit(); }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            {Array.from({ length: 4 }).map((_, idx) => {
              const currentArr = !user.hasPinSet 
                ? (step === 1 ? setupPin : confirmPin)
                : verifyPin;
              const refArr = !user.hasPinSet
                ? (step === 1 ? setupRefs : confirmRefs)
                : verifyRefs;

              return (
                <input
                  key={idx}
                  ref={refArr[idx]}
                  type="password"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={currentArr[idx]}
                  onChange={(e) => {
                    if (!user.hasPinSet) {
                      if (step === 1) handleDigitChange(e.target.value, idx, setupPin, setSetupPin, setupRefs);
                      else handleDigitChange(e.target.value, idx, confirmPin, setConfirmPin, confirmRefs);
                    } else {
                      handleDigitChange(e.target.value, idx, verifyPin, setVerifyPin, verifyRefs);
                      const updated = [...verifyPin];
                      updated[idx] = e.target.value.slice(-1);
                      if (updated.every(d => d !== '')) {
                        handleVerifyPinSubmit(updated.join(''));
                      }
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, currentArr, refArr)}
                  className="pin-box"
                  style={{
                    width: '52px',
                    height: '56px',
                    borderRadius: '12px',
                    border: '2px solid #334155',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                />
              );
            })}
          </div>

          {/* Numeric Keypad Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', maxWidth: '280px', margin: '0 auto 1.5rem auto' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (!user.hasPinSet) {
                  if (step === 1) setSetupPin(['', '', '', '']);
                  else setConfirmPin(['', '', '', '']);
                } else setVerifyPin(['', '', '', '']);
              }}
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid #334155',
                color: '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleKeypadBackspace}
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid #334155',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⌫
            </button>
          </div>

          {user.hasPinSet && isPasskeyAvailable && (
            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '0.75rem 0 1rem 0', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }}></div>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }}></div>
              </div>

              <button
                type="button"
                onClick={handleFaceIdVerify}
                disabled={loading}
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <ScanFace size={22} />
                <span>{loading ? 'Verifying...' : 'Unlock with Face ID'}</span>
              </button>
            </div>
          )}

          {!user.hasPinSet && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', justifyContent: 'center' }}
            >
              {loading ? 'Saving PIN...' : (step === 1 ? 'Next Step →' : 'Confirm & Save PIN')}
            </button>
          )}
        </form>

        {/* Switch Account Logout Option */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
          <button
            type="button"
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <LogOut size={14} /> Switch Account / Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityPinGuard;
