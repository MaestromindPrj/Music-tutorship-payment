import { PaymentRecord, StudentRegistration } from '@/types';

function getSheetsUrl(): string | null {
  const url = process.env.GOOGLE_SHEETS_API_URL || process.env.GOOGLE_SHEET_URL;
  if (!url || url.trim() === '') return null;
  return url.trim();
}

/**
 * Sends a POST request to Google Apps Script Web App
 */
async function callAppsScript(action: string, payload: any): Promise<any> {
  const scriptUrl = getSheetsUrl();
  if (!scriptUrl) return null;

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action,
        ...payload
      }),
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!res.ok) {
      console.warn(`Google Sheets API responded with status ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Google Sheets API call error (${action}):`, err?.message || err);
    return null;
  }
}

/**
 * Sends a GET request to Google Apps Script Web App
 */
async function queryAppsScript(action: string, params: Record<string, string>): Promise<any> {
  const scriptUrl = getSheetsUrl();
  if (!scriptUrl) return null;

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });

    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!res.ok) {
      console.warn(`Google Sheets query responded with status ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Google Sheets query error (${action}):`, err?.message || err);
    return null;
  }
}

export async function savePaymentToSheets(record: Omit<PaymentRecord, 'id'>): Promise<boolean> {
  const res = await callAppsScript('savePayment', { payment: record });
  return res?.success === true;
}

export async function updatePaymentStatusInSheets(
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
): Promise<boolean> {
  const res = await callAppsScript('updatePaymentStatus', {
    txnid,
    status,
    details
  });
  return res?.success === true;
}

export async function getPaymentFromSheets(txnid: string): Promise<PaymentRecord | null> {
  const res = await queryAppsScript('getPayment', { txnid });
  if (res?.success && res?.payment) {
    return {
      txnid: res.payment.txnid,
      amount: Number(res.payment.amount),
      courseName: res.payment.courseName,
      courseId: res.payment.courseId || 'mastery',
      studentName: res.payment.studentName,
      email: res.payment.email,
      phone: res.payment.phone,
      status: res.payment.status,
      payuId: res.payment.payuId,
      payuHash: res.payment.payuHash,
      mode: res.payment.mode,
      bankRefNum: res.payment.bankRefNum,
      errorMessage: res.payment.errorMessage,
      createdAt: res.payment.createdAt,
      updatedAt: res.payment.updatedAt
    };
  }
  return null;
}

export async function saveRegistrationToSheets(reg: Omit<StudentRegistration, 'id'>): Promise<boolean> {
  const res = await callAppsScript('saveRegistration', { registration: reg });
  return res?.success === true;
}

export async function getRegistrationFromSheets(txnid: string): Promise<StudentRegistration | null> {
  const res = await queryAppsScript('getRegistration', { txnid });
  if (res?.success && res?.registration) {
    return {
      txnid: res.registration.txnid,
      fullName: res.registration.fullName,
      dob: res.registration.dob,
      address: res.registration.address,
      aadharCard: res.registration.aadharCard,
      gender: res.registration.gender,
      email: res.registration.email,
      phone: res.registration.phone,
      pan: res.registration.pan,
      occupation: res.registration.occupation,
      submittedAt: res.registration.submittedAt
    };
  }
  return null;
}
