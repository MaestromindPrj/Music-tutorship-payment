'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Music,
  Star,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { COURSES, getCourseById } from '@/lib/courses';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('mastery');

  // Student initial checkout info
  const [studentName, setStudentName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Status notification if returning from failed payment
  const statusParam = searchParams.get('status');
  const errorParam = searchParams.get('error');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const selectedCourse = getCourseById(selectedCourseId) || COURSES[0];
  const payableAmount = selectedCourse.price;

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

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
          if (key !== 'actionUrl' && key !== 'isMock' && val !== undefined && val !== null) {
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
      a: 'Yes. Instantly after payment and registration, you will receive an official admission receipt with your unique Order ID, downloadable for your records.'
    }
  ];

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Alert Banner for Payment Failure */}
      {statusParam === 'failed' && (
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
          <span>
            Payment was not completed: <strong>{errorParam || 'Declined by bank'}</strong>. Please try again.
          </span>
        </div>
      )}

      {/* Hero Section */}
      <section style={{ padding: '48px 0 32px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <span className="section-overline">
              OFFICIAL ENROLLMENT PORTAL
            </span>
          </div>

          <h1 className="section-title" style={{ maxWidth: '800px', margin: '0 auto 14px auto' }}>
            Music Tutorship Course Enrollment & Payments
          </h1>

          <p className="section-desc" style={{ margin: '0 auto 28px auto' }}>
            Learn music production from mentor Vijay. Complete your fee payment with instant receipt and batch onboarding.
          </p>

          {/* Quick Stats Bar */}
          <div className="stats-bar" style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px 24px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '10px 24px',
            borderRadius: '0px',
            marginBottom: '36px',
            maxWidth: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={15} color="#000000" strokeWidth={2} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>4.9/5</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Rating</span>
            </div>
            <div className="stat-divider" style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} style={{ color: '#000000' }} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>300+</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Students</span>
            </div>
            <div className="stat-divider" style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={15} style={{ color: '#000000' }} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>60M+</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Streams</span>
            </div>
          </div>
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
                return (
                  <div
                    key={course.id}
                    onClick={() => handleCourseSelect(course.id)}
                    className="clean-card"
                    style={{
                      padding: '20px 24px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #e2b13c' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#fefbf3' : '#ffffff',
                      position: 'relative'
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
                        backgroundColor: course.popular ? 'rgba(226, 177, 60, 0.15)' : 'rgba(15, 23, 42, 0.06)',
                        color: course.popular ? '#b8871b' : '#334155',
                        border: 'none',
                        letterSpacing: '0.5px'
                      }}>
                        {course.badge}
                      </div>
                    )}

                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8871b', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      {course.tag}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '2px', paddingRight: '80px' }}>
                      {course.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                      {course.subtitle} • {course.duration}
                    </p>

                    {/* Features list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', marginBottom: '14px' }}>
                      {course.features.slice(0, 4).map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                          <div style={{ width: '4px', height: '4px', borderRadius: '0px', backgroundColor: '#e2b13c' }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price and Radio Indicator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                          ₹{course.price.toLocaleString('en-IN')}
                        </span>
                        {course.originalPrice && (
                          <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            ₹{course.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>All-Inclusive</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isSelected ? '#000000' : '#64748b'
                      }}>
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
                  margin: '18px 0 18px 0',
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ fontSize: '14px', padding: '14px' }}
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

      {/* Meet Your Mentor Spotlight Section */}
      <section id="mentor-section" style={{ padding: '60px 0 40px 0', borderTop: '1px solid #e2e8f0', marginTop: '60px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            {/* Mentor Image */}
            <div style={{ position: 'relative', maxWidth: '380px', margin: '0 auto' }}>
              <div style={{
                borderRadius: '0px',
                overflow: 'hidden',
                border: '1px solid #cbd5e1'
              }}>
                <Image
                  src="/images/mentor.jpeg"
                  alt="Mentor Vijay"
                  width={380}
                  height={380}
                  style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Mentor Bio */}
            <div>
              <span className="section-overline">EXPERT GUIDANCE FOR YOUR JOURNEY</span>
              <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                Meet Your Mentor, <span style={{ color: '#e2b13c' }}>Vijay</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                With over a decade of experience in music production, I&apos;ve dedicated my career to helping aspiring musicians unlock their creative potential. My journey spans working with renowned artists, producing tracks that have reached millions, and mentoring hundreds of students who&apos;ve built successful music careers.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="clean-card" style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#e2b13c' }}>10+</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Years Exp</div>
                </div>
                <div className="clean-card" style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#e2b13c' }}>300+</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Students</div>
                </div>
                <div className="clean-card" style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>60M+</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Streams</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container" style={{ padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="section-overline">GRADUATE FEEDBACK</span>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Hear from Our Students</h2>
        </div>

        <div className="grid-3">
          <div className="clean-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '3px', color: '#d97706', marginBottom: '10px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#d97706" />)}
            </div>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>
              &ldquo;I’ve already started producing my tracks with more confidence and Mr. Vijay gave us excellent mentoring from how to structure the composition to producing it.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fef9ee', color: '#b8871b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>E</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Ela Maran</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Batch 2B Graduate</div>
              </div>
            </div>
          </div>

          <div className="clean-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '3px', color: '#d97706', marginBottom: '10px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#d97706" />)}
            </div>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>
              &ldquo;Being a businessman with a deep passion for music, Vijay helped me out with all the music production essentials and he guided me on the right path.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fef9ee', color: '#b8871b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>F</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Fredrick</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Batch 2B Graduate</div>
              </div>
            </div>
          </div>

          <div className="clean-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '3px', color: '#d97706', marginBottom: '10px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#d97706" />)}
            </div>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>
              &ldquo;We had a most interesting learning experience in Music tutorship under guidance of Vijay sir. He gave us a proper roadmap customised for our goals.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fef9ee', color: '#b8871b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>S</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Sarwina</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Personalised Mentorship</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container" style={{ padding: '32px 24px' }}>
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
