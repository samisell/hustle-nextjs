/**
 * Flutterwave Payment Gateway Utility
 *
 * Handles transaction initialization, verification, and webhook processing
 * for the Hustle University platform.
 *
 * API Docs: https://developer.flutterwave.com/docs/
 */

import crypto from 'crypto';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLUTTERWAVE_WEBHOOK_SECRET = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';

export interface FlutterwaveInitPayload {
  tx_ref: string;
  amount: number;
  currency?: string;
  redirect_url: string;
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  customizations?: {
    title?: string;
    logo?: string;
    description?: string;
  };
  payment_options?: string;
  subaccounts?: Array<{
    id: string;
    transaction_split_ratio: number;
  }>;
}

export interface FlutterwaveInitResponse {
  status: string;
  message: string;
  data: {
    link: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    customer: {
      id: number;
      name: string;
      email: string;
      phone_number: string;
    };
    meta?: Record<string, any>;
    created_at: string;
    paid_at?: string;
  };
}

export interface FlutterwaveWebhookPayload {
  event: string;
  'event.type': string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    narration: string;
    created_at: string;
    amount_settled: number;
    customer: {
      id: number;
      name: string;
      email: string;
      phone_number: string;
    };
  };
  'verification.hash': string;
}

/**
 * Generate a unique transaction reference
 */
export function generateTxRef(prefix: string = 'HU'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Initialize a Flutterwave payment transaction
 * Creates a payment link that the user is redirected to
 */
export async function initializePayment(
  payload: FlutterwaveInitPayload
): Promise<FlutterwaveInitResponse> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to initialize payment with Flutterwave');
  }

  return data;
}

/**
 * Verify a Flutterwave transaction by transaction ID
 */
export async function verifyTransaction(
  transactionId: number
): Promise<FlutterwaveVerifyResponse> {
  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify transaction with Flutterwave');
  }

  return data;
}

/**
 * Verify a Flutterwave transaction by reference
 */
export async function verifyTransactionByRef(
  txRef: string
): Promise<FlutterwaveVerifyResponse> {
  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${txRef}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify transaction by reference');
  }

  return data;
}

/**
 * Verify webhook signature from Flutterwave
 * Returns true if the hash is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: FlutterwaveWebhookPayload
): boolean {
  if (!FLUTTERWAVE_WEBHOOK_SECRET) {
    console.warn('[Flutterwave] Webhook secret not configured — skipping signature verification');
    return true;
  }

  const receivedHash = payload['verification.hash'];
  if (!receivedHash) {
    return false;
  }

  // Flutterwave uses SHA-256 of the payload JSON string with the webhook secret
  const computedHash = crypto
    .createHmac('sha256', FLUTTERWAVE_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return computedHash === receivedHash;
}

/**
 * Get the Flutterwave public key (safe for client-side use)
 */
export function getPublicKey(): string {
  return FLUTTERWAVE_PUBLIC_KEY;
}

/**
 * Get the Flutterwave base checkout URL for direct embedding
 */
export function getCheckoutUrl(): string {
  return 'https://checkout.flutterwave.com/v3.js';
}
