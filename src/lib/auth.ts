import {
  neonFindUserByEmail,
  neonSaveUser,
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
}

// In-memory persistent user registry
const userStore = new Map<string, UserAccount>();

// Track emails that have paid consultation
const consultationPaidEmails = new Set<string>();

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
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  if (!hasNumber) {
    return { isValid: false, error: 'Password must include at least one number (0-9)' };
  }
  if (!hasSpecial) {
    return { isValid: false, error: 'Password must include at least one special character (e.g. !@#$%^&*)' };
  }

  return { isValid: true };
}

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

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const passValidation = validatePassword(password);
  if (!passValidation.isValid) {
    return { success: false, error: passValidation.error };
  }

  // Check if user exists in cache or Neon DB
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please log in.' };
  }

  const hasPaid = consultationPaidEmails.has(cleanEmail);
  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split('@')[0],
    password,
    hasPaidConsultation: hasPaid,
    createdAt: new Date().toISOString()
  };

  userStore.set(cleanEmail, newUser);

  // Persist to Neon PostgreSQL
  await neonSaveUser(newUser).catch((e) =>
    console.warn('Neon PostgreSQL saveUser note:', e)
  );

  return { success: true, user: newUser };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  let existing = await findUserByEmail(cleanEmail);
  if (!existing) {
    // If not found, check if password meets criteria to create an account on the fly or prompt
    const passValidation = validatePassword(password);
    if (!passValidation.isValid) {
      return { success: false, error: passValidation.error };
    }
    // Auto-register first-time valid user for seamless onboarding
    return await registerUser(cleanEmail, password);
  }

  if (existing.password !== password) {
    return { success: false, error: 'Incorrect password. Try again or use Forgot Password.' };
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

export async function resetPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const passValidation = validatePassword(newPassword);
  if (!passValidation.isValid) {
    return { success: false, error: passValidation.error };
  }

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    existing.password = newPassword;
    userStore.set(cleanEmail, existing);
    await neonUpdateUserPassword(cleanEmail, newPassword).catch((e) =>
      console.warn('Neon updatePassword note:', e)
    );
    return { success: true };
  } else {
    // Create new account with this new password
    return await registerUser(cleanEmail, newPassword);
  }
}

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
