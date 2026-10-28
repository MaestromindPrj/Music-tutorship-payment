import crypto from 'crypto';
import {
  neonFindUserByEmail,
  neonSaveUser,
  neonUpdateUser,
  neonUpdateUserPassword,
  neonMarkConsultationPaid,
  neonGetAllUsers,
  neonUpdateUserLastLogin
} from './neon';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  hasPaidConsultation: boolean;
  createdAt: string;
  lastLoginAt?: string;
  googleId?: string;
  avatarUrl?: string;
}

// In-memory cache for ultra-fast session validation
const userStore = new Map<string, UserAccount>();

// Track emails that have paid consultation
const consultationPaidEmails = new Set<string>();

// User Session Token Secret
const USER_SESSION_SECRET = process.env.USER_SESSION_SECRET || process.env.ADMIN_SECRET || 'music-tutorship-user-secret-2025';
export const USER_COOKIE_NAME = 'mt_user_session';

// =========================================================================
// Cryptographic Password Hashing (OWASP scrypt standard)
// =========================================================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith('scrypt:')) {
    const [, salt, hash] = storedHash.split(':');
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
    } catch {
      return false;
    }
  }
  // Backward compatibility with legacy plaintext accounts if any
  return storedHash === password;
}

// =========================================================================
// Student Session Management (Isolated from Admin)
// =========================================================================

export function createUserSessionToken(user: { id: string; email: string; name: string }): string {
  const payload = {
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name,
    role: 'student',
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', USER_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifyUserSessionToken(token?: string | null): {
  valid: boolean;
  user?: { id: string; email: string; name: string };
} {
  if (!token) return { valid: false };
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', USER_SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false };
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.role !== 'student' || !payload.exp || Date.now() > payload.exp) {
      return { valid: false };
    }
    return {
      valid: true,
      user: { id: payload.id, email: payload.email, name: payload.name }
    };
  } catch {
    return { valid: false };
  }
}

// =========================================================================
// Validation Helpers
// =========================================================================

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
}

// =========================================================================
// User Lookup & Core Registration
// =========================================================================

export async function findUserByEmail(email: string): Promise<UserAccount | undefined> {
  const cleanEmail = email.trim().toLowerCase();
  const cached = userStore.get(cleanEmail);
  if (cached) return cached;

  const dbUser = await neonFindUserByEmail(cleanEmail).catch((e) => {
    console.warn('Neon findUserByEmail note:', e);
    return null;
  });

  if (dbUser) {
    userStore.set(cleanEmail, dbUser);
    if (dbUser.hasPaidConsultation) {
      consultationPaidEmails.add(cleanEmail);
    }
    return dbUser;
  }

  return undefined;
}

/**
 * Creates a student account directly from Admin Dashboard
 */
export async function adminCreateUser(params: {
  email: string;
  password: string;
  name?: string;
  hasPaidConsultation?: boolean;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const passValidation = validatePassword(params.password);
  if (!passValidation.isValid) {
    return { success: false, error: passValidation.error };
  }

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    return { success: false, error: 'A student account with this email already exists.' };
  }

  const hashedPassword = hashPassword(params.password);
  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    name: params.name?.trim() || cleanEmail.split('@')[0],
    password: hashedPassword,
    hasPaidConsultation: Boolean(params.hasPaidConsultation),
    createdAt: new Date().toISOString()
  };

  userStore.set(cleanEmail, newUser);
  if (newUser.hasPaidConsultation) {
    consultationPaidEmails.add(cleanEmail);
  }

  // Persist to Neon PostgreSQL
  await neonSaveUser(newUser).catch((e) =>
    console.warn('Neon PostgreSQL saveUser note:', e)
  );

  return { success: true, user: newUser };
}

/**
 * Updates an existing student account from Admin Dashboard (Password / Name)
 */
export async function adminUpdateUser(params: {
  email: string;
  password?: string;
  name?: string;
}): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const existing = await findUserByEmail(cleanEmail);
  if (!existing) {
    return { success: false, error: 'Student account not found' };
  }

  let hashedPassword: string | undefined = undefined;
  if (params.password) {
    const passValidation = validatePassword(params.password);
    if (!passValidation.isValid) {
      return { success: false, error: passValidation.error };
    }
    hashedPassword = hashPassword(params.password);
  }

  // Persist update to Neon PostgreSQL
  await neonUpdateUser(cleanEmail, {
    password: hashedPassword,
    name: params.name?.trim()
  });

  // Update in-memory cache
  if (hashedPassword) existing.password = hashedPassword;
  if (params.name) existing.name = params.name.trim();
  userStore.set(cleanEmail, existing);

  return { success: true };
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  return await adminCreateUser({ email, password, name });
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const existing = await findUserByEmail(cleanEmail);
  if (!existing) {
    return { success: false, error: 'Account not found. Please contact admin for your login credentials.' };
  }

  const isPasswordValid = verifyPassword(password, existing.password);
  if (!isPasswordValid) {
    return { success: false, error: 'Incorrect password. Please verify and try again.' };
  }

  // Automatic upgrade: If stored password was legacy plaintext, upgrade to scrypt hash immediately
  if (!existing.password.startsWith('scrypt:')) {
    const upgradedHash = hashPassword(password);
    existing.password = upgradedHash;
    userStore.set(cleanEmail, existing);
    await neonUpdateUserPassword(cleanEmail, upgradedHash).catch(() => {});
  }

  // Sync consultation status
  if (consultationPaidEmails.has(cleanEmail)) {
    existing.hasPaidConsultation = true;
  }

  // Update last login in Neon
  await neonUpdateUserLastLogin(cleanEmail).catch((e) =>
    console.warn('neonUpdateUserLastLogin note:', e)
  );

  return { success: true, user: existing };
}

// =========================================================================
// Consultation & Admin Operations
// =========================================================================

export async function markConsultationPaid(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  consultationPaidEmails.add(cleanEmail);
  const existing = userStore.get(cleanEmail);
  if (existing) {
    existing.hasPaidConsultation = true;
  }
  await neonMarkConsultationPaid(cleanEmail).catch((e) =>
    console.warn('Neon markConsultationPaid note:', e)
  );
}

export async function hasUserPaidConsultation(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (consultationPaidEmails.has(cleanEmail)) return true;

  const existing = await findUserByEmail(cleanEmail);
  return !!existing?.hasPaidConsultation;
}

export async function getAllUsersForAdmin(): Promise<Array<{
  id: string;
  email: string;
  name: string;
  hasPaidConsultation: boolean;
  createdAt: string;
  lastLoginAt?: string;
}>> {
  const dbUsers = await neonGetAllUsers().catch((e) => {
    console.warn('Neon getAllUsers error:', e);
    return [];
  });

  if (dbUsers.length > 0) {
    return dbUsers;
  }

  // Fallback to in-memory store
  return Array.from(userStore.values()).map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    hasPaidConsultation: u.hasPaidConsultation,
    createdAt: u.createdAt,
    lastLoginAt: u.createdAt
  }));
}
