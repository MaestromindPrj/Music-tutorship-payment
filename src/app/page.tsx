'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Sparkles,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { COURSES, getCourseById } from '@/lib/courses';
import { getPricing } from '@/lib/pricing';
import AuthModal from '@/components/AuthModal';

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

  const [selectedCourseId, setSelectedCourseId] = useState<string>('producer-transformation');

  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; hasPaidConsultation: boolean } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authActionPrompt, setAuthActionPrompt] = useState<string>('');

  const [studentName, setStudentName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const statusParam = searchParams.get('status');
  const errorParam = searchParams.get('error');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      try {
        const stored = localStorage.getItem('mt_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          if (parsed.email) {
            setEmail(parsed.email);
            if (parsed.name && !studentName) {
              setStudentName(parsed.name);
            }

            try {
              const res = await fetch(`/api/auth/consultation-status?email=${encodeURIComponent(parsed.email)}`);
              const data = await res.json();
              if (data.hasPaidConsultation !== parsed.hasPaidConsultation) {
                const updated = { ...parsed, hasPaidConsultation: !!data.hasPaidConsultation };
                setCurrentUser(updated);
                localStorage.setItem('mt_user', JSON.stringify(updated));
              }
            } catch (e) {
            }
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
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

  const pricing = getPricing();
  const selectedCourse = getCourseById(selectedCourseId) || COURSES[0];
  const isProducerCourse = selectedCourseId === 'producer-transformation' || selectedCourseId === 'bootcamp';
  const hasConsultationCredit = isProducerCourse && !!currentUser?.hasPaidConsultation;

  const rawBaseFee = selectedCourse.price;
  const effectiveBaseFee = hasConsultationCredit ? pricing.courseDiscountedPrice : rawBaseFee;

  const isConsultationSelected = selectedCourseId === 'call-consultation';
  const taxAmount = isConsultationSelected ? 0 : Math.round(effectiveBaseFee * 0.18);
  const totalPayable = effectiveBaseFee + taxAmount;

  useEffect(() => {
    if (currentUser?.hasPaidConsultation && selectedCourseId === 'call-consultation') {
      setSelectedCourseId('producer-transformation');
    }
  }, [currentUser?.hasPaidConsultation, selectedCourseId]);

  const handleCourseSelect = (courseId: string) => {
    const course = COURSES.find((c) => c.id === courseId);
    if (course?.disabled) return;
    if (courseId === 'call-consultation' && currentUser?.hasPaidConsultation) return;
    setSelectedCourseId(courseId);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentUser) {
      setAuthActionPrompt('Email login is mandatory to proceed with fee payment. Please log in or sign up to continue.');
      setIsAuthModalOpen(true);
      return;
    }

    if (!termsAccepted) {
      setFormError('Please accept the Terms & Conditions to proceed.');
      return;
    }

    if (!studentName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    const userEmail = (currentUser.email || email).trim().toLowerCase();
    if (!userEmail || !userEmail.includes('@')) {
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
          email: userEmail,
          phone: cleanPhone,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.formData) {
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

  const calendlyDirectUrl = currentUser?.email
    ? `https://calendly.com/musictutorship/new-meeting?name=${encodeURIComponent(currentUser.name || '')}&email=${encodeURIComponent(currentUser.email)}`
    : 'https://calendly.com/musictutorship/new-meeting';

  const faqs = [
    {
      q: 'Which payment methods are accepted?',
      a: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit Cards (Visa, MasterCard, RuPay), Debit Cards, and NetBanking across all major Indian banks.'
    },
    {
      q: 'What happens after completing Discovery Call payment?',
      a: `Schedule immediately via Calendly upon payment. If you decide to join the Producer Transformation Path, the ${pricing.creditText} Discovery Call fee will be deducted from the course fee.`
    },
    {
      q: `How does the ${pricing.creditText} Discovery Call credit work?`,
      a: `When you log in with the email used for your Discovery Call, the Producer Transformation Path program fee automatically reduces from ${pricing.coursePriceText} to ${pricing.courseDiscountedText} (+ 18% tax), giving you full credit for your consultation fee.`
    },
    {
      q: 'What happens after completing the course fee payment?',
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

      {currentUser?.hasPaidConsultation && (
        <div style={{
          backgroundColor: '#fefbf3',
          borderBottom: '1px solid #fde68a',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '13px',
          color: '#854d0e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: '#b8871b', flexShrink: 0 }} />
            <span>
              <strong>Discovery Call Paid:</strong> Please book your slot in Calendly to complete scheduling.
            </span>
          </div>

          <a
            href={calendlyDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#b8871b',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              textDecoration: 'none',
              borderRadius: '0px'
            }}
          >
            <Calendar size={13} />
            <span>Book Slot on Calendly</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

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
            Select your enrolled program or consultation below to proceed to secure fee payment and student registration.
          </p>
        </div>
      </section>

      <section className="container" id="checkout-section">
        <div className="steps-nav">
          <div className="step-item active">
            <div className="step-number">1</div>
            <span className="btn-text-full">Select Program / Option</span>
            <span className="btn-text-mobile">Program</span>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <span className="btn-text-full">Payment</span>
            <span className="btn-text-mobile">Payment</span>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <span className="btn-text-full">Student KYC Details</span>
            <span className="btn-text-mobile">KYC Details</span>
          </div>
          <div className="step-item">
            <div className="step-number">4</div>
            <span className="btn-text-full">Confirmation Receipt</span>
            <span className="btn-text-mobile">Receipt</span>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Select Your Program or Consultation
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                2 Available Options
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {COURSES.map((course) => {
                const isSelected = selectedCourseId === course.id;
                const isCallConsultation = course.id === 'call-consultation';
                const hasPaidConsultation = !!currentUser?.hasPaidConsultation;
                const isDisabled = !!course.disabled || (isCallConsultation && hasPaidConsultation);
                const isCourseProducer = course.id === 'producer-transformation' || course.id === 'bootcamp';
                const hasCredit = isCourseProducer && hasPaidConsultation;

                return (
                  <div
                    key={course.id}
                    onClick={() => !isDisabled && handleCourseSelect(course.id)}
                    className="clean-card course-selection-card"
                    style={{
                      padding: '24px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled && !isCallConsultation ? 0.6 : 1,
                      border: isSelected
                        ? '2px solid #e2b13c'
                        : isCallConsultation && hasPaidConsultation
                        ? '1.5px solid #e2b13c'
                        : isDisabled
                        ? '1px dashed #cbd5e1'
                        : '1px solid #e2e8f0',
                      backgroundColor: isSelected
                        ? '#fefbf3'
                        : isCallConsultation && hasPaidConsultation
                        ? '#ffffff'
                        : isDisabled
                        ? '#f8fafc'
                        : '#ffffff',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isDisabled && !isCallConsultation ? '#94a3b8' : '#b8871b',
                        letterSpacing: '0.5px'
                      }}>
                        {course.tag}
                      </div>

                      {course.badge && (
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '0px',
                          backgroundColor: isCallConsultation && hasPaidConsultation
                            ? 'rgba(21, 128, 61, 0.12)'
                            : isDisabled
                            ? 'rgba(100, 116, 139, 0.12)'
                            : course.popular
                            ? 'rgba(226, 177, 60, 0.15)'
                            : 'rgba(15, 23, 42, 0.06)',
                          color: isCallConsultation && hasPaidConsultation
                            ? '#15803d'
                            : isDisabled
                            ? '#64748b'
                            : course.popular
                            ? '#b8871b'
                            : '#334155',
                          border: 'none',
                          letterSpacing: '0.5px'
                        }}>
                          {isCallConsultation && hasPaidConsultation ? 'PAID & CONFIRMED' : course.badge}
                        </div>
                      )}
                    </div>

                    <h3 className="course-card-title" style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      color: isDisabled && !isCallConsultation ? '#475569' : '#0f172a',
                      marginBottom: '2px'
                    }}>
                      {course.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                      {course.subtitle ? `${course.subtitle} • ${course.duration}` : course.duration}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: course.id === 'call-consultation' ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      {course.features.slice(0, 5).map((feat, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '7px',
                          fontSize: '12px',
                          color: isDisabled && !isCallConsultation ? '#64748b' : '#334155'
                        }}>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '0px',
                            backgroundColor: isDisabled && !isCallConsultation ? '#94a3b8' : '#e2b13c',
                            marginTop: '6px',
                            flexShrink: 0
                          }} />
                          <span style={{ lineHeight: 1.45 }}>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '14px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                          {hasCredit ? (
                            <>
                              <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                {pricing.courseDiscountedText}
                              </span>
                              <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                {pricing.coursePriceText}
                              </span>
                              {course.originalPrice && (
                                <span style={{ fontSize: '12px', color: '#cbd5e1', textDecoration: 'line-through' }}>
                                  ₹{course.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: '22px', fontWeight: 800, color: isDisabled && !isCallConsultation ? '#64748b' : '#0f172a' }}>
                                ₹{course.price.toLocaleString('en-IN')}
                              </span>
                              {course.originalPrice && (
                                <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                  ₹{course.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </>
                          )}

                          {course.id === 'call-consultation' ? (
                            <span style={{
                              fontSize: '11px',
                              color: '#15803d',
                              fontWeight: 600,
                              backgroundColor: 'rgba(21, 128, 61, 0.12)',
                              padding: '3px 7px'
                            }}>
                              No Tax
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              color: '#b8871b',
                              fontWeight: 600,
                              backgroundColor: 'rgba(226, 177, 60, 0.12)',
                              padding: '3px 7px'
                            }}>
                              + Taxes apply additionally
                            </span>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDisabled && !isCallConsultation ? '#94a3b8' : isSelected ? '#000000' : '#64748b'
                        }}>
                          {isCallConsultation && hasPaidConsultation ? (
                            <span style={{
                              fontSize: '11px',
                              color: '#15803d',
                              fontWeight: 700,
                              padding: '3px 8px',
                              backgroundColor: 'rgba(21, 128, 61, 0.10)',
                              borderRadius: '0px'
                            }}>
                              ✓ Paid
                            </span>
                          ) : isDisabled ? (
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

                      {isCallConsultation && hasPaidConsultation && (
                        <div style={{
                          marginTop: '14px',
                          padding: '12px 14px',
                          backgroundColor: '#fefbf3',
                          border: '1.5px solid #e2b13c',
                          borderRadius: '0px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={16} style={{ color: '#15803d', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                Discovery Call Paid
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                Please book your slot in Calendly
                              </div>
                            </div>
                          </div>

                          <a
                            href={calendlyDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#b8871b',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12px',
                              textDecoration: 'none',
                              borderRadius: '0px'
                            }}
                          >
                            <Calendar size={13} />
                            <span>Book Slot on Calendly</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="clean-card checkout-sticky-card" style={{ padding: '28px', position: 'sticky', top: '90px' }}>
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

                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    <span>Email Address *</span>
                    <span className="form-label-tag">
                      {currentUser ? 'Verified Account' : 'Mandatory Login'}
                    </span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="name@example.com"
                    value={currentUser?.email || email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!currentUser}
                    style={{ backgroundColor: currentUser ? '#f8fafc' : '#ffffff' }}
                  />
                </div>

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

                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0px',
                  padding: '16px',
                  margin: '18px 0 14px 0',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
                    <span>{selectedCourse.title} Base Fee:</span>
                    <span>₹{rawBaseFee.toLocaleString('en-IN')}</span>
                  </div>

                  {hasConsultationCredit && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#15803d',
                      marginBottom: '8px',
                      fontWeight: 600,
                      backgroundColor: 'rgba(21, 128, 61, 0.08)',
                      padding: '4px 8px'
                    }}>
                      <span>Discovery Call Credit Paid:</span>
                      <span>-{pricing.creditText}</span>
                    </div>
                  )}

                  {hasConsultationCredit && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
                      <span>Adjusted Subtotal:</span>
                      <span>₹{effectiveBaseFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', marginBottom: '8px' }}>
                    <span>{isConsultationSelected ? 'Tax:' : 'Additional Tax (18% GST):'}</span>
                    <span style={{ fontWeight: 600, color: isConsultationSelected ? '#15803d' : '#b8871b' }}>
                      {isConsultationSelected ? '₹0 (No Tax)' : `+₹${taxAmount.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '10px',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#0f172a'
                  }}>
                    <span>Total Payable:</span>
                    <span style={{ color: '#000000', fontSize: '20px', fontWeight: 800 }}>
                      ₹{totalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

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
                      By accepting you agree to the{' '}
                      <a
                        href="https://www.musictutorship.in/terms-of-services"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#0f172a',
                          fontWeight: 700,
                          textDecoration: 'underline'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Terms &amp; Conditions
                      </a>
                      , Enrollment Policy, and Code of Conduct *
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    fontSize: '14px',
                    padding: '14px',
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Connecting...'
                      : !currentUser
                      ? 'Log In to Proceed to Payment'
                      : `Proceed to Payment (₹${totalPayable.toLocaleString('en-IN')})`}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </form>

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
                <span>Guaranteed safe &amp; secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '48px 24px 16px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="section-overline">QUESTIONS &amp; ANSWERS</span>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionPrompt={authActionPrompt}
        onSuccess={(user) => {
          setCurrentUser(user);
          setEmail(user.email);
          if (user.name && !studentName) {
            setStudentName(user.name);
          }
        }}
      />
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
