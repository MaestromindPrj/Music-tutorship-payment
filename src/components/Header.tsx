'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, ExternalLink, Calendar } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Header() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('mt_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <>
      <header className="site-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #eaeaea',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div className={`container header-container ${isAdminRoute ? 'header-admin-container' : ''}`}>
          {/* Brand Logo & Title */}
          <Link href="/" className="header-brand" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#000000',
            flexShrink: 0
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Music Tutorship"
              width={34}
              height={34}
              className="header-brand-logo"
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <span className="header-brand-title" style={{
              fontFamily: 'var(--font-family)',
              fontWeight: 600,
              fontSize: '16px',
              letterSpacing: '-0.01em',
              color: '#111111'
            }}>
              Music Tutorship
            </span>
          </Link>

          <div className="header-actions">
            {isAdminRoute ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="header-admin-badge" style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: '#b8871b',
                  backgroundColor: 'rgba(226, 177, 60, 0.12)',
                  padding: '4px 8px',
                  border: '1px solid rgba(226, 177, 60, 0.3)'
                }}>
                  ADMIN
                </span>
                <Link
                  href="/"
                  className="header-admin-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = '#000000'; (e.currentTarget as HTMLElement).style.borderColor = '#000000'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                >
                  <ExternalLink size={13} />
                  <span className="btn-text-full">VIEW USER SITE</span>
                  <span className="btn-text-mobile">SITE</span>
                </Link>
              </div>
            ) : (
              <>
                {currentUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {currentUser.hasPaidConsultation && (
                      <a
                        href={`https://calendly.com/musictutorship/new-meeting?name=${encodeURIComponent(currentUser.name || '')}&email=${encodeURIComponent(currentUser.email)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="header-calendly-btn"
                        title="Book or reschedule your Discovery Call slot on Calendly"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#b8871b',
                          backgroundColor: 'rgba(226, 177, 60, 0.12)',
                          border: '1px solid rgba(226, 177, 60, 0.4)',
                          padding: '5px 10px',
                          textDecoration: 'none',
                          borderRadius: '0px'
                        }}
                      >
                        <Calendar size={13} />
                        <span className="btn-text-full">Book Discovery Call</span>
                        <span className="btn-text-mobile">Book Slot</span>
                      </a>
                    )}

                    <div className="header-user-badge">
                      <User size={14} style={{ color: '#b8871b', flexShrink: 0 }} />
                      <span className="header-user-email">
                        {currentUser.name ? currentUser.name.split(' ')[0] : currentUser.email}
                      </span>
                    </div>

                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="header-logout-btn"
                    >
                      <LogOut size={13} />
                      <span className="btn-text-full">Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="header-login-btn"
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
                      (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#111111';
                    }}
                  >
                    <User size={13} />
                    <span>Login</span>
                  </button>
                )}

                <Link
                  href="/lookup"
                  className="header-cta-btn"
                  onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#262626'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'; }}
                >
                  <span className="btn-text-full">RECEIPT LOOKUP</span>
                  <span className="btn-text-mobile">LOOKUP</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
          window.dispatchEvent(new Event('auth-change'));
        }}
      />
    </>
  );
}
