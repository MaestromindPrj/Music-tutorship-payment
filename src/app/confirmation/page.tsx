'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  CheckCircle2,
  Printer,
  Award,
  Loader2
} from 'lucide-react';
import { PaymentRecord, StudentRegistration } from '@/types';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const txnid = searchParams.get('txnid') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [registration, setRegistration] = useState<StudentRegistration | null>(null);

  useEffect(() => {
    if (txnid) {
      fetch(`/api/payment/details?txnid=${encodeURIComponent(txnid)}`)
        .then((res) => res.json())
        .then((data) => {
          setIsLoading(false);
          if (data.success) {
            setPayment(data.payment);
            setRegistration(data.registration);
          }
        })
        .catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [txnid]);

  const handlePrint = () => {
    window.print();
  };

  const maskAadhar = (num?: string) => {
    if (!num) return 'XXXX-XXXX-XXXX';
    const clean = num.replace(/\s+/g, '');
    if (clean.length < 12) return clean;
    return `XXXX XXXX ${clean.slice(-4)}`;
  };

  const maskPan = (pan?: string) => {
    if (!pan || pan.length < 10) return 'ABCDE****F';
    return `${pan.slice(0, 2)}****${pan.slice(-2)}`;
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Loader2 size={32} style={{ color: '#000000', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Loading Admission Receipt...</h2>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 24px 60px 24px', maxWidth: '760px' }}>
      {/* Step Progress Nav */}
      <div className="steps-nav no-print">
        <div className="step-item completed"><div className="step-number">✓</div><span>Select Program</span></div>
        <div className="step-item completed"><div className="step-number">✓</div><span>Payment</span></div>
        <div className="step-item completed"><div className="step-number">✓</div><span>Student Details</span></div>
        <div className="step-item active completed"><div className="step-number">✓</div><span>Confirmed</span></div>
      </div>

      {/* Main Confirmation Banner */}
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(21, 128, 61, 0.10)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px auto',
          color: '#15803d'
        }}>
          <CheckCircle2 size={28} />
        </div>

        <span className="section-overline" style={{ backgroundColor: 'rgba(21, 128, 61, 0.10)', color: '#15803d', border: 'none' }}>
          ENROLLMENT CONFIRMED
        </span>

        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          Welcome to Music Tutorship!
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
          Thank you <strong style={{ color: '#0f172a' }}>{registration?.fullName || payment?.studentName || 'Student'}</strong>. Your course registration is complete.
        </p>

        {/* Action Buttons in Black Only */}
        <div className="confirmation-actions" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={handlePrint}
            className="btn-ghost action-btn"
            style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
          >
            <Printer size={15} />
            <span>PRINT RECEIPT</span>
          </button>
          <a
            href="https://wa.me/916374428173?text=Hi%20Vijay%2C%20I%20have%20completed%20my%20course%20enrollment%20on%20payments.musictutorship.in"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary action-btn"
            style={{
              width: 'auto',
              backgroundColor: '#000000',
              display: 'inline-flex',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>CONNECT ON WHATSAPP</span>
          </a>
        </div>
      </div>

      {/* Official Receipt Card (Printable) */}
      <div className="receipt-card clean-card" style={{
        padding: '32px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1'
      }}>
        {/* Receipt Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '18px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Music Tutorship"
              width={38}
              height={38}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
                flexShrink: 0
              }}
            />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Music Tutorship
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Premium Music Education • Mentored by Vijay
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                TVH Beliciaa Towers, MRC Nagar, Chennai 600028
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '0px',
              backgroundColor: 'rgba(21, 128, 61, 0.10)',
              border: 'none',
              color: '#15803d',
              letterSpacing: '0.5px'
            }}>
              OFFICIAL PAYMENT RECEIPT
            </span>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Date: {payment?.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* 9 KYC Fields Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0px',
          padding: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Transaction ID</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
              {payment?.txnid || txnid}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Enrolled Course</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {payment?.courseName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Name</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {registration?.fullName || payment?.studentName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>DOB</div>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
              {registration?.dob || '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Gender</div>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
              {registration?.gender || '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Mail ID</div>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {registration?.email || payment?.email}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Phone Number</div>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px', wordBreak: 'break-word' }}>
              {registration?.phone || payment?.phone}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Aadhar Card</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#334155', marginTop: '2px' }}>
              {maskAadhar(registration?.aadharCard)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>PAN</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#334155', marginTop: '2px' }}>
              {maskPan(registration?.pan)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Occupation</div>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
              {registration?.occupation || '—'}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Address</div>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px', wordBreak: 'break-word' }}>
              {registration?.address || '—'}
            </div>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '14px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '15px',
            fontWeight: 700,
            color: '#0f172a'
          }}>
            <span>Total Paid (All-Inclusive):</span>
            <span style={{ color: '#000000', fontSize: '18px', fontWeight: 800 }}>
              ₹{payment ? Number(payment.amount).toLocaleString('en-IN') : '0.00'}
            </span>
          </div>
        </div>

        {/* Footer Seal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} style={{ color: '#15803d' }} />
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Official Music Tutorship Certified Admission
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontStyle: 'italic', fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
              Vijay
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Lead Mentor & Founder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
