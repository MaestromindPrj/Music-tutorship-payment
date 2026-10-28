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
  ExternalLink,
  Plus,
  Send,
  Key,
  Share2,
  MessageCircle
} from 'lucide-react';
import { PaymentRecord, StudentRegistration } from '@/types';
import { getPricing } from '@/lib/pricing';

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [isLoadingData, setIsLoadingData] = useState(false);
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

  const [activeTab, setActiveTab] = useState<'payments' | 'registrations' | 'users'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COURSE' | 'CONSULTATION'>('ALL');

  const [selectedStudentDetails, setSelectedStudentDetails] = useState<{
    payment: PaymentWithReg;
    registration?: StudentRegistration | null;
  } | null>(null);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [createdUserSuccess, setCreatedUserSuccess] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [editUserError, setEditUserError] = useState('');
  const [editUserSuccess, setEditUserSuccess] = useState<{
    name: string;
    email: string;
    password?: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

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

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let pwd = 'MT@';
    for (let i = 0; i < 7; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += '!';
    setNewUserPassword(pwd);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');

    if (!newUserEmail.trim() || !newUserEmail.includes('@')) {
      setAddUserError('Please enter a valid email address.');
      return;
    }
    if (!newUserPassword || newUserPassword.length < 6) {
      setAddUserError('Password must be at least 6 characters.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim() || newUserEmail.split('@')[0],
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword,
          hasPaidConsultation: false
        })
      });
      const data = await res.json();
      setIsCreatingUser(false);

      if (data.success) {
        setCreatedUserSuccess({
          name: newUserName.trim() || newUserEmail.split('@')[0],
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword
        });
        fetchDashboardData();
      } else {
        setAddUserError(data.error || 'Failed to create student account.');
      }
    } catch (err: any) {
      setIsCreatingUser(false);
      setAddUserError(err?.message || 'Connection error.');
    }
  };

  const generateEditRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let pwd = 'MT@';
    for (let i = 0; i < 7; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += '!';
    setEditPassword(pwd);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserError('');

    if (editPassword && editPassword.length < 6) {
      setEditUserError('Password must be at least 6 characters.');
      return;
    }

    setIsUpdatingUser(true);
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingUser.email,
          password: editPassword || undefined,
          name: editName.trim() || undefined
        })
      });
      const data = await res.json();
      setIsUpdatingUser(false);

      if (data.success) {
        setEditUserSuccess({
          name: editName.trim() || editingUser.name,
          email: editingUser.email,
          password: editPassword || undefined
        });
        fetchDashboardData();
      } else {
        setEditUserError(data.error || 'Failed to update user credentials.');
      }
    } catch (err: any) {
      setIsUpdatingUser(false);
      setEditUserError(err?.message || 'Connection error.');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

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
      `"${u.hasPaidConsultation ? 'YES' : 'NO'}"`,
      `"${u.createdAt}"`,
      `"${u.lastLoginAt || ''}"`
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

  const whatsappShareUrl = createdUserSuccess
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hello ${createdUserSuccess.name}!\n\nYour Music Tutorship Student Portal account has been created.\n\n🌐 Portal: https://payments.musictutorship.in\n📧 Email: ${createdUserSuccess.email}\n🔑 Password: ${createdUserSuccess.password}\n\nPlease log in to access your course materials and consultations.`
      )}`
    : '#';

  const whatsappEditShareUrl = editUserSuccess?.password
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hello ${editUserSuccess.name}!\n\nYour Music Tutorship Student Portal credentials have been updated.\n\n🌐 Portal: https://payments.musictutorship.in\n📧 Email: ${editUserSuccess.email}\n🔑 New Password: ${editUserSuccess.password}\n\nPlease log in using your updated password.`
      )}`
    : '#';

  if (isAuthenticated === null) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: '#64748b'
      }}>
        <Loader2 className="animate-spin" size={28} style={{ color: '#0f172a' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Verifying administrator session...</span>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="container" style={{ padding: '60px 24px', maxWidth: '440px' }}>
        <div className="clean-card" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Shield size={24} style={{ color: '#ffffff' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Administrator Access
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Authorized Music Tutorship staff only
            </p>
          </div>

          {loginError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(185, 28, 28, 0.08)',
              color: '#b91c1c',
              fontSize: '12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #fecaca'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="admin-email">
                <span>Admin Email *</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoFocus
                  className="form-input"
                  placeholder="admin@musictutorship.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="admin-password">
                <span>Password *</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Enter administrator password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingLeft: '36px', paddingRight: '36px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
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

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In as Administrator'}</span>
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
            Protected Administrator Area • Music Tutorship
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-container" style={{ padding: '32px 32px 80px 32px', maxWidth: '1600px', width: '100%' }}>
      <div className="admin-top-header" style={{
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
          <h1 className="admin-title" style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
            Payments & Enrollment Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Payments & Enrollment details • payments.musictutorship.in
          </p>
        </div>

        <div className="admin-top-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

      <div className="admin-layout" style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        <aside className="admin-sidebar" style={{ width: '270px', flexShrink: 0, minWidth: '240px' }}>
          <div className="clean-card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              padding: '4px 8px 12px 8px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '10px'
            }}>
              MANAGEMENT TABS
            </div>

            <nav className="admin-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => setActiveTab('payments')}
                className={`admin-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: activeTab === 'payments' ? '#0f172a' : 'transparent',
                  color: activeTab === 'payments' ? '#ffffff' : '#334155',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={16} />
                  <span>Payments & Enrollments</span>
                </div>
                <span className="tab-badge" style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  backgroundColor: activeTab === 'payments' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                  color: activeTab === 'payments' ? '#ffffff' : '#475569'
                }}>
                  {payments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('registrations')}
                className={`admin-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: activeTab === 'registrations' ? '#0f172a' : 'transparent',
                  color: activeTab === 'registrations' ? '#ffffff' : '#334155',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={16} />
                  <span>Student KYC Details</span>
                </div>
                <span className="tab-badge" style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  backgroundColor: activeTab === 'registrations' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                  color: activeTab === 'registrations' ? '#ffffff' : '#475569'
                }}>
                  {registrations.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: activeTab === 'users' ? '#0f172a' : 'transparent',
                  color: activeTab === 'users' ? '#ffffff' : '#334155',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={16} />
                  <span>Logged In Users</span>
                </div>
                <span className="tab-badge" style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  backgroundColor: activeTab === 'users' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                  color: activeTab === 'users' ? '#ffffff' : '#475569'
                }}>
                  {users.length}
                </span>
              </button>
            </nav>

            <div className="admin-sidebar-action" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => {
                  setIsAddUserOpen(true);
                  setCreatedUserSuccess(null);
                  setAddUserError('');
                  setNewUserName('');
                  setNewUserEmail('');
                  generateRandomPassword();
                }}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={14} />
                <span>ADD USER</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="admin-main" style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <div className="admin-metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="clean-card admin-metric-card" style={{ padding: '20px 24px' }}>
              <div className="metric-title" style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Revenue
              </div>
              <div className="metric-val" style={{ fontSize: '26px', fontWeight: 800, color: '#000000', marginTop: '6px' }}>
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </div>
              <div className="metric-sub" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                From {stats.successPayments} enrollments
              </div>
            </div>

            <div className="clean-card admin-metric-card" style={{ padding: '20px 24px' }}>
              <div className="metric-title" style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Successful Payments
              </div>
              <div className="metric-val" style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
                {stats.successPayments}
              </div>
              <div className="metric-sub" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {stats.pendingPayments} pending • {stats.failedPayments} failed
              </div>
            </div>

            <div className="clean-card admin-metric-card" style={{ padding: '20px 24px' }}>
              <div className="metric-title" style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                KYC Registrations
              </div>
              <div className="metric-val" style={{ fontSize: '26px', fontWeight: 800, color: '#000000', marginTop: '6px' }}>
                {stats.totalRegistrations}
              </div>
              <div className="metric-sub" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Post-payment profiles
              </div>
            </div>

            <div className="clean-card admin-metric-card" style={{ padding: '20px 24px' }}>
              <div className="metric-title" style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Student Accounts
              </div>
              <div className="metric-val" style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {stats.totalUsers}
              </div>
              <div className="metric-sub" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Accounts in database
              </div>
            </div>
          </div>

          <div className="admin-toolbar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            width: '100%',
            flexWrap: 'wrap'
          }}>
            <div className="admin-search-wrapper" style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
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
                style={{
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  width: '100%',
                  height: '40px',
                  boxSizing: 'border-box',
                  fontSize: '13px'
                }}
              />
            </div>

            {activeTab === 'payments' && (
              <div className="admin-filters-wrapper" style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{ width: 'auto', padding: '0 12px', height: '40px', boxSizing: 'border-box', fontSize: '13px' }}
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
                  style={{ width: 'auto', padding: '0 12px', height: '40px', boxSizing: 'border-box', fontSize: '13px' }}
                >
                  <option value="ALL">All Programs</option>
                  <option value="COURSE">Courses Only</option>
                  <option value="CONSULTATION">Call Consultations Only</option>
                </select>
              </div>
            )}

            <div className="admin-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
              {activeTab === 'users' && (
                <button
                  onClick={() => {
                    setIsAddUserOpen(true);
                    setCreatedUserSuccess(null);
                    setAddUserError('');
                    setNewUserName('');
                    setNewUserEmail('');
                    generateRandomPassword();
                  }}
                  className="btn-primary"
                  style={{
                    height: '40px',
                    boxSizing: 'border-box',
                    padding: '0 16px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Plus size={14} />
                  <span>ADD USER</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (activeTab === 'payments') exportPaymentsToCSV();
                  else if (activeTab === 'registrations') exportRegistrationsToCSV();
                  else if (activeTab === 'users') exportUsersToCSV();
                }}
                className="btn-ghost"
                style={{
                  height: '40px',
                  boxSizing: 'border-box',
                  padding: '0 16px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Download size={14} />
                <span style={{ whiteSpace: 'nowrap' }}>EXPORT CSV</span>
              </button>
            </div>
          </div>

          {activeTab === 'payments' && (
            <div className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="admin-table-mobile-hint">Swipe horizontally to view full table →</div>
              <div className="admin-table-scroll" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '14px 18px' }}>Student / Contact</th>
                      <th style={{ padding: '14px 18px' }}>Purchased Program</th>
                      <th style={{ padding: '14px 18px' }}>Amount</th>
                      <th style={{ padding: '14px 18px' }}>Status</th>
                      <th style={{ padding: '14px 18px' }}>Transaction ID</th>
                      <th style={{ padding: '14px 18px' }}>Date</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          No payment records found.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => {
                        const isSuccess = p.status === 'SUCCESS';
                        const isPending = p.status === 'PENDING';
                        const isConsultation =
                          p.courseId === 'call-consultation' ||
                          p.courseName?.toLowerCase().includes('consultation');

                        return (
                          <tr key={p.txnid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px 18px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                {p.studentName || 'Student'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{p.email}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.phone}</div>
                            </td>

                            <td style={{ padding: '16px 18px' }}>
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

                            <td style={{ padding: '16px 18px', fontWeight: 800, color: '#000000', whiteSpace: 'nowrap' }}>
                              ₹{Number(p.amount).toLocaleString('en-IN')}
                            </td>

                            <td style={{ padding: '16px 18px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                backgroundColor:
                                  isSuccess
                                    ? 'rgba(21, 128, 61, 0.08)'
                                    : isPending
                                    ? 'rgba(234, 179, 8, 0.12)'
                                    : 'rgba(185, 28, 28, 0.08)',
                                color:
                                  isSuccess
                                    ? '#15803d'
                                    : isPending
                                    ? '#854d0e'
                                    : '#b91c1c'
                              }}>
                                {isSuccess && <CheckCircle2 size={11} />}
                                {isPending && <Clock size={11} />}
                                {p.status}
                              </span>
                            </td>

                            <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{p.txnid}</span>
                                <button
                                  onClick={() => handleCopy(p.txnid, p.txnid)}
                                  title="Copy Txn ID"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
                                >
                                  {copiedText === p.txnid ? <Check size={12} style={{ color: '#15803d' }} /> : <Copy size={12} />}
                                </button>
                              </div>
                            </td>

                            <td style={{ padding: '16px 18px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>

                            <td style={{ padding: '16px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => setSelectedStudentDetails({ payment: p, registration: p.registration })}
                                className="btn-ghost"
                                style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={12} />
                                <span>VIEW</span>
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

          {activeTab === 'registrations' && (
            <div className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="admin-table-mobile-hint">Swipe horizontally to view full table →</div>
              <div className="admin-table-scroll" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '14px 18px' }}>Student Name</th>
                      <th style={{ padding: '14px 18px' }}>DOB / Gender</th>
                      <th style={{ padding: '14px 18px' }}>Contact</th>
                      <th style={{ padding: '14px 18px' }}>KYC Numbers</th>
                      <th style={{ padding: '14px 18px' }}>Occupation</th>
                      <th style={{ padding: '14px 18px' }}>Address</th>
                      <th style={{ padding: '14px 18px' }}>Order Txn ID</th>
                      <th style={{ padding: '14px 18px' }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          No KYC registration records found.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((r) => (
                        <tr key={r.txnid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px 18px', fontWeight: 700, color: '#0f172a' }}>
                            {r.fullName}
                          </td>

                          <td style={{ padding: '16px 18px', fontSize: '12px' }}>
                            <div style={{ color: '#0f172a' }}>{r.dob}</div>
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

          {activeTab === 'users' && (
            <div className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Registered & Logged In User Accounts
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                    All registered student accounts and authentication records in database.
                  </p>
                </div>
              </div>

              <div className="admin-table-mobile-hint">Swipe horizontally to view full table →</div>
              <div className="admin-table-scroll" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '14px 18px' }}>User Name</th>
                      <th style={{ padding: '14px 18px' }}>Mail ID</th>
                      <th style={{ padding: '14px 18px' }}>Consultation Status</th>
                      <th style={{ padding: '14px 18px' }}>Account ID</th>
                      <th style={{ padding: '14px 18px' }}>Created On</th>
                      <th style={{ padding: '14px 18px' }}>Last Active</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          No registered user accounts found. Click &quot;ADD USER&quot; above to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px 18px', fontWeight: 700, color: '#0f172a' }}>
                            {u.name || 'Student'}
                          </td>

                          <td style={{ padding: '16px 18px', color: '#334155' }}>
                            {u.email}
                          </td>

                          <td style={{ padding: '16px 18px', whiteSpace: 'nowrap' }}>
                            {u.hasPaidConsultation ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                backgroundColor: 'rgba(234, 179, 8, 0.12)',
                                color: '#854d0e',
                                fontSize: '11px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}>
                                <Sparkles size={11} />
                                <span>Paid ({getPricing().creditText} Credit Active)</span>
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

                          <td style={{ padding: '16px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => {
                                setEditingUser({ id: u.id, name: u.name, email: u.email });
                                setEditName(u.name || '');
                                setEditPassword('');
                                setEditUserError('');
                                setEditUserSuccess(null);
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: '0px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <Key size={12} style={{ color: '#b8871b' }} />
                              <span>Edit Password</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {isAddUserOpen && (
        <div className="admin-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 80
        }}>
          <div className="clean-card admin-modal-card" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
            <button
              onClick={() => {
                setIsAddUserOpen(false);
                setCreatedUserSuccess(null);
                setAddUserError('');
              }}
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

            <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8871b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                STUDENT ACCESS PROVISIONING
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px', marginBottom: '4px' }}>
                {createdUserSuccess ? 'Account Created Successfully!' : 'Add New Student Account'}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {createdUserSuccess
                  ? 'Share these login credentials directly with the student via WhatsApp.'
                  : 'Create an account and password for the student. They will use this to sign in.'}
              </p>
            </div>

            {createdUserSuccess ? (
              <div>
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} />
                    <span>CREDENTIALS READY TO SHARE</span>
                  </div>

                  <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#0f172a', fontFamily: 'monospace', backgroundColor: '#ffffff', padding: '12px', border: '1px dashed #cbd5e1' }}>
                    <div><strong>Name:</strong> {createdUserSuccess.name}</div>
                    <div><strong>Email:</strong> {createdUserSuccess.email}</div>
                    <div><strong>Password:</strong> {createdUserSuccess.password}</div>
                    <div><strong>Portal:</strong> payments.musictutorship.in</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <MessageCircle size={16} />
                    <span>Share Credentials via WhatsApp</span>
                  </a>

                  <button
                    onClick={() => handleCopy(
                      `Hello ${createdUserSuccess.name}!\nYour Music Tutorship Student Portal account has been created.\n\n🌐 Portal: https://payments.musictutorship.in\n📧 Email: ${createdUserSuccess.email}\n🔑 Password: ${createdUserSuccess.password}\n\nPlease log in to access your course materials and consultations.`,
                      'creds'
                    )}
                    className="btn-ghost"
                    style={{ width: '100%', padding: '11px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {copiedText === 'creds' ? <Check size={14} style={{ color: '#15803d' }} /> : <Copy size={14} />}
                    <span>{copiedText === 'creds' ? 'Copied to Clipboard!' : 'Copy Credentials Message'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCreatedUserSuccess(null);
                      setNewUserName('');
                      setNewUserEmail('');
                      generateRandomPassword();
                    }}
                    className="btn-primary"
                    style={{ width: '100%', padding: '11px', marginTop: '6px', fontSize: '13px' }}
                  >
                    + Add Another Student
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                {addUserError && (
                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(185, 28, 28, 0.08)',
                    color: '#b91c1c',
                    fontSize: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{addUserError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" htmlFor="new-user-name">
                    <span>Student Full Name</span>
                  </label>
                  <input
                    id="new-user-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" htmlFor="new-user-email">
                    <span>Student Email Address *</span>
                  </label>
                  <input
                    id="new-user-email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="student@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" htmlFor="new-user-password" style={{ marginBottom: 0 }}>
                      <span>Password *</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '11px',
                        color: '#b8871b',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      🎲 Generate Password
                    </button>
                  </div>
                  <input
                    id="new-user-password"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Set password (min 6 chars)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    style={{ marginTop: '6px', marginBottom: '20px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isCreatingUser ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  <span>{isCreatingUser ? 'Creating Account...' : 'Create Account & Prepare WhatsApp Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {editingUser && (
        <div className="admin-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 80
        }}>
          <div className="clean-card admin-modal-card" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
            <button
              onClick={() => {
                setEditingUser(null);
                setEditUserSuccess(null);
                setEditUserError('');
              }}
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

            <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8871b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                ACCOUNT CREDENTIALS MANAGEMENT
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px', marginBottom: '4px' }}>
                {editUserSuccess ? 'Password Updated!' : 'Edit Student Credentials'}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {editUserSuccess
                  ? 'Credentials have been safely updated in Neon PostgreSQL.'
                  : `Update password and profile for ${editingUser.email}`}
              </p>
            </div>

            {editUserSuccess ? (
              <div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} />
                    <span>UPDATED CREDENTIALS SAVED IN DATABASE</span>
                  </div>

                  <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#0f172a', fontFamily: 'monospace', backgroundColor: '#ffffff', padding: '12px', border: '1px dashed #86efac' }}>
                    <div><strong>Name:</strong> {editUserSuccess.name}</div>
                    <div><strong>Email:</strong> {editUserSuccess.email}</div>
                    {editUserSuccess.password && (
                      <div><strong>New Password:</strong> {editUserSuccess.password}</div>
                    )}
                    <div><strong>Portal:</strong> payments.musictutorship.in</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {editUserSuccess.password && (
                    <a
                      href={whatsappEditShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#25D366',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <MessageCircle size={16} />
                      <span>Share New Password via WhatsApp</span>
                    </a>
                  )}

                  {editUserSuccess.password && (
                    <button
                      onClick={() => handleCopy(
                        `Hello ${editUserSuccess.name}!\nYour Music Tutorship Student Portal credentials have been updated.\n\n🌐 Portal: https://payments.musictutorship.in\n📧 Email: ${editUserSuccess.email}\n🔑 New Password: ${editUserSuccess.password}\n\nPlease log in using your updated password.`,
                        'edit-creds'
                      )}
                      className="btn-ghost"
                      style={{ width: '100%', padding: '11px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {copiedText === 'edit-creds' ? <Check size={14} style={{ color: '#15803d' }} /> : <Copy size={14} />}
                      <span>{copiedText === 'edit-creds' ? 'Copied to Clipboard!' : 'Copy Updated Credentials'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setEditUserSuccess(null);
                    }}
                    className="btn-primary"
                    style={{ width: '100%', padding: '11px', marginTop: '6px', fontSize: '13px' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateUser}>
                {editUserError && (
                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(185, 28, 28, 0.08)',
                    color: '#b91c1c',
                    fontSize: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{editUserError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">
                    <span>Student Email (Registered)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    className="form-input"
                    value={editingUser.email}
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" htmlFor="edit-user-name">
                    <span>Student Name</span>
                  </label>
                  <input
                    id="edit-user-name"
                    type="text"
                    className="form-input"
                    placeholder="Student Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" htmlFor="edit-user-password" style={{ marginBottom: 0 }}>
                      <span>New Password </span>
                    </label>
                    <button
                      type="button"
                      onClick={generateEditRandomPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '11px',
                        color: '#b8871b',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      🎲 Generate Password
                    </button>
                  </div>
                  <input
                    id="edit-user-password"
                    type="text"
                    className="form-input"
                    placeholder="Enter new password (min 6 chars)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    style={{ marginTop: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="btn-ghost"
                    style={{ flex: 1, padding: '12px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdatingUser}
                    className="btn-primary"
                    style={{
                      flex: 2,
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isUpdatingUser ? <Loader2 className="animate-spin" size={16} /> : <Key size={16} />}
                    <span>{isUpdatingUser ? 'Saving Changes...' : 'Save Updated Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {selectedStudentDetails && (
        <div className="admin-modal-overlay" style={{
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
          <div className="clean-card admin-modal-card" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
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

            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8871b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                STUDENT ENROLLMENT RECORD
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {selectedStudentDetails.registration?.fullName || selectedStudentDetails.payment.studentName || 'Student Details'}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Transaction ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedStudentDetails.payment.txnid}</strong>
              </div>
            </div>

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
                {selectedStudentDetails.payment.bankRefNum && (
                  <div>
                    <span style={{ color: '#64748b' }}>Bank Ref:</span>
                    <div style={{ color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
                      {selectedStudentDetails.payment.bankRefNum}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Mandatory 9-Point Student KYC Details
              </div>

              {selectedStudentDetails.registration ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '13px' }}>
                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>1. Full Name</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedStudentDetails.registration.fullName}</div>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>2. Date of Birth</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedStudentDetails.registration.dob}</div>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>3. Gender</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedStudentDetails.registration.gender}</div>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>4. Email Address</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedStudentDetails.registration.email}</div>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>5. Phone Number</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedStudentDetails.registration.phone}</div>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>6. Aadhaar Card</div>
                    <div style={{ fontWeight: 700, color: '#15803d', fontFamily: 'monospace', marginTop: '2px' }}>
                      {selectedStudentDetails.registration.aadharCard}
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>7. PAN Card</div>
                    <div style={{ fontWeight: 700, color: '#854d0e', fontFamily: 'monospace', marginTop: '2px' }}>
                      {selectedStudentDetails.registration.pan}
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>8. Occupation</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedStudentDetails.registration.occupation}</div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', padding: '10px 12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>9. Residential Address</div>
                    <div style={{ color: '#0f172a', marginTop: '2px', lineHeight: 1.5 }}>{selectedStudentDetails.registration.address}</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  color: '#92400e',
                  fontSize: '13px'
                }}>
                  Student has not submitted their post-payment 9-point KYC registration yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
