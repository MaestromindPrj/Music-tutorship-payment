import { NextRequest, NextResponse } from 'next/server';
import { getPayUConfig, generatePayUHash, generateTxnId } from '@/lib/payu';
import { getCourseById } from '@/lib/courses';
import { savePayment } from '@/lib/db';
import { PayUInitiatePayload, PayUFormData } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: PayUInitiatePayload = await req.json();
    const { courseId, customAmount, studentName, email, phone, notes } = body;

    if (!studentName || !email || !phone) {
      return NextResponse.json(
        { error: 'Please provide full name, email, and phone number' },
        { status: 400 }
      );
    }

    const course = getCourseById(courseId);
    const amount = course ? course.price : 49999;

    const amountFormatted = amount.toFixed(2);
    const txnid = generateTxnId();
    const courseName = course ? course.title : 'Music Production Course Fee';

    // Save initial transaction record to Google Sheets & memory cache
    await savePayment({
      txnid,
      amount,
      courseName,
      courseId,
      studentName: studentName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      status: 'PENDING',
      errorMessage: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const config = getPayUConfig();
    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const surl = `${origin}/api/payu/callback`;
    const furl = `${origin}/api/payu/callback`;

    // Calculate PayU SHA-512 Hash
    const hash = generatePayUHash({
      key: config.merchantKey,
      txnid,
      amount: amountFormatted,
      productinfo: courseName.replace(/[^a-zA-Z0-9 ]/g, ' ').substring(0, 95),
      firstname: studentName.trim().split(' ')[0] || studentName.trim(),
      email: email.trim().toLowerCase(),
      udf1: courseId,
      udf2: phone.trim(),
      udf3: 'payments.musictutorship.in',
      udf4: '',
      udf5: '',
      salt: config.merchantSalt
    });

    // Route directly to official PayU production gateway
    const actionUrl = config.paymentUrl;

    const formData: PayUFormData = {
      key: config.merchantKey,
      txnid,
      amount: amountFormatted,
      productinfo: courseName.replace(/[^a-zA-Z0-9 ]/g, ' ').substring(0, 95),
      firstname: studentName.trim().split(' ')[0] || studentName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      surl,
      furl,
      service_provider: 'payu_paisa',
      udf1: courseId,
      udf2: phone.trim(),
      udf3: 'payments.musictutorship.in',
      udf4: '',
      udf5: '',
      hash,
      actionUrl
    };

    return NextResponse.json({
      success: true,
      txnid,
      amount,
      courseName,
      formData
    });
  } catch (error: any) {
    console.error('PayU initiation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate PayU payment transaction' },
      { status: 500 }
    );
  }
}
