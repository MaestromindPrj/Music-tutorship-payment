import { NextRequest, NextResponse } from 'next/server';
import { neonGetAllCourses } from '@/lib/neon';
import { getCourses } from '@/lib/courses';

export async function GET(req: NextRequest) {
  try {
    let courses = await neonGetAllCourses();
    if (!courses || courses.length === 0) {
      courses = getCourses();
    }
    return NextResponse.json({ success: true, courses });
  } catch (err: any) {
    return NextResponse.json({ success: true, courses: getCourses() });
  }
}
