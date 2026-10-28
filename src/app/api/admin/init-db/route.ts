import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { initDb, getDatabaseUrl } from '@/lib/neon';

export async function POST(req: NextRequest) {
  try {
    const isAuthed = checkAdminAuth(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL environment variable is not configured yet. Please add your Neon connection string in .env.local or production environment variables.'
      }, { status: 400 });
    }

    const result = await initDb();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin initDb error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Database initialization error' },
      { status: 500 }
    );
  }
}
