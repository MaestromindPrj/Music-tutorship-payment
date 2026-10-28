import { neon, neonConfig } from '@neondatabase/serverless';
import https from 'https';
import { Resolver } from 'dns';
import { PaymentRecord, StudentRegistration } from '@/types';
import { UserAccount } from './auth';

export interface AdminStats {
  totalRevenue: number;
  totalPayments: number;
  successPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalUsers: number;
  totalRegistrations: number;
}

export interface PaymentWithRegistration extends PaymentRecord {
  registration?: StudentRegistration | null;
}

// Ensure DNS resilience for both local development and cloud production
let dnsConfigured = false;
function setupDnsResilience() {
  if (dnsConfigured || typeof window !== 'undefined') return;
  dnsConfigured = true;

  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    neonConfig.fetchFunction = async (urlStr: string | URL, init: any = {}) => {
      const url = new URL(urlStr.toString());

      // Attempt to resolve IP using public DNS resolvers if local router lookup struggles
      const ip = await new Promise<string>((resolve) => {
        resolver.resolve4(url.hostname, (err, addresses) => {
          if (err || !addresses || addresses.length === 0) {
            resolve(url.hostname);
          } else {
            resolve(addresses[0]);
          }
        });
      });

      return new Promise((resolve, reject) => {
        const headers = { ...init.headers };
        if (!headers['host'] && !headers['Host']) {
          headers['Host'] = url.hostname;
        }

        const req = https.request(
          {
            protocol: url.protocol,
            hostname: ip,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: init.method || 'GET',
            headers,
            servername: url.hostname // SNI for SSL handshake
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (d) => chunks.push(d));
            res.on('end', () => {
              const body = Buffer.concat(chunks).toString('utf-8');
              resolve({
                ok: (res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300,
                status: res.statusCode ?? 500,
                statusText: res.statusMessage || '',
                text: async () => body,
                json: async () => JSON.parse(body),
                headers: {
                  get: (header: string) => res.headers[header.toLowerCase()] as string
                }
              } as any);
            });
          }
        );

        req.on('error', (err) => {
          if (typeof globalThis.fetch === 'function') {
            globalThis.fetch(urlStr, init).then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });

        if (init.body) {
          req.write(init.body);
        }
        req.end();
      });
    };
  } catch (e) {
    console.warn('DNS resilience setup note:', e);
  }
}

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL
  );
}

export function getNeonSql() {
  const url = getDatabaseUrl();
  if (!url) return null;
  setupDnsResilience();
  return neon(url);
}

let dbInitialized = false;

/**
 * Ensures required PostgreSQL tables and indexes exist in Neon
 */
export async function initDb(): Promise<{ success: boolean; message: string }> {
  const sql = getNeonSql();
  if (!sql) {
    return { success: false, message: 'DATABASE_URL is not configured.' };
  }

  try {
    // 1. Users table (Stores logged in / registered students)
    await sql`
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
    `;

    // 2. Payments table (Stores transactions for courses and 1-on-1 call consultations)
    await sql`
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
    `;

    // 3. Registrations table (Stores 9 KYC details submitted by users after payment)
    await sql`
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
    `;

    // 4. Admin users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Indexes for fast lookups
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_registrations_txnid ON registrations(txnid);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;

    dbInitialized = true;
    return { success: true, message: 'Neon PostgreSQL schema initialized successfully.' };
  } catch (error: any) {
    console.error('Neon initDb error:', error);
    return { success: false, message: error?.message || 'Database initialization error' };
  }
}

export async function ensureDbInitialized(): Promise<void> {
  if (dbInitialized) return;
  const url = getDatabaseUrl();
  if (!url) return;
  await initDb().catch((err) => console.warn('Could not auto-initialize tables:', err));
}

// =========================================================================
// User Operations (Neon PostgreSQL)
// =========================================================================

