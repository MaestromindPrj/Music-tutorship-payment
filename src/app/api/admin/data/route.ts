import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import {
  getAllPaymentsForAdmin,
  getAllRegistrationsForAdmin,
  getAdminDashboardStats
} from '@/lib/db';
import { getAllUsersForAdmin } from '@/lib/auth';
import { getDatabaseUrl } from '@/lib/neon';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin session
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    // 2. Query data in parallel
    const [stats, payments, registrations, users] = await Promise.all([
      getAdminDashboardStats(),
      getAllPaymentsForAdmin(),
      getAllRegistrationsForAdmin(),
      getAllUsersForAdmin()
    ]);

    const isConnectedToNeon = !!getDatabaseUrl();

    return NextResponse.json({
      success: true,
      neonConnected: isConnectedToNeon,
      stats,
      payments,
      registrations,
      users
    });
  } catch (error: any) {
    console.error('Admin data fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
