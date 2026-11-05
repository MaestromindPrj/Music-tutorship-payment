import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import {
  getAllPaymentsForAdmin,
  getAllRegistrationsForAdmin,
  getAdminDashboardStats
} from '@/lib/db';
import { getAllUsersForAdmin } from '@/lib/auth';
import { neonGetAllCourses, getDatabaseUrl } from '@/lib/neon';
import { getCourses } from '@/lib/courses';

export async function GET(req: NextRequest) {
  try {
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    const [stats, payments, registrations, users, courses] = await Promise.all([
      getAdminDashboardStats(),
      getAllPaymentsForAdmin(),
      getAllRegistrationsForAdmin(),
      getAllUsersForAdmin(),
      neonGetAllCourses().then((list) => (list && list.length > 0 ? list : getCourses())).catch(() => getCourses())
    ]);

    const isConnectedToNeon = !!getDatabaseUrl();

    return NextResponse.json({
      success: true,
      neonConnected: isConnectedToNeon,
      stats,
      payments,
      registrations,
      users,
      courses
    });
  } catch (error: any) {
    console.error('Admin data fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
