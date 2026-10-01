import { neon } from '@neondatabase/serverless';
import { PaymentRecord, StudentRegistration } from '@/types';

// In-memory fallback store for development or testing
const memoryStore = {
  payments: new Map<string, PaymentRecord>(),
  registrations: new Map<string, StudentRegistration>()
};

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '') {
    return null;
  }
  try {
    return neon(databaseUrl);
  } catch (err) {
    console.warn('Failed to initialize Neon client:', err);
    return null;
  }
}

// Ensure database tables exist in Neon PostgreSQL
let tablesInitialized = false;
export async function initDbSchema() {
  if (tablesInitialized) return;
  const sql = getDb();
  if (!sql) return;

  try {
    // 1. Payments table
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        txnid VARCHAR(64) UNIQUE NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        course_id VARCHAR(64) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        payu_id VARCHAR(128),
        payu_hash TEXT,
        mode VARCHAR(64),
        bank_ref_num VARCHAR(128),
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 2. Student Registrations table with strictly 9 KYC fields
    await sql`
      CREATE TABLE IF NOT EXISTS student_registrations (
        id SERIAL PRIMARY KEY,
        txnid VARCHAR(64) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        address TEXT NOT NULL,
        aadhar_card VARCHAR(20) NOT NULL,
        gender VARCHAR(32) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        pan VARCHAR(20) NOT NULL,
        occupation VARCHAR(128) NOT NULL,
        submitted_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    tablesInitialized = true;
  } catch (error) {
    console.error('Error initializing Neon database schema:', error);
  }
}

// Payment operations
export async function savePayment(record: Omit<PaymentRecord, 'id'>): Promise<PaymentRecord> {
  const sql = getDb();
  
  const savedRecord: PaymentRecord = {
    ...record,
    id: `pay_${Date.now()}`
  };
  memoryStore.payments.set(record.txnid, savedRecord);

  if (sql) {
    try {
      await initDbSchema();
      const res = await sql`
        INSERT INTO payments (
          txnid, amount, course_name, course_id, student_name, email, phone, status, payu_id, payu_hash, mode, bank_ref_num, error_message, created_at, updated_at
        ) VALUES (
          ${record.txnid}, ${record.amount}, ${record.courseName}, ${record.courseId}, 
          ${record.studentName}, ${record.email}, ${record.phone}, ${record.status}, 
          ${record.payuId || null}, ${record.payuHash || null}, ${record.mode || null}, 
          ${record.bankRefNum || null}, ${record.errorMessage || null}, NOW(), NOW()
        )
        ON CONFLICT (txnid) DO UPDATE SET
          status = EXCLUDED.status,
          payu_id = EXCLUDED.payu_id,
          payu_hash = EXCLUDED.payu_hash,
          mode = EXCLUDED.mode,
          bank_ref_num = EXCLUDED.bank_ref_num,
          error_message = EXCLUDED.error_message,
          updated_at = NOW()
        RETURNING *;
      `;
      if (res && res.length > 0) {
        const row = res[0];
        return {
          id: row.id,
          txnid: row.txnid,
          amount: Number(row.amount),
          courseName: row.course_name,
          courseId: row.course_id,
          studentName: row.student_name,
          email: row.email,
          phone: row.phone,
          status: row.status,
          payuId: row.payu_id,
          payuHash: row.payu_hash,
          mode: row.mode,
          bankRefNum: row.bank_ref_num,
          errorMessage: row.error_message,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (err) {
      console.error('Neon DB savePayment error:', err);
    }
  }

  return savedRecord;
}

export async function updatePaymentStatus(
  txnid: string, 
  status: 'PENDING' | 'SUCCESS' | 'FAILED', 
  details?: {
    payuId?: string;
    payuHash?: string;
    mode?: string;
    bankRefNum?: string;
    errorMessage?: string;
  }
): Promise<PaymentRecord | null> {
  const existing = memoryStore.payments.get(txnid);
  if (existing) {
    existing.status = status;
    if (details?.payuId) existing.payuId = details.payuId;
    if (details?.payuHash) existing.payuHash = details.payuHash;
    if (details?.mode) existing.mode = details.mode;
    if (details?.bankRefNum) existing.bankRefNum = details.bankRefNum;
    if (details?.errorMessage) existing.errorMessage = details.errorMessage;
    existing.updatedAt = new Date().toISOString();
    memoryStore.payments.set(txnid, existing);
  }

  const sql = getDb();
  if (sql) {
    try {
      await initDbSchema();
      const res = await sql`
        UPDATE payments SET
          status = ${status},
          payu_id = COALESCE(${details?.payuId || null}, payu_id),
          payu_hash = COALESCE(${details?.payuHash || null}, payu_hash),
          mode = COALESCE(${details?.mode || null}, mode),
          bank_ref_num = COALESCE(${details?.bankRefNum || null}, bank_ref_num),
          error_message = COALESCE(${details?.errorMessage || null}, error_message),
          updated_at = NOW()
        WHERE txnid = ${txnid}
        RETURNING *;
      `;
      if (res && res.length > 0) {
        const row = res[0];
        return {
          id: row.id,
          txnid: row.txnid,
          amount: Number(row.amount),
          courseName: row.course_name,
          courseId: row.course_id,
          studentName: row.student_name,
          email: row.email,
          phone: row.phone,
          status: row.status,
          payuId: row.payu_id,
          payuHash: row.payu_hash,
          mode: row.mode,
          bankRefNum: row.bank_ref_num,
          errorMessage: row.error_message,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (err) {
      console.error('Neon DB updatePaymentStatus error:', err);
    }
  }

  return existing || null;
}

export async function getPaymentByTxnId(txnid: string): Promise<PaymentRecord | null> {
  const sql = getDb();
  if (sql) {
    try {
      await initDbSchema();
      const res = await sql`SELECT * FROM payments WHERE txnid = ${txnid} LIMIT 1;`;
      if (res && res.length > 0) {
        const row = res[0];
        return {
          id: row.id,
          txnid: row.txnid,
          amount: Number(row.amount),
          courseName: row.course_name,
          courseId: row.course_id,
          studentName: row.student_name,
          email: row.email,
          phone: row.phone,
          status: row.status,
          payuId: row.payu_id,
          payuHash: row.payu_hash,
          mode: row.mode,
          bankRefNum: row.bank_ref_num,
          errorMessage: row.error_message,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (err) {
      console.error('Neon DB getPaymentByTxnId error:', err);
    }
  }

  return memoryStore.payments.get(txnid) || null;
}

// Student Registration KYC operations (strictly 9 fields)
export async function saveStudentRegistration(
  reg: Omit<StudentRegistration, 'id'>
): Promise<StudentRegistration> {
  const sql = getDb();

  const savedReg: StudentRegistration = {
    ...reg,
    id: `reg_${Date.now()}`
  };
  memoryStore.registrations.set(reg.txnid, savedReg);

  if (sql) {
    try {
      await initDbSchema();
      const res = await sql`
        INSERT INTO student_registrations (
          txnid, full_name, dob, address, aadhar_card, gender, email, phone, pan, occupation, submitted_at
        ) VALUES (
          ${reg.txnid}, ${reg.fullName}, ${reg.dob}, ${reg.address}, ${reg.aadharCard},
          ${reg.gender}, ${reg.email}, ${reg.phone}, ${reg.pan}, ${reg.occupation}, NOW()
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
          submitted_at = NOW()
        RETURNING *;
      `;
      if (res && res.length > 0) {
        const row = res[0];
        return {
          id: row.id,
          txnid: row.txnid,
          fullName: row.full_name,
          dob: row.dob,
          address: row.address,
          aadharCard: row.aadhar_card,
          gender: row.gender,
          email: row.email,
          phone: row.phone,
          pan: row.pan,
          occupation: row.occupation,
          submittedAt: row.submitted_at
        };
      }
    } catch (err) {
      console.error('Neon DB saveStudentRegistration error:', err);
    }
  }

  return savedReg;
}

export async function getRegistrationByTxnId(txnid: string): Promise<StudentRegistration | null> {
  const sql = getDb();
  if (sql) {
    try {
      await initDbSchema();
      const res = await sql`SELECT * FROM student_registrations WHERE txnid = ${txnid} LIMIT 1;`;
      if (res && res.length > 0) {
        const row = res[0];
        return {
          id: row.id,
          txnid: row.txnid,
          fullName: row.full_name,
          dob: row.dob,
          address: row.address,
          aadharCard: row.aadhar_card,
          gender: row.gender,
          email: row.email,
          phone: row.phone,
          pan: row.pan,
          occupation: row.occupation,
          submittedAt: row.submitted_at
        };
      }
    } catch (err) {
      console.error('Neon DB getRegistrationByTxnId error:', err);
    }
  }

  return memoryStore.registrations.get(txnid) || null;
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  const sql = getDb();
  if (sql) {
    try {
      await initDbSchema();
      const res = await sql`SELECT * FROM payments ORDER BY created_at DESC LIMIT 100;`;
      if (res) {
        return res.map((row) => ({
          id: row.id,
          txnid: row.txnid,
          amount: Number(row.amount),
          courseName: row.course_name,
          courseId: row.course_id,
          studentName: row.student_name,
          email: row.email,
          phone: row.phone,
          status: row.status,
          payuId: row.payu_id,
          payuHash: row.payu_hash,
          mode: row.mode,
          bankRefNum: row.bank_ref_num,
          errorMessage: row.error_message,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      }
    } catch (err) {
      console.error('Neon DB getAllPayments error:', err);
    }
  }

  return Array.from(memoryStore.payments.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAllRegistrations(): Promise<StudentRegistration[]> {
  const sql = getDb();
  if (sql) {
    try {
      await initDbSchema();
      const res = await sql`SELECT * FROM student_registrations ORDER BY submitted_at DESC LIMIT 100;`;
      if (res) {
        return res.map((row) => ({
          id: row.id,
          txnid: row.txnid,
          fullName: row.full_name,
          dob: row.dob,
          address: row.address,
          aadharCard: row.aadhar_card,
          gender: row.gender,
          email: row.email,
          phone: row.phone,
          pan: row.pan,
          occupation: row.occupation,
          submittedAt: row.submitted_at
        }));
      }
    } catch (err) {
      console.error('Neon DB getAllRegistrations error:', err);
    }
  }

  return Array.from(memoryStore.registrations.values());
}
