'use client';

import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
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

    
        <div>
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
  );
}
