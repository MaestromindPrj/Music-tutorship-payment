import { NextRequest, NextResponse } from 'next/server';
import { hasUserPaidConsultation, markConsultationPaid, findUserByEmail } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ hasPaidConsultation: false, allowedCourses: [] });
    }

    const [hasPaid, user] = await Promise.all([
      hasUserPaidConsultation(email),
      findUserByEmail(email)
    ]);

    return NextResponse.json({
      hasPaidConsultation: hasPaid,
      allowedCourses: user?.allowedCourses || []
    });
  } catch (err: any) {
    return NextResponse.json({ hasPaidConsultation: false, allowedCourses: [], error: err?.message });
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
      await markConsultationPaid(email);
    }

    const [hasPaid, user] = await Promise.all([
      hasUserPaidConsultation(email),
      findUserByEmail(email)
    ]);

    return NextResponse.json({
      success: true,
      hasPaidConsultation: hasPaid,
      allowedCourses: user?.allowedCourses || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
