import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { neonGetAllCourses, neonSaveCourse, neonUpdateCourse, neonDeleteCourse } from '@/lib/neon';
import { getCourses } from '@/lib/courses';
import { Course } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });

    let list = await neonGetAllCourses();
    if (!list || list.length === 0) {
      list = getCourses();
    }
    return NextResponse.json({ success: true, courses: list });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });

    const body = await req.json();
    const { title, tag, duration, batchSize, price } = body;
    if (!title || !tag || price === undefined) {
      return NextResponse.json({ error: 'Title, tag and price are required' }, { status: 400 });
    }

    const id = body.id?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCourse: Course = {
      id,
      title: title.trim(),
      subtitle: body.subtitle?.trim() || undefined,
      tag: tag.trim(),
      badge: body.badge?.trim() || undefined,
      price: Number(price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      duration: duration?.trim() || 'Custom Duration',
      batchSize: batchSize?.trim() || 'Standard Batch',
      features: Array.isArray(body.features) ? body.features : (body.featuresStr ? body.featuresStr.split('\n').map((s: string) => s.trim()).filter(Boolean) : []),
      type: body.type === 'consultation' ? 'consultation' : 'course',
      taxRate: body.taxRate !== undefined ? Number(body.taxRate) : (body.type === 'consultation' ? 0 : 0.18),
      popular: Boolean(body.popular),
      disabled: Boolean(body.disabled),
      orderIndex: body.orderIndex ? Number(body.orderIndex) : 0
    };

    await neonSaveCourse(newCourse);
    return NextResponse.json({ success: true, course: newCourse });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save course' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });

    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });

    const updates: Partial<Course> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.subtitle !== undefined) updates.subtitle = body.subtitle.trim();
    if (body.tag !== undefined) updates.tag = body.tag.trim();
    if (body.badge !== undefined) updates.badge = body.badge.trim();
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.originalPrice !== undefined) updates.originalPrice = body.originalPrice ? Number(body.originalPrice) : undefined;
    if (body.duration !== undefined) updates.duration = body.duration.trim();
    if (body.batchSize !== undefined) updates.batchSize = body.batchSize.trim();
    if (body.features !== undefined) updates.features = Array.isArray(body.features) ? body.features : [];
    if (body.featuresStr !== undefined) updates.features = body.featuresStr.split('\n').map((s: string) => s.trim()).filter(Boolean);
    if (body.type !== undefined) updates.type = body.type;
    if (body.taxRate !== undefined) updates.taxRate = Number(body.taxRate);
    if (body.popular !== undefined) updates.popular = Boolean(body.popular);
    if (body.disabled !== undefined) updates.disabled = Boolean(body.disabled);
    if (body.orderIndex !== undefined) updates.orderIndex = Number(body.orderIndex);

    await neonUpdateCourse(id, updates);
    return NextResponse.json({ success: true, message: 'Course updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });

    await neonDeleteCourse(id);
    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete course' }, { status: 500 });
  }
}

