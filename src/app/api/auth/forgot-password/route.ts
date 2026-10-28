import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    const result = await resetPassword(email, newPassword);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reset password' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error during password reset' },
      { status: 500 }
    );
  }
}
