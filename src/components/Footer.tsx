'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Search } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '72px 0 36px 0',
      marginTop: '60px',
      fontFamily: 'var(--font-family)'
    }} id="footer-contact">
      <div className="container" style={{ maxWidth: '1240px' }}>
        {/* Top Grid Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '48px',
          marginBottom: '56px'
        }}>
          {/* Column 1: Brand & Receipt CTA */}
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '16px',
              letterSpacing: '-0.01em'
            }}>
              Music Tutorship
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              lineHeight: 1.7,
              marginBottom: '24px'
            }}>
              Elevate your music production journey with personalized mentorship and comprehensive courses designed to unlock your creative potential.
            </p>
            <Link
              href="/lookup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '12px 22px',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '0px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#e5e7eb'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'; }}
            >
              <Search size={14} />
              <span>RECEIPT LOOKUP</span>
            </Link>
          </div>

          {/* Column 2: Our Courses */}
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '24px'
            }}>
              OUR COURSES
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', padding: 0, margin: 0 }}>
              <li>
                <Link href="/" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}>
                  Complete Music Production Mastery Course
                </Link>
              </li>
              <li>
                <Link href="/" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}>
                  Producer Transformation Path
                </Link>
              </li>
              <li>
                <Link href="/" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}>
                  One-on-One Music Production Mentorship
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '24px'
            }}>
              CONTACT INFO
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#d1d5db' }}>
                <Mail size={17} style={{ color: '#ffffff', flexShrink: 0, marginTop: '2px' }} />
                <a href="mailto:info@musictutorship.in" style={{ color: '#d1d5db', textDecoration: 'none' }}>
                  info@musictutorship.in
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#d1d5db' }}>
                <Phone size={17} style={{ color: '#ffffff', flexShrink: 0, marginTop: '2px' }} />
                <a href="tel:+916374428173" style={{ color: '#d1d5db', textDecoration: 'none' }}>
                  +91 63744 28173
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
                <MapPin size={17} style={{ color: '#ffffff', flexShrink: 0, marginTop: '2px' }} />
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
          paddingTop: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '12px',
          color: '#6b7280',
          letterSpacing: '0.5px'
        }}>
          <div>
            © 2026 MUSIC TUTORSHIP. ALL RIGHTS RESERVED.
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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