export async function neonFindUserByEmail(email: string): Promise<UserAccount | null> {
  const sql = getNeonSql();
  if (!sql) return null;
  await ensureDbInitialized();

  const cleanEmail = email.trim().toLowerCase();
  const rows = await sql`
    SELECT id, email, name, password, has_paid_consultation, created_at, last_login_at
    FROM users
    WHERE email = ${cleanEmail}
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    password: row.password,
    hasPaidConsultation: Boolean(row.has_paid_consultation),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

export async function neonSaveUser(user: UserAccount): Promise<boolean> {
  const sql = getNeonSql();
  if (!sql) return false;
  await ensureDbInitialized();

  const cleanEmail = user.email.trim().toLowerCase();
  await sql`
    INSERT INTO users (id, email, name, password, has_paid_consultation, created_at, updated_at, last_login_at)
    VALUES (
      ${user.id},
      ${cleanEmail},
      ${user.name},
      ${user.password},
      ${user.hasPaidConsultation},
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password = EXCLUDED.password,
      has_paid_consultation = EXCLUDED.has_paid_consultation,
      last_login_at = NOW(),
      updated_at = NOW();
  `;
  return true;
}

export async function neonUpdateUserLastLogin(email: string): Promise<void> {
  const sql = getNeonSql();
  if (!sql) return;
  const cleanEmail = email.trim().toLowerCase();
  await sql`
    UPDATE users
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE email = ${cleanEmail};
  `.catch((e) => console.warn('neonUpdateUserLastLogin note:', e));
}

export async function neonUpdateUserPassword(email: string, newPassword: string): Promise<boolean> {
  const sql = getNeonSql();
  if (!sql) return false;
  await ensureDbInitialized();

  const cleanEmail = email.trim().toLowerCase();
  await sql`
    UPDATE users
    SET password = ${newPassword}, updated_at = NOW()
    WHERE email = ${cleanEmail};
  `;
  return true;
}

export async function neonMarkConsultationPaid(email: string): Promise<void> {
  const sql = getNeonSql();
  if (!sql) return;
  await ensureDbInitialized();

  const cleanEmail = email.trim().toLowerCase();
  await sql`
    UPDATE users
    SET has_paid_consultation = TRUE, updated_at = NOW()
    WHERE email = ${cleanEmail};
  `.catch((e) => console.warn('neonMarkConsultationPaid note:', e));
}

export async function neonGetAllUsers(): Promise<Array<{
  id: string;
  email: string;
  name: string;
  hasPaidConsultation: boolean;
  createdAt: string;
  lastLoginAt: string;
}>> {
  const sql = getNeonSql();
  if (!sql) return [];
  await ensureDbInitialized();

  const rows = await sql`
    SELECT id, email, name, has_paid_consultation, created_at, last_login_at
    FROM users
    ORDER BY created_at DESC;
  `;

  return rows.map((r: any) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    hasPaidConsultation: Boolean(r.has_paid_consultation),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : new Date().toISOString()
  }));
}

// =========================================================================
// Payment Operations (Neon PostgreSQL)
// =========================================================================

export async function neonSavePayment(record: PaymentRecord): Promise<boolean> {
  const sql = getNeonSql();
  if (!sql) return false;
  await ensureDbInitialized();

  const cleanTxnid = record.txnid.trim();
  const id = record.id ? String(record.id) : `pay_${Date.now()}`;

  await sql`
    INSERT INTO payments (
      id, txnid, amount, course_name, course_id, student_name,
      email, phone, status, payu_id, payu_hash, mode, bank_ref_num,
      error_message, created_at, updated_at
    )
    VALUES (
      ${id},
      ${cleanTxnid},
      ${record.amount},
      ${record.courseName},
      ${record.courseId},
      ${record.studentName},
      ${record.email.trim().toLowerCase()},
      ${record.phone.trim()},
      ${record.status},
      ${record.payuId || null},
      ${record.payuHash || null},
      ${record.mode || null},
      ${record.bankRefNum || null},
      ${record.errorMessage || null},
      NOW(),
      NOW()
    )
    ON CONFLICT (txnid) DO UPDATE SET
      amount = EXCLUDED.amount,
      course_name = EXCLUDED.course_name,
      course_id = EXCLUDED.course_id,
      student_name = EXCLUDED.student_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      status = EXCLUDED.status,
      payu_id = COALESCE(EXCLUDED.payu_id, payments.payu_id),
      payu_hash = COALESCE(EXCLUDED.payu_hash, payments.payu_hash),
      mode = COALESCE(EXCLUDED.mode, payments.mode),
      bank_ref_num = COALESCE(EXCLUDED.bank_ref_num, payments.bank_ref_num),
      error_message = COALESCE(EXCLUDED.error_message, payments.error_message),
      updated_at = NOW();
  `;

  return true;
}

export async function neonUpdatePaymentStatus(
  txnid: string,
  status: 'PENDING' | 'SUCCESS' | 'FAILED',
  details?: {
    payuId?: string;
    payuHash?: string;
    mode?: string;
    bankRefNum?: string;
    errorMessage?: string;
    amount?: number;
    courseName?: string;
    courseId?: string;
    studentName?: string;
    email?: string;
    phone?: string;
  }
): Promise<PaymentRecord | null> {
  const sql = getNeonSql();
  if (!sql) return null;
  await ensureDbInitialized();

  const cleanTxnid = txnid.trim();

  const rows = await sql`
    UPDATE payments
    SET
      status = ${status},
      payu_id = COALESCE(${details?.payuId || null}, payu_id),
      payu_hash = COALESCE(${details?.payuHash || null}, payu_hash),
      mode = COALESCE(${details?.mode || null}, mode),
      bank_ref_num = COALESCE(${details?.bankRefNum || null}, bank_ref_num),
      error_message = COALESCE(${details?.errorMessage || null}, error_message),
      amount = COALESCE(${details?.amount !== undefined ? details.amount : null}, amount),
      course_name = COALESCE(${details?.courseName || null}, course_name),
      course_id = COALESCE(${details?.courseId || null}, course_id),
      student_name = COALESCE(${details?.studentName || null}, student_name),
      email = COALESCE(${details?.email ? details.email.trim().toLowerCase() : null}, email),
      phone = COALESCE(${details?.phone || null}, phone),
      updated_at = NOW()
    WHERE txnid = ${cleanTxnid}
    RETURNING *;
  `;

  if (!rows || rows.length === 0) {
    // If not existing, insert as fallback
    const id = `pay_${Date.now()}`;
    const insertRows = await sql`
      INSERT INTO payments (
        id, txnid, amount, course_name, course_id, student_name,
        email, phone, status, payu_id, payu_hash, mode, bank_ref_num,
        error_message, created_at, updated_at
      )
      VALUES (
        ${id},
        ${cleanTxnid},
        ${details?.amount || 1},
        ${details?.courseName || 'Music Production Course'},
        ${details?.courseId || 'mastery'},
        ${details?.studentName || 'Student'},
        ${details?.email ? details.email.trim().toLowerCase() : ''},
        ${details?.phone || ''},
        ${status},
        ${details?.payuId || null},
        ${details?.payuHash || null},
        ${details?.mode || null},
        ${details?.bankRefNum || null},
        ${details?.errorMessage || null},
        NOW(),
        NOW()
      )
      RETURNING *;
    `;
    if (insertRows && insertRows.length > 0) {
      return mapPaymentRow(insertRows[0]);
    }
    return null;
  }

  return mapPaymentRow(rows[0]);
}

export async function neonGetPaymentByTxnId(txnid: string): Promise<PaymentRecord | null> {
  const sql = getNeonSql();
  if (!sql) return null;
  await ensureDbInitialized();

  const cleanTxnid = txnid.trim();
  const rows = await sql`
    SELECT *
    FROM payments
    WHERE txnid = ${cleanTxnid}
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) return null;
  return mapPaymentRow(rows[0]);
}

