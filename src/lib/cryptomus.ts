/**
 * Cryptomus Crypto Payment Gateway Utility
 *
 * Handles cryptocurrency payment creation, invoice verification,
 * and webhook processing for the Hustle University platform.
 *
 * API Docs: https://doc.cryptomus.com/
 */

import crypto from 'crypto';

const CRYPTOMUS_BASE_URL = 'https://api.cryptomus.com/v1';
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || '';
const CRYPTOMUS_MERCHANT_UUID = process.env.CRYPTOMUS_MERCHANT_UUID || '';
const CRYPTOMUS_PAYMENT_UUID = process.env.CRYPTOMUS_PAYMENT_UUID || '';
const CRYPTOMUS_WEBHOOK_SECRET = process.env.CRYPTOMUS_WEBHOOK_SECRET || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CryptomusCreateInvoicePayload {
  amount: string;
  currency: string;
  order_id: string;
  url_callback?: string;
  url_return?: string;
  url_success?: string;
  lifetime?: number;
  from?: string; // specific crypto network, e.g. 'btc', 'eth', 'usdt_trc20'
  to?: string;   // target currency, e.g. 'usd'
  name?: string;
  description?: string;
  discount?: string;
}

export interface CryptomusCreateInvoiceResponse {
  state: number;
  result: {
    uuid: string;
    merchant_uuid: string;
    order_id: string;
    currency: string;
    amount: string;
    payment_amount: string;
    payment_currency: string;
    status: string;
    address: string;
    network: string;
    from: string;
    to: string;
    created_at: number;
    updated_at: number;
    expired_at: number;
    url: string;
    qr_code: string;
    is_fee_included: boolean;
  };
}

export interface CryptomusInvoiceInfo {
  uuid: string;
  merchant_uuid: string;
  order_id: string;
  currency: string;
  amount: string;
  payment_amount: string;
  payment_currency: string;
  status: string;
  address: string;
  network: string;
  from: string;
  to: string;
  created_at: number;
  updated_at: number;
  expired_at: number;
  url: string;
  qr_code: string;
  is_fee_included: boolean;
}

export interface CryptomusGetInfoResponse {
  state: number;
  result: CryptomusInvoiceInfo;
}

export interface CryptomusWebhookPayload {
  merchant_id: string;
  order_id: string;
  uuid: string;
  amount: string;
  payment_amount: string;
  payment_currency: string;
  is_final: boolean;
  txid: string;
  address: string;
  network: string;
  status: string;
  sign: string;
  callback_url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sign a Cryptomus request payload.
 * The sign is computed as: md5(base64(JSON(payload)) + API_KEY)
 */
function signPayload(payload: Record<string, any>): string {
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sign = crypto
    .createHash('md5')
    .update(base64 + CRYPTOMUS_API_KEY)
    .digest('hex');
  return sign;
}

/**
 * Verify a Cryptomus webhook signature.
 * The sign is computed as: md5(JSON(payload) + WEBHOOK_SECRET)
 */
export function verifyWebhookSignature(payload: CryptomusWebhookPayload): boolean {
  if (!CRYPTOMUS_WEBHOOK_SECRET) {
    console.warn('[Cryptomus] Webhook secret not configured — skipping signature verification');
    return true;
  }

  const receivedSign = payload.sign;
  if (!receivedSign) return false;

  // Build the data string (all fields except 'sign', sorted)
  const sortedKeys = Object.keys(payload)
    .filter((k) => k !== 'sign')
    .sort();

  const dataString = sortedKeys
    .map((key) => `${payload[key as keyof CryptomusWebhookPayload]}`)
    .join('');

  const computedSign = crypto
    .createHash('md5')
    .update(dataString + CRYPTOMUS_WEBHOOK_SECRET)
    .digest('hex');

  return computedSign === receivedSign;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Create a Cryptomus payment invoice
 * Returns the checkout URL and payment details (address, QR code, etc.)
 */
export async function createInvoice(
  payload: CryptomusCreateInvoicePayload
): Promise<CryptomusCreateInvoiceResponse> {
  const sign = signPayload(payload);

  const response = await fetch(`${CRYPTOMUS_BASE_URL}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_MERCHANT_UUID,
      'sign': sign,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.state !== 0) {
    const errMsg = data.message || data.msg || 'Failed to create Cryptomus invoice';
    throw new Error(errMsg);
  }

  return data;
}

/**
 * Get invoice information by UUID
 */
export async function getInvoiceInfo(
  invoiceUuid: string
): Promise<CryptomusGetInfoResponse> {
  const payload = { uuid: invoiceUuid };
  const sign = signPayload(payload);

  const response = await fetch(`${CRYPTOMUS_BASE_URL}/payment/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_MERCHANT_UUID,
      'sign': sign,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.state !== 0) {
    const errMsg = data.message || data.msg || 'Failed to get invoice info';
    throw new Error(errMsg);
  }

  return data;
}

/**
 * Create a payout (for withdrawals)
 * Transfers crypto from merchant wallet to user address
 */
export async function createPayout(params: {
  amount: string;
  currency: string;
  network: string;
  address: string;
  order_id: string;
}): Promise<any> {
  const payload = {
    ...params,
    merchant: CRYPTOMUS_MERCHANT_UUID,
    payment_uuid: CRYPTOMUS_PAYMENT_UUID,
  };
  const sign = signPayload(payload);

  const response = await fetch(`${CRYPTOMUS_BASE_URL}/payout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_MERCHANT_UUID,
      'sign': sign,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.state !== 0) {
    const errMsg = data.message || data.msg || 'Failed to create payout';
    throw new Error(errMsg);
  }

  return data;
}

/**
 * Get available currencies/networks for payments
 */
export async function getAvailableCurrencies(): Promise<any> {
  const payload = { merchant_uuid: CRYPTOMUS_MERCHANT_UUID, show_inactive: false };
  const sign = signPayload(payload);

  const response = await fetch(`${CRYPTOMUS_BASE_URL}/currency/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_MERCHANT_UUID,
      'sign': sign,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}

/**
 * Check if Cryptomus is configured
 */
export function isConfigured(): boolean {
  return !!(CRYPTOMUS_API_KEY && CRYPTOMUS_MERCHANT_UUID);
}
