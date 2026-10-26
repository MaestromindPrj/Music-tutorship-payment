import { NextRequest, NextResponse } from 'next/server';
import { hasUserPaidConsultation, markConsultationPaid } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ hasPaidConsultation: false });
    }

    const hasPaid = hasUserPaidConsultation(email);
    return NextResponse.json({ hasPaidConsultation: hasPaid });
  } catch (err: any) {
    return NextResponse.json({ hasPaidConsultation: false, error: err?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, markPaid } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (markPaid) {
      markConsultationPaid(email);
    }

    const hasPaid = hasUserPaidConsultation(email);
    return NextResponse.json({ success: true, hasPaidConsultation: hasPaid });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
