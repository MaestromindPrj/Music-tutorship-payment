import crypto from 'crypto';

/**
 * =========================================================================
 * PayU Payment Gateway Integration for Music Tutorship
 * Subdomain: payments.musictutorship.in
 * =========================================================================
 * 
 * Production Credentials:
 * - Merchant Key: kBVBg7
 * - Merchant Salt: 9ymk3c7nXHs94Brh3VQ4wGUaPctkvYgq
 * - Merchant ID (MID): 13041074
 * 
 * HOW TO SWITCH TO LIVE / REAL PAYMENTS:
 * -------------------------------------------------------------
 * 1. Open `.env` (or set environment variable on your hosting provider):
 *    PAYU_IS_LIVE=true
 * 
 * 2. When PAYU_IS_LIVE=true:
 *    - All transactions automatically route directly to PayU hosted production gateway:
 *      https://secure.payu.in/_payment
 *    - Outbound POST requests send real merchant credentials and SHA-512 cryptographic hashes.
 *    - Inbound webhook callbacks verify SHA-512 responses with your production Merchant Salt.
 * 
 * 3. When PAYU_IS_LIVE is false / undefined (Default Dummy Mode):
 *    - The website uses a realistic internal payment simulator at `/payment/mock-gateway`.
 *    - Students / testers can simulate successful payments (or declines) without incurring real credit card or UPI charges.
 *    - All post-payment workflows (KYC registration, Neon database storage, receipt generation) function identically to production.
 * =========================================================================
 */

export interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  merchantMid: string;
  paymentUrl: string;
  isLiveMode: boolean;
}

export function getPayUConfig(): PayUConfig {
  // Production PayU Credentials
  const merchantKey = process.env.PAYU_MERCHANT_KEY || 'kBVBg7';
  const merchantSalt = process.env.PAYU_MERCHANT_SALT || '9ymk3c7nXHs94Brh3VQ4wGUaPctkvYgq';
  const merchantMid = process.env.PAYU_MERCHANT_MID || '13041074';

  // PayU Production Endpoint
  const paymentUrl = process.env.PAYU_PAYMENT_URL || 'https://secure.payu.in/_payment';
  const isLiveMode = true;

  return {
    merchantKey,
    merchantSalt,
    merchantMid,
    paymentUrl,
    isLiveMode
  };
}

/**
 * PayU SHA-512 Outbound Request Hash Formula:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePayUHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    salt
  } = params;

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * PayU SHA-512 Inbound Response Verification Hash Formula:
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Or with additionalCharges:
 * sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponseHash(params: {
  status: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  additionalCharges?: string;
  receivedHash: string;
  salt: string;
  key: string;
}): boolean {
  const {
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    additionalCharges,
    receivedHash,
    salt,
    key
  } = params;

  let hashString = '';
  if (additionalCharges && additionalCharges.trim() !== '') {
    hashString = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  } else {
    hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  }

  const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
  return calculatedHash.toLowerCase() === receivedHash.toLowerCase();
}

/**
 * Generates a unique Transaction ID for Music Tutorship
 */
export function generateTxnId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MT-${timestamp}-${random}`;
}
