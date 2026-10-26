import { getPaymentByTxnId } from './db';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  hasPaidConsultation: boolean;
  createdAt: string;
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

export function findUserByEmail(email: string): UserAccount | undefined {
  const cleanEmail = email.trim().toLowerCase();
  return userStore.get(cleanEmail);
}

export function registerUser(email: string, password: string, name?: string): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const passValidation = validatePassword(password);
  if (!passValidation.isValid) {
    return { success: false, error: passValidation.error };
  }

  if (userStore.has(cleanEmail)) {
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
  return { success: true, user: newUser };
}

export function authenticateUser(email: string, password: string): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const existing = userStore.get(cleanEmail);
  if (!existing) {
    // If not found, check if password meets criteria to create an account on the fly or prompt
    const passValidation = validatePassword(password);
    if (!passValidation.isValid) {
      return { success: false, error: passValidation.error };
    }
    // Auto-register first-time valid user for seamless onboarding
    return registerUser(cleanEmail, password);
  }

  if (existing.password !== password) {
    return { success: false, error: 'Incorrect password. Try again or use Forgot Password.' };
  }

  // Sync consultation status
  if (consultationPaidEmails.has(cleanEmail)) {
    existing.hasPaidConsultation = true;
  }

  return { success: true, user: existing };
}

export function resetPassword(email: string, newPassword: string): { success: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const passValidation = validatePassword(newPassword);
  if (!passValidation.isValid) {
    return { success: false, error: passValidation.error };
  }

  const existing = userStore.get(cleanEmail);
  if (existing) {
    existing.password = newPassword;
    return { success: true };
  } else {
    // Create new account with this new password
    return registerUser(cleanEmail, newPassword);
  }
}

export function markConsultationPaid(email: string): void {
  const cleanEmail = email.trim().toLowerCase();
  consultationPaidEmails.add(cleanEmail);
  const existing = userStore.get(cleanEmail);
  if (existing) {
    existing.hasPaidConsultation = true;
  }
}

export function hasUserPaidConsultation(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  if (consultationPaidEmails.has(cleanEmail)) return true;
  const existing = userStore.get(cleanEmail);
  return !!existing?.hasPaidConsultation;
}
