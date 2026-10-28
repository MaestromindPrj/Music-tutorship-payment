import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createUserSessionToken, USER_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(email, password);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 400 }
      );
    }

    const sessionToken = createUserSessionToken(result.user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        hasPaidConsultation: result.user.hasPaidConsultation
      }
    });

    // Set secure HTTP-only cookie for student session isolation
    response.cookies.set({
      name: USER_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error during login' },
      { status: 500 }
    );
  }
}
