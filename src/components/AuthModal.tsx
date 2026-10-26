'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { email: string; name: string; hasPaidConsultation: boolean }) => void;
  initialMode?: 'login' | 'signup' | 'forgot';
  actionPrompt?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  actionPrompt
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Validation rules
  const hasEmailAt = email.includes('@') && email.includes('.');
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  const isPasswordLengthOk = password.length >= 6;

  const validatePasswordRules = (pwd: string) => {
    if (pwd.length < 6) return 'Password must be at least 6 characters long.';
    if (!/\d/.test(pwd)) return 'Password must include at least one number (0-9).';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd)) {
      return 'Password must include at least one special character (e.g. !@#$%^&*).';
    }
    return '';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !hasEmailAt) {
      setError('Please enter a valid email address.');
      return;
    }

    const pwdErr = validatePasswordRules(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success && data.user) {
        localStorage.setItem('mt_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !hasEmailAt) {
      setError('Please enter a valid email address.');
      return;
    }

    const pwdErr = validatePasswordRules(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || email.split('@')[0]
        })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success && data.user) {
        localStorage.setItem('mt_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Registration failed. Try logging in.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !hasEmailAt) {
      setError('Please enter a valid email address.');
      return;
    }

    const pwdErr = validatePasswordRules(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          newPassword: password
        })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setSuccessMsg('Password updated successfully! You can now log in with your new password.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg('');
        }, 1800);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error. Please try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0px',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid #111111',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            padding: '4px'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ padding: '28px 28px 20px 28px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8871b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            AUTHENTICATION REQUIRED
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {mode === 'login' && 'Student Email Login'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {actionPrompt || (
              mode === 'login'
                ? 'Email login is required to proceed with fee payment and track consultation credits.'
                : mode === 'signup'
                ? 'Create an account to enroll in courses and schedule consultation sessions.'
                : 'Enter your registered email and set a new secure password.'
            )}
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px 28px 28px 28px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(185, 28, 28, 0.08)',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(21, 128, 61, 0.08)',
              color: '#15803d',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" htmlFor="auth-email">
                  <span>Email Address *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="Enter valid email (e.g. name@example.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>
                    <span>Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: '#b8871b',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Password (number + special character)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Password Rule Notice */}
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '18px',
                backgroundColor: '#f8fafc',
                padding: '8px 10px',
                border: '1px solid #e2e8f0',
                lineHeight: 1.4
              }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Requirement: </span>
                Password must include a <strong>number (0-9)</strong> and a <strong>special character (!@#$)</strong>.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                <span>{isLoading ? 'Verifying...' : 'Log In & Continue'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f172a',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="signup-name">
                  <span>Full Name</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-name"
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="signup-email">
                  <span>Email Address *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="signup-password">
                  <span>Password *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Create secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="signup-confirm">
                  <span>Confirm Password *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-confirm"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Password Requirement Badges */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ color: hasNumber ? '#15803d' : '#64748b', fontWeight: hasNumber ? 700 : 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{hasNumber ? '✓' : '○'}</span>
                  <span>Includes at least one number (0-9)</span>
                </div>
                <div style={{ color: hasSpecial ? '#15803d' : '#64748b', fontWeight: hasSpecial ? 700 : 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{hasSpecial ? '✓' : '○'}</span>
                  <span>Includes at least one special character (!@#$%^&*)</span>
                </div>
                <div style={{ color: isPasswordLengthOk ? '#15803d' : '#64748b', fontWeight: isPasswordLengthOk ? 700 : 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{isPasswordLengthOk ? '✓' : '○'}</span>
                  <span>At least 6 characters long</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                <span>{isLoading ? 'Creating Account...' : 'Sign Up & Continue'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f172a',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Log in
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="forgot-email">
                  <span>Registered Email Address *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="Enter valid email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="forgot-password">
                  <span>New Password *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="forgot-password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="New password (number + special char)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" htmlFor="forgot-confirm">
                  <span>Confirm New Password *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="forgot-confirm"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Requirement reminder */}
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '16px',
                backgroundColor: '#f8fafc',
                padding: '8px 10px',
                border: '1px solid #e2e8f0'
              }}>
                Password must contain at least 1 number (0-9) and 1 special character (!@#$).
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                <span>{isLoading ? 'Resetting Password...' : 'Save New Password'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f172a',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
