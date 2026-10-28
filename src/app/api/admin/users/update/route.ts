import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { adminUpdateUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, password, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password && !name) {
      return NextResponse.json(
        { error: 'Provide at least a new password or name to update' },
        { status: 400 }
      );
    }

    const result = await adminUpdateUser({
      email,
      password,
      name
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update user account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User credentials updated successfully'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error while updating user account' },
      { status: 500 }
    );
  }
}

