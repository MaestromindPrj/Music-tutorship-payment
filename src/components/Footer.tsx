'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Search } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '56px 0 32px 0',
      marginTop: '60px',
      fontFamily: 'var(--font-family)'
    }} id="footer-contact">
      <div className="container" style={{ maxWidth: '1240px' }}>
        {/* Top Grid Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Column 1: Brand & Receipt CTA */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              Music Tutorship
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#9ca3af',
              lineHeight: 1.6,
              marginBottom: '20px',
              maxWidth: '380px'
            }}>
              Official course fee payment and student registration portal for Music Tutorship programs.
            </p>
            <Link
              href="/lookup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '10px 20px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '0px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#e5e7eb'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'; }}
            >
              <Search size={13} />
              <span>RECEIPT LOOKUP</span>
            </Link>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '18px'
            }}>
              CONTACT & LOCATION
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#d1d5db' }}>
                <Mail size={15} style={{ color: '#ffffff', flexShrink: 0, marginTop: '2px' }} />
                <a href="mailto:info@musictutorship.in" style={{ color: '#d1d5db', textDecoration: 'none' }}>
                  info@musictutorship.in
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#d1d5db' }}>
                <Phone size={15} style={{ color: '#ffffff', flexShrink: 0, marginTop: '2px' }} />
                <a href="tel:+916374428173" style={{ color: '#d1d5db', textDecoration: 'none' }}>
                  +91 63744 28173
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                <MapPin size={15} style={{ color: '#ffffff', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  TVH Beliciaa Towers, Tower 2, 6th floor,<br />
                  71/4(71/4), Raja Annamalai Puram,<br />
                  M.R.C Nagar Chennai 600028
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar Divider */}
        <div style={{
          borderTop: '1px solid #1f2937',
          paddingTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '11px',
          color: '#6b7280',
          letterSpacing: '0.5px'
        }}>
          <div>
            © 2026 MUSIC TUTORSHIP. ALL RIGHTS RESERVED.
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a
              href="https://www.musictutorship.in/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9ca3af', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', fontWeight: 600 }}
            >
              PRIVACY POLICY
            </a>
            <a
              href="https://www.musictutorship.in/terms-of-services"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9ca3af', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', fontWeight: 600 }}
            >
              TERMS OF SERVICES
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
