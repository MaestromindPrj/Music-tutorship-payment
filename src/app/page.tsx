'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { COURSES, getCourseById } from '@/lib/courses';

function getFriendlyErrorMessage(rawError?: string | null): string {
  if (!rawError) {
    return 'Payment was not completed. Please try again.';
  }
  const lower = rawError.toLowerCase();

  if (
    lower.includes('cancel') ||
    lower.includes('cancelled') ||
    lower.includes('closed') ||
    lower.includes('aborted') ||
    lower.includes('back button')
  ) {
    return 'Payment was cancelled. You can retry anytime whenever you are ready.';
  }
  if (
    lower.includes('decline') ||
    lower.includes('insufficient') ||
    lower.includes('do not honor') ||
    lower.includes('limit') ||
    lower.includes('card')
  ) {
    return 'Payment was declined by the bank. Please try again or use another payment method.';
  }
  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('expired') ||
    lower.includes('session')
  ) {
    return 'Payment session expired. Please initiate a new transaction.';
  }
  if (
    lower.includes('otp') ||
    lower.includes('auth') ||
    lower.includes('authentication')
  ) {
    return 'Authentication failed. Please verify your OTP or bank security details and try again.';
  }
  if (
    lower.includes('network') ||
    lower.includes('connection') ||
    lower.includes('gateway')
  ) {
    return 'Unable to establish a secure connection with the bank gateway. Please try again.';
  }
  if (
    lower.includes('customer') ||
    lower.includes('error_message') ||
    lower.includes('txnid')
  ) {
    return 'Payment could not be completed. Please try again.';
  }

  return rawError.length > 80
    ? 'Payment was not completed. Please try again.'
    : rawError;
}

