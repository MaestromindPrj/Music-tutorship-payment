import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { adminCreateUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin session
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, password, name, hasPaidConsultation } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await adminCreateUser({
      email,
      password,
      name,
      hasPaidConsultation: Boolean(hasPaidConsultation)
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Failed to create user account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        hasPaidConsultation: result.user.hasPaidConsultation,
        createdAt: result.user.createdAt
      }
    });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error while creating user' },
      { status: 500 }
    );
  }
}

