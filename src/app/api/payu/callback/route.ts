import { NextRequest, NextResponse } from 'next/server';
import { getPayUConfig, verifyPayUResponseHash } from '@/lib/payu';
import { updatePaymentStatus } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    let data: Record<string, string> = {};

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
    } else if (contentType.includes('application/json')) {
      data = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        data[key] = value;
      });
    }

    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      additionalCharges,
      hash,
      mihpayid,
      mode,
      bank_ref_num,
      error_Message
    } = data;

    if (!txnid) {
      return NextResponse.redirect(new URL('/?error=missing_txnid', req.url), 303);
    }

    const config = getPayUConfig();

    let isVerified = false;
    if (hash) {
      isVerified = verifyPayUResponseHash({
        status: status || '',
        txnid: txnid || '',
        amount: amount || '',
        productinfo: productinfo || '',
        firstname: firstname || '',
        email: email || '',
        udf1: udf1 || '',
        udf2: udf2 || '',
        udf3: udf3 || '',
        udf4: udf4 || '',
        udf5: udf5 || '',
        additionalCharges,
        receivedHash: hash,
        salt: config.merchantSalt,
        key: config.merchantKey
      });
    }

    const isSuccess = (status?.toLowerCase() === 'success' || status?.toLowerCase() === 'captured') && isVerified;

    // Update Google Sheets & cache with verified transaction status
    await updatePaymentStatus(
      txnid,
      isSuccess ? 'SUCCESS' : 'FAILED',
      {
        payuId: mihpayid,
        payuHash: hash,
        mode: mode || 'ONLINE',
        bankRefNum: bank_ref_num,
        errorMessage: isSuccess ? undefined : (error_Message || 'Payment transaction was declined or failed hash verification'),
        amount: amount ? Number(amount) : undefined,
        courseName: productinfo || undefined,
        courseId: udf1 || undefined,
        studentName: firstname || undefined,
        email: email || undefined,
        phone: udf2 || undefined
      }
    );

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (isSuccess) {
      // Redirect to the mandatory registration form after payment
      return NextResponse.redirect(new URL(`/register?txnid=${encodeURIComponent(txnid)}`, origin), 303);
    } else {
      // Redirect to failure view on homepage
      return NextResponse.redirect(
        new URL(`/?status=failed&txnid=${encodeURIComponent(txnid)}&error=${encodeURIComponent(error_Message || 'Transaction failed')}`, origin),
        303
      );
    }
  } catch (err: any) {
    console.error('PayU callback handling error:', err);
    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL(`/?status=error&error=${encodeURIComponent(err?.message || 'Callback error')}`, origin), 303);
  }
}

export async function GET(req: NextRequest) {
  // Support GET fallback if user returns via GET redirect
  const searchParams = req.nextUrl.searchParams;
  const txnid = searchParams.get('txnid');
  const status = searchParams.get('status');

  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (txnid && status === 'success') {
    return NextResponse.redirect(new URL(`/register?txnid=${encodeURIComponent(txnid)}`, origin), 303);
  }
  return NextResponse.redirect(new URL('/', origin), 303);
}
