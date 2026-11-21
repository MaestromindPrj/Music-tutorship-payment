import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { adminDeleteUser } from '@/lib/auth';

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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await adminDeleteUser(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete user account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error while deleting user account' },
      { status: 500 }
    );
  }
}
