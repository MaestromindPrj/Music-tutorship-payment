import { NextRequest, NextResponse } from 'next/server';
import { getPayUConfig, generatePayUHash, generateTxnId } from '@/lib/payu';
import { neonGetCourseById, neonGetAllCourses } from '@/lib/neon';
import { getCourseById } from '@/lib/courses';
import { savePayment } from '@/lib/db';
import { hasUserPaidConsultation } from '@/lib/auth';
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

    const cleanEmail = email.trim().toLowerCase();
    const course = (await neonGetCourseById(courseId).catch(() => null)) || getCourseById(courseId);
    
    const hasConsultationCredit = await hasUserPaidConsultation(cleanEmail);

    if (courseId === 'call-consultation' && hasConsultationCredit) {
      return NextResponse.json(
        { error: 'Call consultation has already been booked by this account.' },
        { status: 400 }
      );
    }

    const isCallConsultation = courseId === 'call-consultation' || course?.type === 'consultation';
    let basePrice = course ? Number(course.price) : (customAmount || 0);

    if (!isCallConsultation && hasConsultationCredit) {
      try {
        const allCourses = await neonGetAllCourses();
        const consultCourse = allCourses.find((c) => c.type === 'consultation' || c.id === 'call-consultation');
        const creditAmount = consultCourse ? Number(consultCourse.price) : 0;
        basePrice = Math.max(0, basePrice - creditAmount);
      } catch (e) {
      }
    }

    const taxRate = course?.taxRate !== undefined && course?.taxRate !== null
      ? Number(course.taxRate)
      : (isCallConsultation ? 0 : 0.18);
    const taxAmount = Number((basePrice * taxRate).toFixed(2));
    const totalAmount = Number((basePrice + taxAmount).toFixed(2));

    const amountFormatted = totalAmount.toFixed(2);
    const txnid = generateTxnId();
    const courseName = course ? course.title : 'Music Production Course Fee';

    await savePayment({
      txnid,
      amount: totalAmount,
      courseName,
      courseId,
      studentName: studentName.trim(),
      email: cleanEmail,
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

    const hash = generatePayUHash({
      key: config.merchantKey,
      txnid,
      amount: amountFormatted,
      productinfo: courseName.replace(/[^a-zA-Z0-9 ]/g, ' ').substring(0, 95),
      firstname: studentName.trim().split(' ')[0] || studentName.trim(),
      email: cleanEmail,
      udf1: courseId,
      udf2: phone.trim(),
      udf3: 'payments.musictutorship.in',
      udf4: '',
      udf5: '',
      salt: config.merchantSalt
    });

    const actionUrl = config.paymentUrl;

    const formData: PayUFormData = {
      key: config.merchantKey,
      txnid,
      amount: amountFormatted,
      productinfo: courseName.replace(/[^a-zA-Z0-9 ]/g, ' ').substring(0, 95),
      firstname: studentName.trim().split(' ')[0] || studentName.trim(),
      email: cleanEmail,
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
      amount: totalAmount,
      basePrice,
      taxAmount,
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
