import { NextRequest, NextResponse } from 'next/server';
import { getPaymentByTxnId, getRegistrationByTxnId } from '@/lib/db';
import { getCourseById } from '@/lib/courses';

export async function GET(req: NextRequest) {
  try {
    const txnid = req.nextUrl.searchParams.get('txnid');
    if (!txnid) {
      return NextResponse.json({ error: 'Missing txnid parameter' }, { status: 400 });
    }

    const payment = await getPaymentByTxnId(txnid);
    if (!payment) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
    }

    const registration = await getRegistrationByTxnId(txnid);
    const course = getCourseById(payment.courseId);

    return NextResponse.json({
      success: true,
      payment,
      registration,
      course
    });
  } catch (err: any) {
    console.error('Fetch payment details error:', err);
    return NextResponse.json({ error: 'Failed to retrieve transaction details' }, { status: 500 });
  }
}
