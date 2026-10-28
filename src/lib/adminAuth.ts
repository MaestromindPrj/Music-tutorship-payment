import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getNeonSql, ensureDbInitialized } from './neon';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@musictutorship.in';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@MusicTutorship2025';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'music-tutorship-admin-secret-jwt-key-2025';

export const ADMIN_COOKIE_NAME = 'mt_admin_session';

/**
 * Creates a signed HMAC token for admin session
 */
export function createAdminToken(email: string): string {
  const payload = {
    email,
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days validity
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the admin token HMAC signature and expiration
 */
export function verifyAdminToken(token?: string | null): { valid: boolean; email?: string } {
  if (!token) return { valid: false };

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', ADMIN_SECRET)
      .update(payloadB64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false };
    }

    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    if (payload.role !== 'admin' || !payload.exp || Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, email: payload.email };
  } catch {
    return { valid: false };
  }
}

/**
 * Validates admin credentials against environment variables or admin_users database table
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check against environment credentials
  if (
    cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() &&
    password === DEFAULT_ADMIN_PASSWORD
  ) {
    return {
      success: true,
      user: {
        id: 'admin_root',
        email: cleanEmail,
        name: 'Music Tutorship Administrator'
      }
    };
  }

  // 2. Check in Neon PostgreSQL admin_users table
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureDbInitialized();
      const rows = await sql`
        SELECT id, email, password, name
        FROM admin_users
        WHERE email = ${cleanEmail}
        LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        const row = rows[0];
        if (row.password === password) {
          return {
            success: true,
            user: {
              id: row.id,
              email: row.email,
              name: row.name
            }
          };
        }
      }
    } catch (e) {
      console.warn('Neon admin check error:', e);
    }
  }

  return { success: false, error: 'Invalid admin credentials.' };
}

/**
 * Checks if incoming request has a valid admin session cookie
 */
export function checkAdminAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) return false;
  const result = verifyAdminToken(cookie.value);
  return result.valid;
}
