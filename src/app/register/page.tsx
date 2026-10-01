'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { PaymentRecord } from '@/types';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txnid = searchParams.get('txnid') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  // Form State containing ONLY the 9 fields requested
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    address: '',
    aadharCard: '',
    gender: 'Male',
    email: '',
    phone: '',
    pan: '',
    occupation: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!txnid) {
      setIsLoading(false);
      setErrorMessage('Missing transaction ID. Please initiate payment from the homepage.');
      return;
    }

    fetch(`/api/payment/details?txnid=${encodeURIComponent(txnid)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.success && data.payment) {
          setPayment(data.payment);
          if (data.registration) {
            router.push(`/confirmation?txnid=${encodeURIComponent(txnid)}`);
            return;
          }
          setFormData((prev) => ({
            ...prev,
            fullName: data.payment.studentName || '',
            email: data.payment.email || '',
            phone: data.payment.phone || ''
          }));
        } else {
          setErrorMessage(data.error || 'Transaction could not be verified.');
        }
      })
      .catch(() => {
        setIsLoading(false);
        setErrorMessage('Failed to connect to database.');
      });
  }, [txnid, router]);

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    const formatted = parts.join(' ');
    setFormData((prev) => ({ ...prev, aadharCard: formatted }));
    if (errors.aadharCard) setErrors((prev) => ({ ...prev, aadharCard: '' }));
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, pan: raw }));
    if (errors.pan) setErrors((prev) => ({ ...prev, pan: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Please enter your Full Name';
    }
    if (!formData.dob) {
      errs.dob = 'Date of Birth (DOB) is required';
    }
    if (!formData.address.trim()) {
      errs.address = 'Please enter your complete Address';
    }
    const rawAadhar = formData.aadharCard.replace(/\s+/g, '');
    if (rawAadhar.length !== 12) {
      errs.aadharCard = 'Please enter a valid 12-digit Aadhar Card number';
    }
    if (!formData.gender) {
      errs.gender = 'Please select Gender';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Please enter a valid Mail ID';
    }
    const rawPhone = formData.phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit Phone Number';
    }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan)) {
      errs.pan = 'Please enter a valid 10-character PAN number (e.g. ABCDE1234F)';
    }
    if (!formData.occupation.trim()) {
      errs.occupation = 'Please enter your Occupation';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 80, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/registration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnid,
          ...formData
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        router.push(`/confirmation?txnid=${encodeURIComponent(txnid)}`);
      } else {
        setErrorMessage(data.error || 'Failed to save details. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Connection error.');
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Loader2 size={32} style={{ color: '#000000', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Loading Registration...</h2>
      </div>
    );
  }

  if (errorMessage && !payment) {
    return (
      <div className="container" style={{ padding: '60px 24px', maxWidth: '560px' }}>
        <div className="clean-card" style={{ padding: '32px', textAlign: 'center' }}>
          <AlertCircle size={36} style={{ color: '#dc2626', margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            Payment Record Not Found
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
            {errorMessage}
          </p>
          <Link href="/" className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 24px 60px 24px', maxWidth: '720px' }}>
      {/* Verified Banner */}
      <div style={{
        backgroundColor: 'rgba(21, 128, 61, 0.08)',
        border: 'none',
        borderRadius: '0px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={20} style={{ color: '#15803d' }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
              Payment Verified
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              {payment?.courseName}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#166534' }}>Amount Paid</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            ₹{payment ? Number(payment.amount).toLocaleString('en-IN') : '0.00'}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="clean-card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            Student Details
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Please fill in your details to complete your enrollment.
          </p>
        </div>

        {errorMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(185, 28, 28, 0.08)',
            border: 'none',
            borderRadius: '0px',
            color: '#b91c1c',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1. Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              <span>Name *</span>
            </label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
            />
            {errors.fullName && <div className="form-error-msg"><AlertCircle size={13} />{errors.fullName}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {/* 2. DOB */}
            <div className="form-group">
              <label className="form-label" htmlFor="dob">
                <span>DOB (Date of Birth) *</span>
              </label>
              <input
                id="dob"
                type="date"
                className="form-input"
                value={formData.dob}
                onChange={(e) => {
                  setFormData({ ...formData, dob: e.target.value });
                  if (errors.dob) setErrors({ ...errors, dob: '' });
                }}
              />
              {errors.dob && <div className="form-error-msg"><AlertCircle size={13} />{errors.dob}</div>}
            </div>

            {/* 5. GENDER */}
            <div className="form-group">
              <label className="form-label" htmlFor="gender">
                <span>GENDER *</span>
              </label>
              <select
                id="gender"
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* 3. ADDRESS */}
          <div className="form-group">
            <label className="form-label" htmlFor="address">
              <span>ADDRESS *</span>
            </label>
            <textarea
              id="address"
              rows={3}
              className="form-textarea"
              placeholder="Enter residential address"
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
            />
            {errors.address && <div className="form-error-msg"><AlertCircle size={13} />{errors.address}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {/* 4. AADHAR CARD */}
            <div className="form-group">
              <label className="form-label" htmlFor="aadharCard">
                <span>AADHAR CARD *</span>
                <span className="form-label-tag">12 Digits</span>
              </label>
              <input
                id="aadharCard"
                type="text"
                className="form-input"
                placeholder="XXXX XXXX XXXX"
                value={formData.aadharCard}
                onChange={handleAadharChange}
              />
              {errors.aadharCard && <div className="form-error-msg"><AlertCircle size={13} />{errors.aadharCard}</div>}
            </div>

            {/* 8. PAN */}
            <div className="form-group">
              <label className="form-label" htmlFor="pan">
                <span>PAN *</span>
                <span className="form-label-tag">10 Characters</span>
              </label>
              <input
                id="pan"
                type="text"
                className="form-input"
                placeholder="ABCDE1234F"
                style={{ textTransform: 'uppercase' }}
                value={formData.pan}
                onChange={handlePanChange}
              />
              {errors.pan && <div className="form-error-msg"><AlertCircle size={13} />{errors.pan}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {/* 6. MAIL ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <span>MAIL ID *</span>
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
              />
              {errors.email && <div className="form-error-msg"><AlertCircle size={13} />{errors.email}</div>}
            </div>

            {/* 7. PHONE NUMBER */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                <span>PHONE NUMBER *</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="10-digit phone number"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
              />
              {errors.phone && <div className="form-error-msg"><AlertCircle size={13} />{errors.phone}</div>}
            </div>
          </div>

          {/* 9. OCCUPATION */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="occupation">
              <span>OCCUPATION *</span>
            </label>
            <input
              id="occupation"
              type="text"
              className="form-input"
              placeholder="e.g. Student, Sound Engineer, Software Engineer"
              value={formData.occupation}
              onChange={(e) => {
                setFormData({ ...formData, occupation: e.target.value });
                if (errors.occupation) setErrors({ ...errors, occupation: '' });
              }}
            />
            {errors.occupation && <div className="form-error-msg"><AlertCircle size={13} />{errors.occupation}</div>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ fontSize: '15px', padding: '14px' }}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>{isSubmitting ? 'Submitting...' : 'Submit Details & View Receipt'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#64748b',
          fontSize: '11px'
        }}>
          <Lock size={12} style={{ color: '#15803d' }} />
          <span>Your information is encrypted and stored securely.</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