function HomeContent() {
  const searchParams = useSearchParams();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('bootcamp');

  // Student initial checkout info
  const [studentName, setStudentName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Status notification if returning from failed payment
  const statusParam = searchParams.get('status');
  const errorParam = searchParams.get('error');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const selectedCourse = getCourseById(selectedCourseId) || COURSES[1] || COURSES[0];
  const payableAmount = selectedCourse.price;

  const handleCourseSelect = (courseId: string) => {
    const course = COURSES.find((c) => c.id === courseId);
    if (course?.disabled) return;
    setSelectedCourseId(courseId);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!termsAccepted) {
      setFormError('Please accept the Terms & Conditions to proceed.');
      return;
    }

    if (!studentName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/payu/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          studentName: studentName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.formData) {
        // Submit directly to PayU live production payment gateway
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.formData.actionUrl || 'https://secure.payu.in/_payment';
        
        Object.entries(data.formData).forEach(([key, val]) => {
          if (key !== 'actionUrl' && val !== undefined && val !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(val);
            form.appendChild(input);
          }
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        setIsSubmitting(false);
        setFormError(data.error || 'Failed to initiate secure checkout session.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || 'Connection error. Please try again.');
    }
  };

  const faqs = [
    {
      q: 'Which payment methods are accepted?',
      a: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit Cards (Visa, MasterCard, RuPay), Debit Cards, and NetBanking across all major Indian banks.'
    },
    {
      q: 'What happens after completing the payment?',
      a: 'Upon payment confirmation, you will be directed to complete your student registration details (Name, DOB, Address, Identification, etc.) to receive your official admission receipt and WhatsApp onboarding link.'
    },
    {
      q: 'Is my payment secure?',
      a: 'Yes. All payments are processed through secure, encrypted checkout. Your payment details are processed directly by certified payment networks and are never stored on our servers.'
    },
    {
      q: 'Will I receive an official invoice and admission receipt?',
      a: 'Yes. Instantly after payment and registration, you will receive an official admission receipt with your unique Order ID, downloadable and printable for your records.'
    }
  ];

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Alert Banner for Payment Failure */}
      {(statusParam === 'failed' || statusParam === 'error') && (
        <div style={{
          backgroundColor: 'rgba(185, 28, 28, 0.08)',
          border: 'none',
          padding: '14px 24px',
          textAlign: 'center',
          color: '#991b1b',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{getFriendlyErrorMessage(errorParam)}</span>
        </div>
      )}

      {/* Hero Section */}
      <section style={{ padding: '40px 0 24px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <span className="section-overline">
              OFFICIAL ENROLLMENT & PAYMENT PORTAL
            </span>
          </div>

          <h1 className="section-title" style={{ maxWidth: '800px', margin: '0 auto 12px auto' }}>
            Music Tutorship Course Fee Payment
          </h1>

          <p className="section-desc" style={{ margin: '0 auto 8px auto', maxWidth: '640px' }}>
            Select your enrolled program below to proceed to secure fee payment and student registration.
          </p>
        </div>
      </section>

      {/* Main Payment Section: Course Selector + Checkout Form */}
      <section className="container" id="checkout-section">
        {/* Step Indicator */}
        <div className="steps-nav">
          <div className="step-item active">
            <div className="step-number">1</div>
            <span>Select Program</span>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <span>Payment</span>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <span>Student KYC Details</span>
          </div>
          <div className="step-item">
            <div className="step-number">4</div>
            <span>Confirmation Receipt</span>
          </div>
        </div>

        <div className="grid-2">
          {/* Left Column: Course Selection Cards */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Select Your Program
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {COURSES.map((course) => {
                const isSelected = selectedCourseId === course.id;
                const isDisabled = !!course.disabled;

                return (
                  <div
                    key={course.id}
                    onClick={() => !isDisabled && handleCourseSelect(course.id)}
                    className="clean-card"
                    style={{
                      padding: '20px 24px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1,
                      border: isSelected
                        ? '2px solid #e2b13c'
                        : isDisabled
                        ? '1px dashed #cbd5e1'
                        : '1px solid #e2e8f0',
                      backgroundColor: isSelected
                        ? '#fefbf3'
                        : isDisabled
                        ? '#f8fafc'
                        : '#ffffff',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    }}
                  >
                    {/* Badge */}
                    {course.badge && (
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '0px',
                        backgroundColor: isDisabled
                          ? 'rgba(100, 116, 139, 0.12)'
                          : course.popular
                          ? 'rgba(226, 177, 60, 0.15)'
                          : 'rgba(15, 23, 42, 0.06)',
                        color: isDisabled
                          ? '#64748b'
                          : course.popular
                          ? '#b8871b'
                          : '#334155',
                        border: 'none',
                        letterSpacing: '0.5px'
                      }}>
                        {course.badge}
                      </div>
                    )}

                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isDisabled ? '#94a3b8' : '#b8871b',
                      letterSpacing: '0.5px',
                      marginBottom: '4px'
                    }}>
                      {course.tag}
                    </div>

                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: isDisabled ? '#475569' : '#0f172a',
                      marginBottom: '2px',
                      paddingRight: '110px'
                    }}>
                      {course.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                      {course.subtitle} • {course.duration}
                    </p>

                    {/* Features list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', marginBottom: '14px' }}>
                      {course.features.slice(0, 4).map((feat, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: isDisabled ? '#64748b' : '#334155'
                        }}>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '0px',
                            backgroundColor: isDisabled ? '#94a3b8' : '#e2b13c'
                          }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price, Terms Text, and Radio Indicator */}
                    <div style={{
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: isDisabled ? '#64748b' : '#0f172a' }}>
                            ₹{course.price.toLocaleString('en-IN')}
                          </span>
                          {course.originalPrice && (
                            <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{course.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                            All-Inclusive
                          </span>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDisabled ? '#94a3b8' : isSelected ? '#000000' : '#64748b'
                        }}>
                          {isDisabled ? (
                            <span style={{
                              fontSize: '11px',
                              color: '#64748b',
                              fontWeight: 600,
                              padding: '2px 8px',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '0px'
                            }}>
                              Unselectable
                            </span>
                          ) : (
                            <>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: isSelected ? '5px solid #e2b13c' : '1.5px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                boxSizing: 'border-box',
                                flexShrink: 0
                              }} />
                              <span>{isSelected ? 'Selected' : 'Select'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* *Terms & Conditions applied for all courses */}
                      <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontStyle: 'italic',
                        marginTop: '6px'
                      }}>
                        *Terms & Conditions applied
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout Form */}
          <div>
            <div className="clean-card" style={{ padding: '28px', position: 'sticky', top: '90px' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
                <span className="section-overline">SECURE CHECKOUT</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  Enrollment Summary
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {selectedCourse.title}
                </p>
              </div>

              {formError && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(185, 28, 28, 0.08)',
                  border: 'none',
                  borderRadius: '0px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCheckout}>
                {/* Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="studentName">
                    <span>Student Full Name *</span>
                  </label>
                  <input
                    id="studentName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Enter full legal name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    <span>Email Address *</span>
                    <span className="form-label-tag">For Receipt & LMS</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    <span>Phone Number (WhatsApp) *</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="form-input"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Fee Breakdown Card */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0px',
                  padding: '14px',
                  margin: '18px 0 14px 0',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '6px' }}>
                    <span>Course Subtotal:</span>
                    <span>₹{payableAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '6px' }}>
                    <span>Taxes & Processing:</span>
                    <span style={{ color: '#15803d' }}>Included (₹0 Extra)</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '8px',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#0f172a'
                  }}>
                    <span>Total Payable:</span>
                    <span style={{ color: '#000000', fontSize: '18px', fontWeight: 800 }}>
                      ₹{payableAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div style={{
                  margin: '14px 0 16px 0',
                  padding: '12px 14px',
                  backgroundColor: termsAccepted ? 'rgba(21, 128, 61, 0.04)' : '#f8fafc',
                  border: termsAccepted ? '1px solid rgba(21, 128, 61, 0.3)' : '1px solid #e2e8f0',
                  borderRadius: '0px',
                  transition: 'all 0.2s ease'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#334155',
                    lineHeight: 1.45,
                    userSelect: 'none'
                  }}>
                    <input
                      id="termsCheckbox"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (formError && !termsAccepted) setFormError('');
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        marginTop: '1px',
                        accentColor: '#0f172a',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    />
                    <span>
                      By accepting you agree to the <strong>Terms & Conditions</strong>, Enrollment Policy, and Code of Conduct *
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!termsAccepted || isSubmitting}
                  className="btn-primary"
                  style={{
                    fontSize: '14px',
                    padding: '14px',
                    opacity: (!termsAccepted || isSubmitting) ? 0.5 : 1,
                    cursor: (!termsAccepted || isSubmitting) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  )}
                  <span>{isSubmitting ? 'Connecting...' : `Proceed to Payment (₹${payableAmount.toLocaleString('en-IN')})`}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Security Trust Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#71717a',
                fontSize: '12px',
                fontWeight: 500,
                marginTop: '16px'
              }}>
                <Lock size={13} strokeWidth={2.2} style={{ color: '#71717a' }} />
                <span>Guaranteed safe & secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container" style={{ padding: '48px 24px 16px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="section-overline">QUESTIONS & ANSWERS</span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="clean-card"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                      {faq.q}
                    </h3>
                    <div style={{ color: '#64748b', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                  {isOpen && (
                    <p style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
