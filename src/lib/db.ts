import { PaymentRecord, StudentRegistration } from '@/types';
import {
  neonSavePayment,
  neonUpdatePaymentStatus,
  neonGetPaymentByTxnId,
  neonSaveRegistration,
  neonGetRegistrationByTxnId,
  neonGetAllPayments,
  neonGetAllRegistrations,
  neonGetAdminStats,
  PaymentWithRegistration,
  AdminStats
} from './neon';

const memoryStore = {
  payments: new Map<string, PaymentRecord>(),
  registrations: new Map<string, StudentRegistration>()
};

export async function savePayment(record: Omit<PaymentRecord, 'id'>): Promise<PaymentRecord> {
  const cleanTxnid = record.txnid.trim();
  const savedRecord: PaymentRecord = {
    ...record,
    txnid: cleanTxnid,
    id: `pay_${Date.now()}`
  };

  memoryStore.payments.set(cleanTxnid, savedRecord);

  await neonSavePayment(savedRecord).catch((e) =>
    console.warn('Neon PostgreSQL savePayment note:', e)
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

  const neonUpdated = await neonUpdatePaymentStatus(cleanTxnid, status, details).catch((e) => {
    console.warn('Neon PostgreSQL updatePaymentStatus note:', e);
    return null;
  });

  if (neonUpdated) {
    memoryStore.payments.set(cleanTxnid, neonUpdated);
    updatedRecord = neonUpdated;
  }

  return updatedRecord;
}

export async function getPaymentByTxnId(txnid: string): Promise<PaymentRecord | null> {
  const cleanTxnid = txnid ? txnid.trim() : '';
  if (!cleanTxnid) return null;

  const cached = memoryStore.payments.get(cleanTxnid);
  if (cached) return cached;

  const neonPayment = await neonGetPaymentByTxnId(cleanTxnid).catch((e) => {
    console.warn('Neon PostgreSQL getPaymentByTxnId note:', e);
    return null;
  });
  if (neonPayment) {
    memoryStore.payments.set(cleanTxnid, neonPayment);
    return neonPayment;
  }

  return null;
}

export async function saveStudentRegistration(
  reg: Omit<StudentRegistration, 'id'>
): Promise<StudentRegistration> {
  const cleanTxnid = reg.txnid.trim();
  const savedReg: StudentRegistration = {
    ...reg,
    txnid: cleanTxnid,
    id: `reg_${Date.now()}`
  };

  memoryStore.registrations.set(cleanTxnid, savedReg);

  await neonSaveRegistration(savedReg).catch((e) =>
    console.warn('Neon PostgreSQL saveStudentRegistration note:', e)
  );

  return savedReg;
}

export async function getRegistrationByTxnId(txnid: string): Promise<StudentRegistration | null> {
  const cleanTxnid = txnid ? txnid.trim() : '';
  if (!cleanTxnid) return null;

  const cached = memoryStore.registrations.get(cleanTxnid);
  if (cached) return cached;

  const neonReg = await neonGetRegistrationByTxnId(cleanTxnid).catch((e) => {
    console.warn('Neon PostgreSQL getRegistrationByTxnId note:', e);
    return null;
  });
  if (neonReg) {
    memoryStore.registrations.set(cleanTxnid, neonReg);
    return neonReg;
  }

  return null;
}

export async function getAllPaymentsForAdmin(): Promise<PaymentWithRegistration[]> {
  const neonPayments = await neonGetAllPayments().catch((e) => {
    console.warn('Neon getAllPayments error:', e);
    return [];
  });

  if (neonPayments.length > 0) {
    return neonPayments;
  }

  const payments: PaymentWithRegistration[] = [];
  memoryStore.payments.forEach((payment) => {
    const registration = memoryStore.registrations.get(payment.txnid) || null;
    payments.push({
      ...payment,
      registration
    });
  });

  return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllRegistrationsForAdmin(): Promise<StudentRegistration[]> {
  const neonRegs = await neonGetAllRegistrations().catch((e) => {
    console.warn('Neon getAllRegistrations error:', e);
    return [];
  });

  if (neonRegs.length > 0) {
    return neonRegs;
  }

  return Array.from(memoryStore.registrations.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export async function getAdminDashboardStats(): Promise<AdminStats> {
  return await neonGetAdminStats();
}
