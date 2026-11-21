import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import {
  getAllPaymentsForAdmin,
  getAllRegistrationsForAdmin,
  getAdminDashboardStats
} from '@/lib/db';
import { getAllUsersForAdmin } from '@/lib/auth';
import { neonGetAllCourses, getDatabaseUrl } from '@/lib/neon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      neonGetAllCourses().then((list) => list || []).catch(() => [])
    ]);

    const isConnectedToNeon = !!getDatabaseUrl();

    return NextResponse.json(
      {
        success: true,
        neonConnected: isConnectedToNeon,
        stats,
        payments,
        registrations,
        users,
        courses
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  } catch (error: any) {
    console.error('Admin data fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin data' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  }
}
