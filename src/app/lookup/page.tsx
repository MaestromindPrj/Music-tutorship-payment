'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, FileText, User, AlertCircle, Loader2 } from 'lucide-react';
import { PaymentRecord, StudentRegistration } from '@/types';

export default function LookupPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    payment?: PaymentRecord;
    registration?: StudentRegistration;
  } | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setSearched(true);
    setResult(null);

    try {
      const res = await fetch(`/api/payment/details?txnid=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setIsLoading(false);

      if (data.success && data.payment) {
        setResult({
          payment: data.payment,
          registration: data.registration
        });
      } else {
        setError(data.error || 'No transaction found matching this ID.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError('Failed to query database.');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px 24px', maxWidth: '720px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Payment & Admission Lookup
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Retrieve your official payment receipt, admission certificate, or complete pending KYC registration.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="clean-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Transaction ID (e.g. MT-XXXXXXXX)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn-primary"
            style={{ width: 'auto', padding: '12px 24px' }}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} />
            )}
            <span>Search Receipt</span>
          </button>
        </form>
      </div>

      {/* Error View */}
      {searched && error && (
        <div className="clean-card" style={{ padding: '28px', textAlign: 'center', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
          <AlertCircle size={36} style={{ color: '#dc2626', margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
            No Matching Record
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '13px' }}>
            {error}
          </p>
        </div>
      )}

      {/* Results View */}
      {result && result.payment && (
        <div className="clean-card" style={{ padding: '28px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '0px',
                  backgroundColor: result.payment.status === 'SUCCESS' ? 'rgba(21, 128, 61, 0.10)' : 'rgba(185, 28, 28, 0.10)',
                  border: 'none',
                  color: result.payment.status === 'SUCCESS' ? '#15803d' : '#b91c1c',
                  letterSpacing: '0.5px'
                }}>
                  {result.payment.status}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                  {result.payment.txnid}
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {result.payment.courseName}
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Amount Paid</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                ₹{Number(result.payment.amount).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px 24px',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ color: '#64748b' }}>Student Name:</span>
              <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px', wordBreak: 'break-word' }}>
                {result.registration?.fullName || result.payment.studentName}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Email:</span>
              <div style={{ color: '#0f172a', marginTop: '2px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {result.payment.email}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Phone:</span>
              <div style={{ color: '#0f172a', marginTop: '2px', wordBreak: 'break-word' }}>
                {result.payment.phone}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>KYC Status:</span>
              <div style={{ color: result.registration ? '#15803d' : '#b45309', fontWeight: 600, marginTop: '2px' }}>
                {result.registration ? 'Completed (Verified)' : 'Pending Submission'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {result.registration ? (
              <Link
                href={`/confirmation?txnid=${encodeURIComponent(result.payment.txnid)}`}
                className="btn-primary"
                style={{ width: 'auto' }}
              >
                <FileText size={15} />
                <span>View Admission Receipt</span>
              </Link>
            ) : (
              <Link
                href={`/register?txnid=${encodeURIComponent(result.payment.txnid)}`}
                className="btn-primary"
                style={{ width: 'auto' }}
              >
                <User size={15} />
                <span>Complete KYC Registration</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
