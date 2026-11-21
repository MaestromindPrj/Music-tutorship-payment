import { NextRequest, NextResponse } from 'next/server';
import { neonGetAllCourses } from '@/lib/neon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const courses = await neonGetAllCourses();
    return NextResponse.json(
      { success: true, courses: courses || [] },
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
      { success: true, courses: [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  }
}
