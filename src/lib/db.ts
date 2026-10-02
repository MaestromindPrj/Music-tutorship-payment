import { PaymentRecord, StudentRegistration } from '@/types';
import {
  savePaymentToSheets,
  updatePaymentStatusInSheets,
  getPaymentFromSheets,
  saveRegistrationToSheets,
  getRegistrationFromSheets
} from './sheets';

// In-memory cache store for high-speed sub-millisecond response
const memoryStore = {
  payments: new Map<string, PaymentRecord>(),
  registrations: new Map<string, StudentRegistration>()
};

// =========================================================================
// Payment Operations (100% Google Sheets Storage + In-Memory Cache)
// =========================================================================

export async function savePayment(record: Omit<PaymentRecord, 'id'>): Promise<PaymentRecord> {
  const cleanTxnid = record.txnid.trim();
  const savedRecord: PaymentRecord = {
    ...record,
    txnid: cleanTxnid,
    id: `pay_${Date.now()}`
  };

  // 1. Save in fast cache
  memoryStore.payments.set(cleanTxnid, savedRecord);

  // 2. Persist to Google Sheets
  await savePaymentToSheets(savedRecord).catch((e) =>
    console.warn('Google Sheets savePayment note:', e)
  );

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
    amount?: number;
    courseName?: string;
    courseId?: string;
    studentName?: string;
    email?: string;
    phone?: string;
  }
): Promise<PaymentRecord | null> {
  const cleanTxnid = txnid.trim();

  // 1. Update in-memory cache
  const existing = memoryStore.payments.get(cleanTxnid);
  let updatedRecord: PaymentRecord;

  if (existing) {
    existing.status = status;
    if (details?.payuId) existing.payuId = details.payuId;
    if (details?.payuHash) existing.payuHash = details.payuHash;
    if (details?.mode) existing.mode = details.mode;
    if (details?.bankRefNum) existing.bankRefNum = details.bankRefNum;
    if (details?.errorMessage) existing.errorMessage = details.errorMessage;
    if (details?.amount !== undefined) existing.amount = details.amount;
    if (details?.courseName) existing.courseName = details.courseName;
    if (details?.courseId) existing.courseId = details.courseId;
    if (details?.studentName) existing.studentName = details.studentName;
    if (details?.email) existing.email = details.email;
    if (details?.phone) existing.phone = details.phone;
    existing.updatedAt = new Date().toISOString();
    memoryStore.payments.set(cleanTxnid, existing);
    updatedRecord = existing;
  } else {
    updatedRecord = {
      txnid: cleanTxnid,
      amount: details?.amount || 1,
      courseName: details?.courseName || 'Complete Music Production Mastery Course',
      courseId: details?.courseId || 'mastery',
      studentName: details?.studentName || 'Student',
      email: details?.email || '',
      phone: details?.phone || '',
      status,
      payuId: details?.payuId,
      payuHash: details?.payuHash,
      mode: details?.mode,
      bankRefNum: details?.bankRefNum,
      errorMessage: details?.errorMessage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memoryStore.payments.set(cleanTxnid, updatedRecord);
  }

  // 2. Persist update to Google Sheets
  await updatePaymentStatusInSheets(cleanTxnid, status, details).catch((e) =>
    console.warn('Google Sheets updatePaymentStatus note:', e)
  );

  return updatedRecord;
}

export async function getPaymentByTxnId(txnid: string): Promise<PaymentRecord | null> {
  const cleanTxnid = txnid ? txnid.trim() : '';
  if (!cleanTxnid) return null;

  // 1. Check in-memory cache
  const cached = memoryStore.payments.get(cleanTxnid);
  if (cached) return cached;

  // 2. Query Google Sheets
  const sheetPayment = await getPaymentFromSheets(cleanTxnid);
  if (sheetPayment) {
    memoryStore.payments.set(cleanTxnid, sheetPayment);
    return sheetPayment;
  }

  return null;
}

// =========================================================================
// Student Registration KYC Operations (Strictly 9 Fields)
// =========================================================================

export async function saveStudentRegistration(
  reg: Omit<StudentRegistration, 'id'>
): Promise<StudentRegistration> {
  const cleanTxnid = reg.txnid.trim();
  const savedReg: StudentRegistration = {
    ...reg,
    txnid: cleanTxnid,
    id: `reg_${Date.now()}`
  };

  // 1. Save in fast cache
  memoryStore.registrations.set(cleanTxnid, savedReg);

  // 2. Persist to Google Sheets
  await saveRegistrationToSheets(savedReg).catch((e) =>
    console.warn('Google Sheets saveRegistration note:', e)
  );

  return savedReg;
}

export async function getRegistrationByTxnId(txnid: string): Promise<StudentRegistration | null> {
  const cleanTxnid = txnid ? txnid.trim() : '';
  if (!cleanTxnid) return null;

  // 1. Check in-memory cache
  const cached = memoryStore.registrations.get(cleanTxnid);
  if (cached) return cached;

  // 2. Query Google Sheets
  const sheetReg = await getRegistrationFromSheets(cleanTxnid);
  if (sheetReg) {
    memoryStore.registrations.set(cleanTxnid, sheetReg);
    return sheetReg;
  }

  return null;
}
