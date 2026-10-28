-- =========================================================================
-- Music Tutorship - Neon PostgreSQL Database Schema
-- Run this in the Neon Console SQL Editor (https://console.neon.tech)
-- Note: Our application also creates these automatically upon first connect!
-- =========================================================================

-- 1. Users Table (Stores student accounts and consultation credit status)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  has_paid_consultation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payments Table (Stores payments for Courses and 1-on-1 Call Consultations)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(100) PRIMARY KEY,
  txnid VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  payu_id VARCHAR(100),
  payu_hash TEXT,
  mode VARCHAR(50),
  bank_ref_num VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Registrations Table (Stores 9 KYC Details entered by users post-payment)
CREATE TABLE IF NOT EXISTS registrations (
  id VARCHAR(100) PRIMARY KEY,
  txnid VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  dob VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  aadhar_card VARCHAR(50) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  pan VARCHAR(50) NOT NULL,
  occupation VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Admin Users Table (For admin portal authentication)
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_txnid ON registrations(txnid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
