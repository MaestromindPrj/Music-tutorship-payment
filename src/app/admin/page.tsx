'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Download,
  RefreshCw,
  LogOut,
  Database,
  Eye,
  EyeOff,
  CreditCard,
  FileText,
  Users,
  Copy,
  Check,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { PaymentRecord, StudentRegistration } from '@/types';

interface PaymentWithReg extends PaymentRecord {
  registration?: StudentRegistration | null;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  hasPaidConsultation: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface AdminStats {
  totalRevenue: number;
  totalPayments: number;
  successPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalUsers: number;
  totalRegistrations: number;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard data state
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [neonConnected, setNeonConnected] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    totalPayments: 0,
    successPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalUsers: 0,
    totalRegistrations: 0
  });
  const [payments, setPayments] = useState<PaymentWithReg[]>([]);
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);

  // Navigation & filter state
  const [activeTab, setActiveTab] = useState<'payments' | 'registrations' | 'users' | 'neon'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COURSE' | 'CONSULTATION'>('ALL');

  // Modal state for student details view
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<{
    payment: PaymentWithReg;
    registration?: StudentRegistration | null;
  } | null>(null);

  // DB initialization status
  const [isInitializingDb, setIsInitializingDb] = useState(false);
  const [initDbResult, setInitDbResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Real-time auto-refresh every 5 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setAdminEmail(data.email || 'admin@musictutorship.in');
        fetchDashboardData();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      setIsLoggingIn(false);

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminEmail(data.user?.email || loginEmail);
        fetchDashboardData();
      } else {
        setLoginError(data.error || 'Invalid credentials. Please verify and try again.');
      }
    } catch (err: any) {
      setIsLoggingIn(false);
      setLoginError(err?.message || 'Connection error. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setPayments([]);
    setRegistrations([]);
    setUsers([]);
  };

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/admin/data');
      if (res.ok) {
        const data = await res.json();
        setNeonConnected(Boolean(data.neonConnected));
        if (data.stats) setStats(data.stats);
        if (data.payments) setPayments(data.payments);
        if (data.registrations) setRegistrations(data.registrations);
        if (data.users) setUsers(data.users);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInitDb = async () => {
    setIsInitializingDb(true);
    setInitDbResult(null);
    try {
      const res = await fetch('/api/admin/init-db', { method: 'POST' });
      const data = await res.json();
      setInitDbResult({
        success: data.success,
        message: data.message || (data.success ? 'Tables verified/initialized.' : data.error || 'Initialization failed.')
      });
      if (data.success) {
        fetchDashboardData();
      }
    } catch (err: any) {
      setInitDbResult({ success: false, message: err?.message || 'Failed to initialize database.' });
    } finally {
      setIsInitializingDb(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      const isCall =
        p.courseId === 'call-consultation' ||
        p.courseName?.toLowerCase().includes('consultation');
      if (typeFilter === 'CONSULTATION' && !isCall) return false;
      if (typeFilter === 'COURSE' && isCall) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTxnid = p.txnid?.toLowerCase().includes(term);
        const matchName = p.studentName?.toLowerCase().includes(term);
        const matchEmail = p.email?.toLowerCase().includes(term);
        const matchPhone = p.phone?.toLowerCase().includes(term);
        const matchCourse = p.courseName?.toLowerCase().includes(term);
        const matchRegName = p.registration?.fullName?.toLowerCase().includes(term);
        return matchTxnid || matchName || matchEmail || matchPhone || matchCourse || matchRegName;
      }

      return true;
    });
  }, [payments, statusFilter, typeFilter, searchTerm]);

  // Filtered Registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTxnid = r.txnid?.toLowerCase().includes(term);
        const matchName = r.fullName?.toLowerCase().includes(term);
        const matchEmail = r.email?.toLowerCase().includes(term);
        const matchPhone = r.phone?.toLowerCase().includes(term);
        const matchPan = r.pan?.toLowerCase().includes(term);
        const matchAadhar = r.aadharCard?.toLowerCase().includes(term);
        const matchOcc = r.occupation?.toLowerCase().includes(term);
        return matchTxnid || matchName || matchEmail || matchPhone || matchPan || matchAadhar || matchOcc;
      }
      return true;
    });
  }, [registrations, searchTerm]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(term);
        const matchEmail = u.email?.toLowerCase().includes(term);
        return matchName || matchEmail;
      }
      return true;
    });
  }, [users, searchTerm]);

  // Export functions to CSV
  const exportPaymentsToCSV = () => {
    const headers = [
      'Transaction ID',
      'Student Name',
      'Email',
      'Phone',
      'Course/Call',
      'Amount (INR)',
      'Status',
      'PayU ID',
      'Mode',
      'KYC Status',
      'KYC Full Name',
      'KYC Phone',
      'KYC Email',
      'KYC DOB',
      'KYC Gender',
      'KYC Address',
      'KYC Aadhar',
      'KYC PAN',
      'KYC Occupation',
      'Date'
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.txnid}"`,
      `"${p.studentName || ''}"`,
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.courseName || ''}"`,
      p.amount,
      `"${p.status}"`,
      `"${p.payuId || ''}"`,
      `"${p.mode || ''}"`,
      `"${p.registration ? 'COMPLETED' : 'PENDING'}"`,
      `"${p.registration?.fullName || ''}"`,
      `"${p.registration?.phone || ''}"`,
      `"${p.registration?.email || ''}"`,
      `"${p.registration?.dob || ''}"`,
      `"${p.registration?.gender || ''}"`,
      `"${(p.registration?.address || '').replace(/"/g, '""')}"`,
      `"${p.registration?.aadharCard || ''}"`,
      `"${p.registration?.pan || ''}"`,
      `"${p.registration?.occupation || ''}"`,
      `"${p.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `musictutorship_payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRegistrationsToCSV = () => {
    const headers = [
      'Transaction ID',
      'Full Name',
      'DOB',
      'Gender',
      'Email',
      'Phone',
      'Aadhar Card',
      'PAN',
      'Address',
      'Occupation',
      'Submitted At'
    ];

    const rows = filteredRegistrations.map((r) => [
      `"${r.txnid}"`,
      `"${r.fullName}"`,
      `"${r.dob}"`,
      `"${r.gender}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.aadharCard}"`,
      `"${r.pan}"`,
      `"${(r.address || '').replace(/"/g, '""')}"`,
      `"${r.occupation}"`,
      `"${r.submittedAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `musictutorship_kyc_details_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersToCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Consultation Credit Paid', 'Joined Date', 'Last Login'];
    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.name}"`,
      `"${u.email}"`,
      u.hasPaidConsultation ? 'YES (₹10k credit)' : 'NO',
      `"${u.createdAt}"`,
      `"${u.lastLoginAt || u.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `musictutorship_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state during initial session check
  if (isAuthenticated === null) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Loader2 size={32} style={{ color: '#000000', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Verifying Admin Authentication...</h2>
      </div>
    );
  }

  // =========================================================================
  // Screen 1: Admin Login Screen (Matches User Design System)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '48px 24px 80px 24px', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="section-overline">
            SECURE ACCESS
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            Admin Portal Login
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Sign in to manage payments, enrollments, and student KYC registrations.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '32px' }}>
          {loginError && (
            <div style={{
              backgroundColor: 'rgba(185, 28, 28, 0.08)',
              border: '1px solid #fca5a5',
              padding: '12px 14px',
              marginBottom: '20px',
              color: '#b91c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" htmlFor="adminEmail">
                <span>ADMIN MAIL ID *</span>
              </label>
              <input
                id="adminEmail"
                type="email"
                required
                className="form-input"
                placeholder="admin@musictutorship.in"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="adminPassword">
                <span>ADMIN PASSWORD *</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isLoggingIn ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Lock size={15} />
              )}
              <span>{isLoggingIn ? 'AUTHENTICATING...' : 'SIGN IN TO ADMIN PORTAL'}</span>
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#64748b',
            lineHeight: 1.5,
            textAlign: 'center'
          }}>
            Default Admin Login: <strong style={{ color: '#0f172a' }}>admin@musictutorship.in</strong> / Password: <strong style={{ color: '#0f172a' }}>Admin@MusicTutorship2025</strong>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Screen 2: Authenticated Admin Dashboard (Matches User Design System)
  // =========================================================================
  return (
    <div className="container" style={{ padding: '32px 24px 80px 24px', maxWidth: '1240px' }}>
      {/* Admin Top Action Header (Clean User-Facing Style) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div>
          <span className="section-overline">
            ADMINISTRATION PORTAL
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
            Payments & Enrollment Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Live sync with Neon PostgreSQL database • payments.musictutorship.in
          </p>
        </div>

        {/* Top Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Database indicator */}
          <button
            onClick={() => setActiveTab('neon')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '0px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: neonConnected ? 'rgba(21, 128, 61, 0.08)' : 'rgba(234, 179, 8, 0.12)',
              color: neonConnected ? '#15803d' : '#854d0e',
              border: `1px solid ${neonConnected ? '#bbf7d0' : '#fde68a'}`,
              cursor: 'pointer'
            }}
          >
            <Database size={13} />
            <span>{neonConnected ? 'Neon Database: Active' : 'Neon Setup Needed'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            disabled={isLoadingData}
            className="btn-ghost"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} style={{ animation: isLoadingData ? 'spin 1s linear infinite' : 'none' }} />
            <span>REFRESH</span>
          </button>

          {/* Admin user identity */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            fontSize: '12px',
            color: '#64748b'
          }}>
            <User size={13} style={{ color: '#0f172a' }} />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{adminEmail}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '0px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={13} />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>

      {/* Metric Overview Cards (Clean User-Facing Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Total Revenue */}
        <div className="clean-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#000000', marginTop: '6px' }}>
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            From {stats.successPayments} completed enrollments
          </div>
        </div>

        {/* Successful Enrollments */}
        <div className="clean-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Successful Payments
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            {stats.successPayments}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {stats.pendingPayments} pending • {stats.failedPayments} failed
          </div>
        </div>

        {/* Submitted KYC Profiles */}
        <div className="clean-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            KYC Registrations
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {stats.totalRegistrations}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Submitted 9-field student profiles
          </div>
        </div>

        {/* Registered Users */}
        <div className="clean-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Registered Users
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#b8871b', marginTop: '6px' }}>
            {stats.totalUsers}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Total user accounts in database
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Clean Sharp Style) */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '24px',
        gap: '4px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'payments' ? '#000000' : '#64748b',
            borderBottom: `2px solid ${activeTab === 'payments' ? '#000000' : 'transparent'}`,
            backgroundColor: activeTab === 'payments' ? '#ffffff' : 'transparent',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <CreditCard size={15} />
          <span>Payments & Enrollments ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'registrations' ? '#000000' : '#64748b',
            borderBottom: `2px solid ${activeTab === 'registrations' ? '#000000' : 'transparent'}`,
            backgroundColor: activeTab === 'registrations' ? '#ffffff' : 'transparent',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <FileText size={15} />
          <span>Student KYC Details ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'users' ? '#000000' : '#64748b',
            borderBottom: `2px solid ${activeTab === 'users' ? '#000000' : 'transparent'}`,
            backgroundColor: activeTab === 'users' ? '#ffffff' : 'transparent',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <Users size={15} />
          <span>Logged In Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('neon')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'neon' ? '#000000' : '#64748b',
            borderBottom: `2px solid ${activeTab === 'neon' ? '#000000' : 'transparent'}`,
            backgroundColor: activeTab === 'neon' ? '#ffffff' : 'transparent',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <Database size={15} />
          <span>Neon Database Status</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      {activeTab !== 'neon' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '440px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: '#64748b' }} />
            <input
              type="text"
              className="form-input"
              placeholder={
                activeTab === 'payments'
                  ? 'Search by Txn ID, student name, email, phone...'
                  : activeTab === 'registrations'
                  ? 'Search by name, Aadhaar, PAN, email, phone...'
                  : 'Search by user name or email...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Filters for Payments */}
          {activeTab === 'payments' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{ width: 'auto', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="FAILED">Failed Only</option>
              </select>

              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                style={{ width: 'auto', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="ALL">All Programs</option>
                <option value="COURSE">Courses Only</option>
                <option value="CONSULTATION">1-on-1 Consultations Only</option>
              </select>
            </div>
          )}

          {/* Export to CSV */}
          <button
            onClick={() => {
              if (activeTab === 'payments') exportPaymentsToCSV();
              else if (activeTab === 'registrations') exportRegistrationsToCSV();
              else if (activeTab === 'users') exportUsersToCSV();
            }}
            className="btn-ghost"
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>EXPORT CSV</span>
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: Payments & Enrollments ("Who Paid For What") */}
      {/* =================================================================== */}
      {activeTab === 'payments' && (
        <div className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 18px' }}>Student / Contact</th>
                  <th style={{ padding: '14px 18px' }}>Purchased Program</th>
                  <th style={{ padding: '14px 18px' }}>Amount</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px' }}>Transaction ID</th>
                  <th style={{ padding: '14px 18px' }}>Date</th>
                  <th style={{ padding: '14px 18px' }}>KYC Status</th>
                  <th style={{ padding: '14px 18px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No payments found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isConsultation =
                      p.courseId === 'call-consultation' ||
                      p.courseName?.toLowerCase().includes('consultation');

                    return (
                      <tr key={p.txnid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        {/* Student */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {p.registration?.fullName || p.studentName || 'Student'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {p.email}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {p.phone}
                          </div>
                        </td>

                        {/* Program */}
                        <td style={{ padding: '16px 18px', maxWidth: '260px' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            marginBottom: '4px',
                            backgroundColor: isConsultation ? 'rgba(234, 179, 8, 0.12)' : 'rgba(15, 23, 42, 0.08)',
                            color: isConsultation ? '#854d0e' : '#0f172a'
                          }}>
                            {isConsultation ? '1-ON-1 CALL' : 'COURSE ENROLLMENT'}
                          </span>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', lineHeight: 1.4 }}>
                            {p.courseName}
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '16px 18px', fontWeight: 800, color: '#000000', whiteSpace: 'nowrap' }}>
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            backgroundColor:
                              p.status === 'SUCCESS'
                                ? 'rgba(21, 128, 61, 0.10)'
                                : p.status === 'PENDING'
                                ? 'rgba(234, 179, 8, 0.12)'
                                : 'rgba(185, 28, 28, 0.10)',
                            color:
                              p.status === 'SUCCESS'
                                ? '#15803d'
                                : p.status === 'PENDING'
                                ? '#854d0e'
                                : '#b91c1c'
                          }}>
                            {p.status === 'SUCCESS' && <CheckCircle2 size={12} />}
                            {p.status === 'PENDING' && <Clock size={12} />}
                            {p.status === 'FAILED' && <AlertCircle size={12} />}
                            <span>{p.status}</span>
                          </span>
                        </td>

                        {/* Txn ID */}
                        <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontSize: '11px', color: '#0f172a' }}>
                          <div>{p.txnid}</div>
                          {p.payuId && <div style={{ color: '#64748b' }}>PayU: {p.payuId}</div>}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '16px 18px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* KYC Status */}
                        <td style={{ padding: '16px 18px' }}>
                          {p.registration ? (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#15803d',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Check size={12} />
                              <span>Completed</span>
                            </span>
                          ) : isConsultation ? (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Not Required</span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#854d0e', fontWeight: 600 }}>Pending Form</span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '16px 18px' }}>
                          <button
                            onClick={() => setSelectedStudentDetails({ payment: p, registration: p.registration })}
                            className="btn-ghost"
                            style={{
                              padding: '6px 12px',
                              fontSize: '11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={12} />
                            <span>VIEW DETAILS</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: Submitted Student Details (KYC Details post-payment) */}
      {/* =================================================================== */}
      {activeTab === 'registrations' && (
        <div className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Submitted Student Enrollment KYC Records (9 Fields)
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              All details submitted by students after completing course payment.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 18px' }}>Student Name</th>
                  <th style={{ padding: '14px 18px' }}>DOB & Gender</th>
                  <th style={{ padding: '14px 18px' }}>Contact</th>
                  <th style={{ padding: '14px 18px' }}>Aadhaar & PAN</th>
                  <th style={{ padding: '14px 18px' }}>Occupation</th>
                  <th style={{ padding: '14px 18px' }}>Residential Address</th>
                  <th style={{ padding: '14px 18px' }}>Transaction ID</th>
                  <th style={{ padding: '14px 18px' }}>Submitted On</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No student KYC registration details recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((r) => (
                    <tr key={r.txnid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 18px', fontWeight: 700, color: '#0f172a' }}>
                        {r.fullName}
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12px', color: '#334155' }}>
                        <div>{r.dob || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.gender}</div>
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12px' }}>
                        <div style={{ color: '#0f172a', fontWeight: 500 }}>{r.email}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.phone}</div>
                      </td>

                      <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontSize: '11px' }}>
                        <div style={{ color: '#15803d', fontWeight: 600 }}>Aadhaar: {r.aadharCard}</div>
                        <div style={{ color: '#854d0e', fontWeight: 600 }}>PAN: {r.pan}</div>
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12px', color: '#334155' }}>
                        {r.occupation || '—'}
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12px', color: '#64748b', maxWidth: '240px' }}>
                        {r.address}
                      </td>

                      <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontSize: '11px', color: '#0f172a' }}>
                        {r.txnid}
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: Logged In Users ("Who are the users loggedin") */}
      {/* =================================================================== */}
      {activeTab === 'users' && (
        <div className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Registered & Logged In User Accounts
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              All users who authenticated or created an account on payments.musictutorship.in.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 18px' }}>User Name</th>
                  <th style={{ padding: '14px 18px' }}>Mail ID</th>
                  <th style={{ padding: '14px 18px' }}>Consultation Status</th>
                  <th style={{ padding: '14px 18px' }}>Account ID</th>
                  <th style={{ padding: '14px 18px' }}>Registered On</th>
                  <th style={{ padding: '14px 18px' }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No registered user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 18px', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0f172a',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {(u.name || u.email).substring(0, 2).toUpperCase()}
                          </div>
                          <span>{u.name || 'Student'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 18px', color: '#334155' }}>
                        {u.email}
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        {u.hasPaidConsultation ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(234, 179, 8, 0.12)',
                            color: '#854d0e',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            <Sparkles size={11} />
                            <span>Paid (₹10,000 Credit Active)</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Standard Account
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                        {u.id}
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: Neon Database Status & Documentation */}
      {/* =================================================================== */}
      {activeTab === 'neon' && (
        <div className="clean-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Database size={20} style={{ color: '#15803d' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Neon PostgreSQL Database Connection
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            Your application backend is completely integrated with Neon PostgreSQL (`@neondatabase/serverless`). All student accounts, payments, and post-payment KYC registrations are stored directly in your cloud PostgreSQL database.
          </p>

          <div style={{
            backgroundColor: neonConnected ? 'rgba(21, 128, 61, 0.06)' : 'rgba(234, 179, 8, 0.10)',
            border: `1px solid ${neonConnected ? '#bbf7d0' : '#fde68a'}`,
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                DATABASE STATUS
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: neonConnected ? '#15803d' : '#854d0e', marginTop: '2px' }}>
                {neonConnected ? '✓ Neon PostgreSQL is active and connected' : '⚠ DATABASE_URL not yet configured'}
              </div>
            </div>

            <button
              onClick={handleInitDb}
              disabled={isInitializingDb}
              className="btn-primary"
              style={{
                width: 'auto',
                padding: '8px 16px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isInitializingDb ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
              <span>{isInitializingDb ? 'VERIFYING...' : 'VERIFY / RE-INITIALIZE TABLES'}</span>
            </button>
          </div>

          {initDbResult && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: initDbResult.success ? 'rgba(21, 128, 61, 0.08)' : 'rgba(185, 28, 28, 0.08)',
              border: `1px solid ${initDbResult.success ? '#bbf7d0' : '#fca5a5'}`,
              color: initDbResult.success ? '#15803d' : '#b91c1c',
              fontSize: '13px'
            }}>
              {initDbResult.message}
            </div>
          )}

          {/* Database Tables Summary */}
          <div style={{
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '16px 20px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Initialized PostgreSQL Tables:
            </div>
            <ul style={{ fontSize: '12px', color: '#334155', lineHeight: 1.8, paddingLeft: '18px', margin: 0 }}>
              <li><strong style={{ color: '#0f172a' }}>users</strong>: Stores all student logins, accounts, passwords, and consultation credits.</li>
              <li><strong style={{ color: '#0f172a' }}>payments</strong>: Stores all PayU payment records (amount, course name, course ID, status, PayU IDs, mode).</li>
              <li><strong style={{ color: '#0f172a' }}>registrations</strong>: Stores the 9 KYC post-payment enrollment fields entered by students.</li>
              <li><strong style={{ color: '#0f172a' }}>admin_users</strong>: Stores administrator credentials.</li>
            </ul>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* Student Details Inspection Modal (Clean Receipt Style) */}
      {/* =================================================================== */}
      {selectedStudentDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 60
        }}>
          <div className="clean-card" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedStudentDetails(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <span className="section-overline">
                STUDENT ENROLLMENT RECORD
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {selectedStudentDetails.registration?.fullName || selectedStudentDetails.payment.studentName || 'Student Details'}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Transaction ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedStudentDetails.payment.txnid}</strong>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Payment Transaction Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Item / Course:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedStudentDetails.payment.courseName}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Amount Paid:</span>
                  <div style={{ fontWeight: 800, color: '#000000', fontSize: '16px', marginTop: '2px' }}>
                    ₹{Number(selectedStudentDetails.payment.amount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Payment Status:</span>
                  <div style={{ fontWeight: 700, color: selectedStudentDetails.payment.status === 'SUCCESS' ? '#15803d' : '#854d0e', marginTop: '2px' }}>
                    {selectedStudentDetails.payment.status}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <div style={{ color: '#0f172a', marginTop: '2px' }}>
                    {selectedStudentDetails.payment.mode || 'ONLINE'}
                  </div>
                </div>
                {selectedStudentDetails.payment.payuId && (
                  <div>
                    <span style={{ color: '#64748b' }}>PayU ID:</span>
                    <div style={{ color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
                      {selectedStudentDetails.payment.payuId}
                    </div>
                  </div>
                )}
                <div>
                  <span style={{ color: '#64748b' }}>Transaction Date:</span>
                  <div style={{ color: '#0f172a', marginTop: '2px' }}>
                    {selectedStudentDetails.payment.createdAt ? new Date(selectedStudentDetails.payment.createdAt).toLocaleString('en-IN') : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Post-Payment KYC Details Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Post-Payment Details (Entered by Student)
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: selectedStudentDetails.registration ? '#15803d' : '#854d0e'
                }}>
                  {selectedStudentDetails.registration ? '✓ Submitted' : '⚠ KYC Form Not Yet Submitted'}
                </span>
              </div>

              {selectedStudentDetails.registration ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>1. Full Name</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {selectedStudentDetails.registration.fullName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>2. Date of Birth</div>
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
                      {selectedStudentDetails.registration.dob}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>3. Gender</div>
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
                      {selectedStudentDetails.registration.gender}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>4. Mail ID</div>
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedStudentDetails.registration.email}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>5. Phone Number</div>
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
                      {selectedStudentDetails.registration.phone}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>6. Aadhaar Card Number</div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                      {selectedStudentDetails.registration.aadharCard}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>7. PAN Number</div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#854d0e', fontWeight: 700, marginTop: '2px' }}>
                      {selectedStudentDetails.registration.pan}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>8. Occupation</div>
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
                      {selectedStudentDetails.registration.occupation}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>9. Residential Address</div>
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px', lineHeight: 1.5 }}>
                      {selectedStudentDetails.registration.address}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '11px', color: '#64748b' }}>
                    Form Submitted On: {selectedStudentDetails.registration.submittedAt ? new Date(selectedStudentDetails.registration.submittedAt).toLocaleString('en-IN') : '—'}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: '13px'
                }}>
                  {selectedStudentDetails.payment.courseId === 'call-consultation' ||
                  selectedStudentDetails.payment.courseName?.toLowerCase().includes('consultation') ? (
                    <div>
                      This was a 1-on-1 Consultation booking. Consultations do not require the 9-field student KYC registration.
                    </div>
                  ) : (
                    <div>
                      The student has not completed the post-payment KYC registration form yet. The registration link is:
                      <div style={{ marginTop: '8px' }}>
                        <code style={{ color: '#0f172a', fontSize: '12px' }}>
                          /register?txnid={selectedStudentDetails.payment.txnid}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedStudentDetails(null)}
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