export async function neonGetAllPayments(): Promise<PaymentWithRegistration[]> {
  const sql = getNeonSql();
  if (!sql) return [];
  await ensureDbInitialized();

  const rows = await sql`
    SELECT
      p.id as p_id,
      p.txnid,
      p.amount,
      p.course_name,
      p.course_id,
      p.student_name,
      p.email as p_email,
      p.phone as p_phone,
      p.status,
      p.payu_id,
      p.mode,
      p.bank_ref_num,
      p.error_message,
      p.created_at as p_created_at,
      p.updated_at as p_updated_at,
      r.id as r_id,
      r.full_name as r_full_name,
      r.dob,
      r.address,
      r.aadhar_card,
      r.gender,
      r.email as r_email,
      r.phone as r_phone,
      r.pan,
      r.occupation,
      r.submitted_at
    FROM payments p
    LEFT JOIN registrations r ON p.txnid = r.txnid
    ORDER BY p.created_at DESC;
  `;

  return rows.map((r: any) => {
    const payment: PaymentWithRegistration = {
      id: r.p_id,
      txnid: r.txnid,
      amount: Number(r.amount),
      courseName: r.course_name,
      courseId: r.course_id,
      studentName: r.student_name,
      email: r.p_email,
      phone: r.p_phone,
      status: r.status,
      payuId: r.payu_id || undefined,
      mode: r.mode || undefined,
      bankRefNum: r.bank_ref_num || undefined,
      errorMessage: r.error_message || undefined,
      createdAt: r.p_created_at ? new Date(r.p_created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.p_updated_at ? new Date(r.p_updated_at).toISOString() : new Date().toISOString()
    };

    if (r.r_id || r.r_full_name) {
      payment.registration = {
        id: r.r_id,
        txnid: r.txnid,
        fullName: r.r_full_name,
        dob: r.dob || '',
        address: r.address || '',
        aadharCard: r.aadhar_card || '',
        gender: r.gender || '',
        email: r.r_email || '',
        phone: r.r_phone || '',
        pan: r.pan || '',
        occupation: r.occupation || '',
        submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : new Date().toISOString()
      };
    } else {
      payment.registration = null;
    }

    return payment;
  });
}

// =========================================================================
// Student Registration (KYC Details post-payment)
// =========================================================================

export async function neonSaveRegistration(reg: StudentRegistration): Promise<boolean> {
  const sql = getNeonSql();
  if (!sql) return false;
  await ensureDbInitialized();

  const cleanTxnid = reg.txnid.trim();
  const id = reg.id ? String(reg.id) : `reg_${Date.now()}`;

  await sql`
    INSERT INTO registrations (
      id, txnid, full_name, dob, address, aadhar_card,
      gender, email, phone, pan, occupation, submitted_at
    )
    VALUES (
      ${id},
      ${cleanTxnid},
      ${reg.fullName.trim()},
      ${reg.dob},
      ${reg.address.trim()},
      ${reg.aadharCard.trim()},
      ${reg.gender},
      ${reg.email.trim().toLowerCase()},
      ${reg.phone.trim()},
      ${reg.pan.trim().toUpperCase()},
      ${reg.occupation.trim()},
      NOW()
    )
    ON CONFLICT (txnid) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      dob = EXCLUDED.dob,
      address = EXCLUDED.address,
      aadhar_card = EXCLUDED.aadhar_card,
      gender = EXCLUDED.gender,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      pan = EXCLUDED.pan,
      occupation = EXCLUDED.occupation,
      submitted_at = NOW();
  `;

  return true;
}

export async function neonGetRegistrationByTxnId(txnid: string): Promise<StudentRegistration | null> {
  const sql = getNeonSql();
  if (!sql) return null;
  await ensureDbInitialized();

  const cleanTxnid = txnid.trim();
  const rows = await sql`
    SELECT *
    FROM registrations
    WHERE txnid = ${cleanTxnid}
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    txnid: r.txnid,
    fullName: r.full_name,
    dob: r.dob,
    address: r.address,
    aadharCard: r.aadhar_card,
    gender: r.gender,
    email: r.email,
    phone: r.phone,
    pan: r.pan,
    occupation: r.occupation,
    submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : new Date().toISOString()
  };
}

export async function neonGetAllRegistrations(): Promise<StudentRegistration[]> {
  const sql = getNeonSql();
  if (!sql) return [];
  await ensureDbInitialized();

  const rows = await sql`
    SELECT *
    FROM registrations
    ORDER BY submitted_at DESC;
  `;

  return rows.map((r: any) => ({
    id: r.id,
    txnid: r.txnid,
    fullName: r.full_name,
    dob: r.dob,
    address: r.address,
    aadharCard: r.aadhar_card,
    gender: r.gender,
    email: r.email,
    phone: r.phone,
    pan: r.pan,
    occupation: r.occupation,
    submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : new Date().toISOString()
  }));
}

// =========================================================================
// Admin Dashboard Aggregates
// =========================================================================

export async function neonGetAdminStats(): Promise<AdminStats> {
  const sql = getNeonSql();
  if (!sql) {
    return {
      totalRevenue: 0,
      totalPayments: 0,
      successPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalUsers: 0,
      totalRegistrations: 0
    };
  }
  await ensureDbInitialized();

  try {
    const revenueRows = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_revenue,
             COUNT(*) as total_payments,
             COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_payments,
             COUNT(*) FILTER (WHERE status = 'PENDING') as pending_payments,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed_payments
      FROM payments;
    `;

    const usersRows = await sql`SELECT COUNT(*) as total_users FROM users;`;
    const regRows = await sql`SELECT COUNT(*) as total_registrations FROM registrations;`;

    const r = revenueRows[0] || {};
    return {
      totalRevenue: Number(r.total_revenue || 0),
      totalPayments: Number(r.total_payments || 0),
      successPayments: Number(r.success_payments || 0),
      pendingPayments: Number(r.pending_payments || 0),
      failedPayments: Number(r.failed_payments || 0),
      totalUsers: Number(usersRows[0]?.total_users || 0),
      totalRegistrations: Number(regRows[0]?.total_registrations || 0)
    };
  } catch (error) {
    console.error('neonGetAdminStats error:', error);
    return {
      totalRevenue: 0,
      totalPayments: 0,
      successPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalUsers: 0,
      totalRegistrations: 0
    };
  }
}

function mapPaymentRow(r: any): PaymentRecord {
  return {
    id: r.id,
    txnid: r.txnid,
    amount: Number(r.amount),
    courseName: r.course_name,
    courseId: r.course_id,
    studentName: r.student_name,
    email: r.email,
    phone: r.phone,
    status: r.status,
    payuId: r.payu_id || undefined,
    payuHash: r.payu_hash || undefined,
    mode: r.mode || undefined,
    bankRefNum: r.bank_ref_num || undefined,
    errorMessage: r.error_message || undefined,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
  };
}
