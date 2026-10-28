import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAdminToken, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Admin email and password are required' },
        { status: 400 }
      );
    }

    const authResult = await authenticateAdmin(email, password);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const token = createAdminToken(authResult.user.email);

    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name
      }
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error during admin authentication' },
      { status: 500 }
    );
  }
}
