import { NextRequest, NextResponse } from 'next/server';
import { neonGetAllCourses } from '@/lib/neon';

export async function GET(req: NextRequest) {
  try {
    const courses = await neonGetAllCourses();
    return NextResponse.json({ success: true, courses: courses || [] });
  } catch (err: any) {
    return NextResponse.json({ success: true, courses: [] });
  }
}
