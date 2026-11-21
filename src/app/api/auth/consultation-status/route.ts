import { NextRequest, NextResponse } from 'next/server';
import { hasUserPaidConsultation, markConsultationPaid, findUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        { hasPaidConsultation: false, allowedCourses: [] },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const [hasPaid, user] = await Promise.all([
      hasUserPaidConsultation(email),
      findUserByEmail(email)
    ]);

    return NextResponse.json(
      {
        hasPaidConsultation: hasPaid,
        allowedCourses: user?.allowedCourses || []
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { hasPaidConsultation: false, allowedCourses: [], error: err?.message },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
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

    return NextResponse.json(
      {
        success: true,
        hasPaidConsultation: hasPaid,
        allowedCourses: user?.allowedCourses || []
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
