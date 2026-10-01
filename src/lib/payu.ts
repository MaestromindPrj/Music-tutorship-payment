import crypto from 'crypto';

/**
 * =========================================================================
 * PayU Payment Gateway Integration for Music Tutorship
 * Subdomain: payments.musictutorship.in
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

  const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
  const received = (receivedHash || '').toLowerCase();

  if (calculatedHash.length !== received.length || calculatedHash.length === 0) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(calculatedHash, 'utf8'), Buffer.from(received, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Generates a unique Transaction ID for Music Tutorship
 */
export function generateTxnId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MT-${timestamp}-${random}`;
}
