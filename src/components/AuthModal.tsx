'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
  MessageCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { email: string; name: string; hasPaidConsultation: boolean }) => void;
  actionPrompt?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionPrompt
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
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
        setError(data.error || 'Login failed. Please check your email and password.');
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
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
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
        maxWidth: '420px',
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
        <div style={{ padding: '26px 28px 18px 28px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8871b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            STUDENT PORTAL
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px', marginBottom: '4px' }}>
            Student Login
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {actionPrompt || 'Enter the email and password provided by Music Tutorship to access your account.'}
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px 28px 28px 28px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(185, 28, 28, 0.08)',
              color: '#b91c1c',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #fecaca'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

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
                  autoFocus
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" htmlFor="auth-password">
                <span>Password *</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
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
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Help box for credentials via WhatsApp */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#64748b',
            lineHeight: 1.6,
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 6px 0' }}>
              Accounts are created by the administrator. Credentials are provided via WhatsApp upon enrollment.
            </p>
            <a
              href="https://wa.me/919944634458?text=Hello%2C%20I%20need%20my%20Music%20Tutorship%20login%20credentials."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#15803d',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <MessageCircle size={13} />
              <span>Contact Support on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
