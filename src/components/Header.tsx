'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, CheckCircle } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Header() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; hasPaidConsultation: boolean } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem('mt_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        // ignore
      }
    };

    syncUser();
    window.addEventListener('auth-change', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mt_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #eaeaea',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '84px',
          maxWidth: '1240px'
        }}>
          {/* Brand Logo & Title */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#000000'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Music Tutorship"
              width={35}
              height={35}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <span style={{
              fontFamily: 'var(--font-family)',
              fontWeight: 600,
              fontSize: '17px',
              letterSpacing: '-0.01em',
              color: '#111111'
            }}>
              Music Tutorship
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#0f172a'
                }}>
                  <User size={14} style={{ color: '#b8871b' }} />
                  <span style={{ fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.email}
                  </span>
                  {currentUser.hasPaidConsultation && (
                    <span style={{
                      backgroundColor: 'rgba(21, 128, 61, 0.1)',
                      color: '#15803d',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px'
                    }}>
                      ₹10K CREDIT
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'transparent',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#000000'; (e.currentTarget as HTMLElement).style.color = '#000000'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'transparent',
                  color: '#111111',
                  border: '1px solid #111111',
                  padding: '10px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#111111';
                }}
              >
                <User size={14} />
                <span>Login</span>
              </button>
            )}

            <Link
              href="/lookup"
              className="header-cta-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#111111',
                color: '#ffffff',
                padding: '12px 24px',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '0px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#262626'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'; }}
            >
              RECEIPT LOOKUP
            </Link>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </>
  );
}
