# Hustle University — API Documentation for Mobile Integration

**Version:** 1.0.0  
**Last Updated:** 2025  
**Base URL:** `https://your-domain.com`  
**Total Endpoints:** 87+

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Auth Endpoints](#1-authentication)
4. [Dashboard](#2-dashboard)
5. [Payments — Flutterwave (Fiat)](#3-payments--flutterwave-fiat)
6. [Payments — Cryptomus (Crypto)](#4-payments--cryptomus-crypto)
7. [Wallet](#5-wallet)
8. [Investments](#6-investments)
9. [Subscription](#7-subscription)
10. [Courses](#8-courses)
11. [Escrow System](#9-escrow-system)
12. [Admin Panel](#10-admin-panel)
13. [Referrals & MLM](#11-referrals--mlm)
14. [Forum](#12-forum)
15. [Chat / Messaging](#13-chat--messaging)
16. [Q&A Sessions](#14-qa-sessions)
17. [Group Investments](#15-group-investments)
18. [Notifications](#16-notifications)
19. [User Profile & Settings](#17-user-profile--settings)
20. [Community & Leaderboard](#18-community--leaderboard)
21. [Skill Categories](#19-skill-categories)
22. [Certifications](#20-certifications)
23. [Suggested Improvements](#suggested-improvements--new-features)

---

## Overview

Hustle University is a subscription-based learning and investment platform. The API uses **JWT Bearer token authentication** for protected endpoints. Admin-only endpoints additionally require `role: "admin"` in the JWT payload.

### Common Patterns

| Pattern | Description |
|---------|-------------|
| **Auth Header** | `Authorization: Bearer <JWT_TOKEN>` |
| **Content-Type** | `application/json` for all POST/PUT/PATCH |
| **Date Format** | ISO 8601 (e.g., `2025-01-15T10:30:00.000Z`) |
| **Currency** | USD (default). Amounts are in dollars. |
| **Pagination** | Query params: `page` (default: 1), `limit` (default: 20) |
| **Error Format** | `{ "error": "Description of the error" }` |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `500` | Internal Server Error |

### SDK / Client Setup

```typescript
const API_BASE = 'https://your-domain.com';

const api = {
  get: (url: string, token?: string) =>
    fetch(`${API_BASE}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  post: (url: string, body: object, token?: string) =>
    fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }),
};
```

---

## 1. Authentication

### POST `/api/auth/register`

Register a new user account. Auto-generates a referral code, creates a wallet, and optionally processes a referral bonus ($10.00 to referrer).

**Auth:** None (public)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Email (must be unique) |
| `password` | string | Yes | Min 6 characters |
| `referralCode` | string | No | Referrer's code (credits referrer $10) |

**Response (201):**
```json
{
  "user": { "id", "name", "email", "role", "referralCode" },
  "token": "JWT_STRING"
}
```

**Errors:** `400` (missing fields, weak password, email taken), `500`

---

### POST `/api/auth/login`

Authenticate and receive JWT token.

**Auth:** None (public)

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Response (200):**
```json
{
  "user": {
    "id", "name", "email", "role", "referralCode",
    "subscription": { "plan", "status", "endDate" } | null,
    "wallet": { "balance" } | null
  },
  "token": "JWT_STRING"
}
```

**Errors:** `400` (missing fields), `401` (invalid credentials), `500`

---

## 2. Dashboard

### GET `/api/dashboard`

Comprehensive dashboard data for the authenticated user.

**Auth:** JWT required

**Response (200):**
```json
{
  "stats": {
    "balance": 1500.00,
    "totalReferrals": 25,
    "coursesCompleted": 3,
    "activeInvestments": 2
  },
  "activities": [{ "id", "type", "title", "description", "amount", "time" }],
  "subscription": { "plan", "status", "endDate" } | null,
  "unreadNotifications": 5,
  "recentAchievements": [{ "id", "title", "description", "icon", "category", "points", "earnedAt" }],
  "learningProgress": { "totalEnrolled", "completed", "totalLessonsCompleted" },
  "investmentSummary": { "totalInvested", "activeCount", "totalReturns" },
  "weeklyEarnings": [{ "date": "YYYY-MM-DD", "amount" }]
}
```

**Errors:** `401`, `404` (user not found), `500`

---

## 3. Payments — Flutterwave (Fiat)

### POST `/api/payments/initialize`

Initialize a fiat payment via Flutterwave. Returns a hosted payment URL for redirect checkout.

**Auth:** JWT required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"subscription"` or `"wallet_funding"` |
| `plan` | string | Conditional* | `basic` ($9.99), `pro` ($29.99), `premium` ($99.99) |
| `amount` | number | Conditional* | $5 – $10,000 (for wallet_funding) |

*Required when type matches.

**Response (201):**
```json
{
  "paymentId": "string",
  "txRef": "string",
  "amount": 99.99,
  "paymentLink": "https://checkout.flutterwave.com/...",
  "publicKey": "string"
}
```

---

### GET `/api/payments/verify`

Verify payment status by transaction reference. Works for both Flutterwave and Cryptomus.

**Auth:** JWT required (user must own payment)

| Query Param | Type | Required |
|-------------|------|----------|
| `tx_ref` | string | Yes |
| `method` | string | No (`flutterwave` or `cryptomus`, auto-detected) |

**Response (200):**
```json
{
  "status": "completed" | "pending" | "failed",
  "txRef": "string",
  "amount": 99.99,
  "paymentType": "subscription" | "wallet_funding",
  "paymentMethod": "flutterwave" | "cryptomus",
  "paidAt": "ISO date" | null
}
```

---

### POST `/api/payments/webhook`

Webhook called by Flutterwave on payment events. **Not called by mobile app.**

**Auth:** Flutterwave webhook signature (not JWT)

**Also supports GET** for health check: `{ "status": "active" }`

---

## 4. Payments — Cryptomus (Crypto)

### POST `/api/payments/crypto/initialize`

Initialize a crypto payment via Cryptomus. Invoice expires in 1 hour.

**Auth:** JWT required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"subscription"` or `"wallet_funding"` |
| `plan` | string | Conditional* | Same as fiat |
| `amount` | number | Conditional* | Same as fiat |
| `currency` | string | No | Billing currency (default: `"usd"`) |

**Response (201):**
```json
{
  "paymentId": "string",
  "txRef": "string",
  "amount": 99.99,
  "checkoutUrl": "https://pay.cryptomus.com/...",
  "cryptoDetails": {
    "address": "0x...",
    "network": "USDT (TRC-20)",
    "paymentAmount": "string",
    "paymentCurrency": "USDT",
    "qrCode": "data:image/png;base64,...",
    "currency": "string",
    "amount": "string",
    "status": "string",
    "uuid": "string",
    "expiresAt": "ISO date"
  }
}
```

---

### GET `/api/payments/crypto/verify`

Verify crypto payment status. Poll this endpoint until status is `completed` or `failed`.

**Auth:** JWT required

| Query Param | Type | Required |
|-------------|------|----------|
| `tx_ref` | string | Yes |

**Response:** Same structure as `/api/payments/verify`

---

### POST `/api/payments/crypto/webhook`

Webhook called by Cryptomus. **Not called by mobile app.**

**Also supports GET** for health check.

---

## 5. Wallet

### GET `/api/wallet`

Get wallet balance, last 20 transactions, and last 10 earnings.

**Auth:** JWT required

**Response (200):**
```json
{
  "balance": 1500.00,
  "transactions": [{ "id", "type", "amount", "description", "createdAt", "walletId" }],
  "recentEarnings": [{ "id", "amount", "source", "description", "createdAt", "userId" }]
}
```

---

### POST `/api/wallet/withdraw`

Submit a withdrawal request. Debits wallet immediately.

**Auth:** JWT required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Min $10 |
| `walletAddress` | string | Yes | Destination crypto address |

**Response (201):**
```json
{
  "withdrawal": {
    "id", "userId", "amount", "walletAddress",
    "status": "pending",
    "createdAt", "updatedAt"
  }
}
```

**Errors:** `400` (invalid amount, insufficient balance), `401`, `404`

---

### POST `/api/wallet`

Alternative withdrawal endpoint (with `action` field).

| Field | Type | Required |
|-------|------|----------|
| `action` | string | Yes (`"withdraw"`) |
| `amount` | number | Yes |
| `walletAddress` | string | Yes |

---

## 6. Investments

### GET `/api/investments`

List all active investment opportunities and the user's personal investment history.

**Auth:** JWT required

**Response (200):**
```json
{
  "opportunities": [{
    "id", "title", "description", "roiPercent",
    "minInvestment", "maxInvestment", "totalPool",
    "status": "active" | "inactive",
    "createdAt", "_count": { "investments" }
  }],
  "myInvestments": [{
    "id", "opportunityId", "opportunityTitle",
    "amount", "roiPercent", "expectedReturn",
    "status": "active" | "completed",
    "startDate", "endDate"
  }]
}
```

---

### POST `/api/investments/invest`

Place an investment. Debits wallet and creates investment record.

**Auth:** JWT required

| Field | Type | Required |
|-------|------|----------|
| `opportunityId` | string | Yes |
| `amount` | number | Yes |

**Response (201):**
```json
{
  "investment": {
    "id", "userId", "opportunityId", "amount",
    "roiPercent", "expectedReturn",
    "status": "active", "startDate", "endDate", "createdAt", "updatedAt"
  }
}
```

**Errors:** `400` (invalid opportunity, inactive, amount out of range, insufficient balance)

---

## 7. Subscription

### GET `/api/subscription`

Get current subscription details and last 20 payment records.

**Auth:** JWT required

**Response (200):**
```json
{
  "subscription": {
    "plan": "basic" | "pro" | "premium" | "none",
    "status": "active" | "inactive",
    "startDate": "ISO date" | null,
    "endDate": "ISO date" | null
  },
  "payments": [{ "id", "amount", "status", "paymentMethod", "paymentType", "txRef", "createdAt", "paidAt" }]
}
```

---

### POST `/api/subscription/switch`

Switch/activate subscription plan (uses mock payment — dev/test endpoint).

**Auth:** JWT required

| Field | Type | Required |
|-------|------|----------|
| `plan` | string | Yes (`basic`, `pro`, `premium`) |

**Response (201):**
```json
{
  "subscription": { "id", "userId", "plan", "status": "active", "startDate", "endDate" },
  "payment": { "id", "userId", "amount", "status": "completed", "paymentMethod": "mock" }
}
```

---

## 8. Courses

### GET `/api/courses`

List all courses. If authenticated, includes per-course enrollment progress and certification status.

**Auth:** Optional (enriches response if present)

| Query Param | Type | Required |
|-------------|------|----------|
| `categoryId` | string | No |

**Response (200):**
```json
{
  "courses": [{
    "id", "title", "description", "type", "status",
    "difficulty", "thumbnail", "createdAt",
    "_count": { "enrollments", "lessons" },
    "skillCategory": { "id", "name", "slug", "icon", "color" },
    "userProgress": { "enrolled": true, "progress": 75 } | null,
    "hasCertification": true | false
  }]
}
```

---

### GET `/api/courses/[id]`

Get full course details including lessons, enrollment, and certification.

**Auth:** Optional

**Response (200):**
```json
{
  "course": {
    "id", "title", "description", "difficulty", "thumbnail",
    "lessons": [{ "id", "title", "content", "order", "type", "duration" }],
    "_count": { "enrollments" },
    "skillCategory": { "id", "name", "slug", "icon", "color" }
  },
  "userProgress": { "enrolled", "enrollment", "completedLessonIds" } | null,
  "certification": { "id", "earnedAt", "courseId" } | null
}
```

---

### POST `/api/courses/enroll`

Enroll in a course.

**Auth:** JWT required

| Field | Type | Required |
|-------|------|----------|
| `courseId` | string | Yes |

**Response (201):** `{ "enrollment": { "id", "userId", "courseId", "progress": 0 } }`

---

### POST `/api/courses/progress`

Mark a lesson as completed. On 100% completion, awards **$5 wallet bonus** and creates a certification.

**Auth:** JWT required

| Field | Type | Required |
|-------|------|----------|
| `lessonId` | string | Yes |
| `courseId` | string | Yes |

**Response (200):**
```json
{
  "success": true,
  "progress": 100,
  "enrollment": { "id", "progress": 100, "completedAt" },
  "certification": { "id", "earnedAt" } | null
}
```

---

### POST `/api/courses`

Multi-action endpoint: `enroll` or `progress`.

| Field | Type | Required |
|-------|------|----------|
| `action` | string | Yes (`enroll` or `progress`) |
| `courseId` | string | Yes |
| `lessonId` | string | Yes (for `progress`) |

---

## 9. Escrow System

### GET `/api/escrow`

List all escrow transactions. Admins see all; users see their contribution status.

**Auth:** JWT required

| Query Param | Type | Required |
|-------------|------|----------|
| `status` | string | No |
| `type` | string | No |

**Response (200):**
```json
{
  "escrows": [{
    "id", "title", "description", "type", "status",
    "targetAmount", "collectedAmount", "currency", "feePercent",
    "fundingDeadline", "releaseDate",
    "fundingPercentage": 75.5,
    "creator": { "id", "name", "email" },
    "myContribution": { "id", "amount", "status" } | null,
    "hasContributed": false
  }]
}
```

---

### POST `/api/escrow`

Create a new escrow transaction. **Admin only.**

**Auth:** JWT + Admin

| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes |
| `targetAmount` | number | Yes (positive) |
| `description` | string | No |
| `type` | string | No |
| `feePercent` | number | No |
| `minContribution` | number | No |
| `maxContribution` | number | No |
| `fundingDeadline` | string (date) | No |
| `releaseDate` | string (date) | No |
| `terms` | string | No |
| `milestones` | array | No |

---

### GET `/api/escrow/[id]`

Full escrow details with contributions, milestones, and disputes.

**Auth:** JWT required

---

### POST `/api/escrow/[id]/contribute`

Contribute funds to an escrow.

**Auth:** JWT required (any user)

| Field | Type | Required |
|-------|------|----------|
| `amount` | number | Yes (positive) |
| `paymentMethod` | string | Yes (`wallet`, `flutterwave`, `crypto`) |

**Response varies by payment method:**
- **wallet:** Immediate confirmation
- **flutterwave:** Returns `paymentUrl` for redirect
- **crypto:** Returns `cryptoAddress` and `network` for manual transfer

---

### POST `/api/escrow/[id]/release`

Release all funds to contributors. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `notes` | string | No |

---

### POST `/api/escrow/[id]/cancel`

Cancel escrow and refund all. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `reason` | string | No |

---

### POST `/api/escrow/[id]/refund`

Refund all contributions (without cancelling). **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `reason` | string | No |

---

### POST `/api/escrow/[id]/milestones`

Add a milestone. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes |
| `percentage` | number | Yes (positive) |
| `description` | string | No |
| `order` | number | No |

---

### POST `/api/escrow/[id]/milestones/[milestoneId]/release`

Release funds for a specific milestone. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `releaseNotes` | string | No |

---

### POST `/api/escrow/[id]/disputes`

Raise a dispute. Any contributor.

| Field | Type | Required |
|-------|------|----------|
| `reason` | string | Yes |
| `evidence` | string | No |

---

### POST `/api/escrow/[id]/disputes/[disputeId]/resolve`

Resolve a dispute. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `resolution` | string | Yes |
| `action` | string | Yes (`dismiss`, `refund`, `release`) |

| Action | Effect |
|--------|--------|
| `dismiss` | Dispute dismissed, status reverted |
| `refund` | All contributions refunded |
| `release` | All funds released |

---

### POST `/api/escrow/process-expired`

Process expired escrows. **Admin only. Cron-callable.**

**Response (200):**
```json
{ "processedCount": 3, "processedIds": ["..."], "message": "..." }
```

---

## 10. Admin Panel

All admin endpoints require `JWT + role: "admin"`.

### GET `/api/admin`

Admin dashboard data: users, withdrawals, courses.

### POST `/api/admin`

Full dashboard data + counts + investments.

### GET `/api/admin/stats`

Comprehensive platform analytics.

**Response includes:** totals, recent signups (7 days), monthly revenue/user growth (12 months), top 5 courses, top 5 referrers, payment method breakdown, subscription distribution.

---

### Courses Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/courses` | Create course |
| GET | `/api/admin/courses/[id]` | Course detail + lessons + enrollments |
| PATCH | `/api/admin/courses/[id]` | Update course fields |
| DELETE | `/api/admin/courses/[id]` | Delete course (cascade) |
| POST | `/api/admin/courses/[id]/lessons` | Add lesson |

**Create Course Body:** `{ title, description?, category?, difficulty? }`  
**Add Lesson Body:** `{ title, content, order? }`

---

### Users Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users/[id]` | Full user detail + transactions + payments |
| PATCH | `/api/admin/users/[id]` | Update name/role |
| DELETE | `/api/admin/users/[id]` | Suspend user (role → "suspended") |
| PUT | `/api/admin/users/[id]/role` | Update role (user/admin) |
| POST | `/api/admin/users/[id]/balance` | Credit/debit wallet |

**Balance Adjustment Body:** `{ amount: number, reason: string }`  
(Positive = credit, Negative = debit)

---

### Investments Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/investments` | Create opportunity |
| GET | `/api/admin/investments/list` | List all opportunities |
| GET | `/api/admin/investments/[id]` | Detail + investors |
| PATCH | `/api/admin/investments/[id]` | Update opportunity |
| DELETE | `/api/admin/investments/[id]` | Delete (no active investors) |

---

### Withdrawals Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/withdrawals` | List all withdrawals |
| POST | `/api/admin/withdrawals` | Approve/reject (body: withdrawalId, action) |
| PUT | `/api/admin/withdrawals/[id]` | Approve/reject/complete (body: status) |

---

### Payouts Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/payouts` | List payouts (paginated, filterable by status) |
| PATCH | `/api/admin/payouts/[id]` | Complete or reject payout |

**Query params:** `status`, `page`, `limit`

---

### Payments Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/payments` | List payments (paginated, filterable) |

**Query params:** `status`, `method`, `type`, `page`, `limit`

---

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/notifications/broadcast` | Send to all or specific users |

**Body:** `{ title, message, type? ("info"|"success"|"warning"|"error"), userIds?[] }`

---

## 11. Referrals & MLM

### GET `/api/referrals`

Referral dashboard: stats + referred users list.

**Response (200):**
```json
{
  "stats": { "totalReferrals", "activeReferrals", "totalEarnings" },
  "referredUsers": [{ "id", "name", "email", "joinedAt", "status", "earnings" }]
}
```

---

### GET `/api/referrals/commissions`

Paginated commission history with level breakdown.

**Query params:** `level` (1/2/3), `page`, `limit`

**Response includes:** `commissions[]`, `pagination`, `summary` (totalEarned, level1-3 earnings/counts)

---

### GET `/api/referrals/tree`

Multi-level referral tree (default 3 levels).

**Query params:** `depth` (1-5, default: 3)

**Response includes:** `tree` (nested structure), `stats` (totalNetwork, direct, level2, level3)

---

### GET `/api/referrals/growth`

Network growth analytics: recent signups, growth rate, monthly earnings.

---

### POST `/api/referrals/payout`

Create payout request for commission earnings.

| Field | Type | Required |
|-------|------|----------|
| `amount` | number | Yes (> 0) |
| `method` | string | Yes (`bitcoin`, `usdt`, `bank_transfer`) |
| `currency` | string | Yes (`USD`, `USDT`, `BTC`) |
| `walletAddress` | string | No* |
| `bankName` | string | No* |
| `bankAccount` | string | No* |
| `bankAccountName` | string | No* |

*Required based on method.

---

### GET `/api/referrals/payout`

Payout history (paginated).

**Query params:** `status` (pending/processing/completed/failed/rejected), `page`, `limit`

---

## 12. Forum

### GET `/api/forum/categories`

List active forum categories. **Public — no auth required.**

---

### POST `/api/forum/categories`

Create category. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `slug` | string | No (auto-generated) |
| `description` | string | No |
| `icon` | string | No (default: `"MessageSquare"`) |
| `color` | string | No (default: `"#D4AF37"`) |
| `order` | number | No |

---

### GET `/api/forum/topics`

List topics (paginated).

**Query params:** `categoryId`, `page`, `limit`

---

### POST `/api/forum/topics`

Create topic.

| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes |
| `content` | string | Yes |
| `categoryId` | string | No |
| `tags` | string[] | No |

---

### GET `/api/forum/topics/[id]`

Topic detail with all replies.

---

### PATCH `/api/forum/topics/[id]`

Update topic. **Author or admin only.**

| Field | Type | Required |
|-------|------|----------|
| `title` | string | No |
| `content` | string | No |
| `tags` | string[] | No |
| `isLocked` | boolean | No (**Admin only**) |

---

### DELETE `/api/forum/topics/[id]`

Delete topic + replies. **Author or admin only.**

---

### GET `/api/forum/topics/[id]/replies`

List replies (paginated).

**Query params:** `page`, `limit`

---

### POST `/api/forum/topics/[id]/replies`

Create reply. Fails if topic is locked.

| Field | Type | Required |
|-------|------|----------|
| `content` | string | Yes |

---

## 13. Chat / Messaging

### GET `/api/chat/conversations`

List user's conversations with last message preview and unread count.

**Response (200):**
```json
{
  "conversations": [{
    "id", "name", "isGroup", "lastMessageAt",
    "members": [{ "id", "name", "avatar", "joinedAt" }],
    "otherMembers": [{ "id", "name", "avatar" }],
    "lastMessage": { "id", "content", "createdAt", "userId" } | null,
    "unreadCount": 3
  }]
}
```

---

### POST `/api/chat/conversations`

Create DM or group conversation.

| Field | Type | Required |
|-------|------|----------|
| `participantIds` | string[] | Yes |
| `name` | string | Yes (for group, 2+ participants) |

**DM behavior:** Returns existing conversation if one exists.

---

### GET `/api/chat/conversations/[id]/messages`

List messages (paginated). Auto-marks as read.

**Query params:** `page`, `limit` (default: 50), `before` (cursor message ID)

---

### POST `/api/chat/conversations/[id]/messages`

Send a message.

| Field | Type | Required |
|-------|------|----------|
| `content` | string | Yes |

---

### POST `/api/chat/conversations/[id]/read`

Mark all unread messages as read.

**Response (200):** `{ "message": "Messages marked as read.", "markedCount": 5 }`

---

## 14. Q&A Sessions

### GET `/api/qa/sessions`

List QA sessions.

**Query params:** `status` (`upcoming`, `live`, `ended`)

---

### POST `/api/qa/sessions`

Create QA session. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes |
| `expertName` | string | Yes |
| `scheduledAt` | string (date) | Yes |
| `description` | string | No |
| `expertBio` | string | No |
| `expertTitle` | string | No |
| `duration` | number | No (default: 60 min) |

---

### GET `/api/qa/sessions/[id]`

Session detail with all questions (answered first, then by upvotes).

---

### PATCH `/api/qa/sessions/[id]`

Update session. **Admin only.**

---

### DELETE `/api/qa/sessions/[id]`

Delete session + questions. **Admin only.**

---

### GET `/api/qa/sessions/[id]/questions`

List questions for a session.

---

### POST `/api/qa/sessions/[id]/questions`

Submit question (1 per user per session).

| Field | Type | Required |
|-------|------|----------|
| `content` | string | Yes |

---

### POST `/api/qa/sessions/[id]/questions/[questionId]/answer`

Answer a question. **Admin or session host only.**

| Field | Type | Required |
|-------|------|----------|
| `answer` | string | Yes |

---

### POST `/api/qa/sessions/[id]/questions/[questionId]/upvote`

Toggle upvote on a question. No body required.

---

## 15. Group Investments

### GET `/api/group-investments`

List all investment deals with user's vote/contribution status.

**Query params:** `status`, `category`

---

### POST `/api/group-investments`

Create deal. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes |
| `description` | string | Yes |
| `targetAmount` | number | Yes (positive) |
| `roiPercent` | number | Yes (>= 0) |
| `duration` | string | Yes |
| `longDescription` | string | No |
| `categoryId` | string | No |
| `minContribution` | number | No (default: 10) |
| `maxContribution` | number | No |
| `maturityDate` | string (date) | No |
| `votingDeadline` | string (date) | No |
| `imageUrl` | string | No |
| `riskLevel` | string | No (default: "medium") |
| `minVotes` | number | No (default: 10) |
| `approvalThreshold` | number | No (default: 0.6) |

---

### GET `/api/group-investments/[id]`

Deal detail with contributions, votes, funding %, user status.

---

### PATCH `/api/group-investments/[id]`

Update deal. **Admin only.** All fields optional.

---

### DELETE `/api/group-investments/[id]`

Cancel deal + refund all contributors. **Admin only.**

---

### POST `/api/group-investments/[id]/contribute`

Contribute funds to a deal (wallet debit).

| Field | Type | Required |
|-------|------|----------|
| `amount` | number | Yes |

---

### POST `/api/group-investments/[id]/vote`

Cast vote (for/against). Auto-transitions to funding if threshold met.

| Field | Type | Required |
|-------|------|----------|
| `vote` | string | Yes (`for` or `against`) |
| `comment` | string | No |

---

### POST `/api/group-investments/[id]/distribute`

Distribute profits. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| `actualRoiPercent` | number | No (defaults to deal's ROI) |

---

### Group Investment Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/group-investments/categories` | Public | List categories |
| POST | `/api/group-investments/categories` | Admin | Create category |
| PATCH | `/api/group-investments/categories/[id]` | Admin | Update category |
| DELETE | `/api/group-investments/categories/[id]` | Admin | Delete category |

---

## 16. Notifications

### GET `/api/notifications`

List user notifications + unread count.

**Response (200):** `{ "notifications": [...], "unreadCount": 5 }`

---

### PUT `/api/notifications`

Bulk action: mark all read.

| Field | Type | Required |
|-------|------|----------|
| `action` | string | Yes (`read-all`) |

---

### PUT `/api/notifications/[id]`

Mark single notification as read.

---

### DELETE `/api/notifications/[id]`

Delete single notification.

---

### PUT/POST `/api/notifications/read`

Mark one notification read (by body ID).

| Field | Type | Required |
|-------|------|----------|
| `notificationId` | string | Yes |

---

### PUT/POST `/api/notifications/read-all`

Mark all as read. No body required.

---

## 17. User Profile & Settings

### GET `/api/user/profile`

Full profile with subscription.

**Response (200):**
```json
{
  "user": {
    "id", "name", "email", "role", "referralCode",
    "bio", "phone", "avatar",
    "createdAt", "updatedAt",
    "subscription": { "plan", "status", "startDate", "endDate" }
  }
}
```

---

### PUT `/api/user/profile`

Update profile. At least one field required.

| Field | Type | Required |
|-------|------|----------|
| `name` | string | No (min 2 chars) |
| `bio` | string | No |
| `phone` | string | No |

---

### GET `/api/user/stats`

Comprehensive stats: wallet, investments, referrals, courses, achievements, subscription, notifications, withdrawals.

---

### POST `/api/user/password`

Change password.

| Field | Type | Required |
|-------|------|----------|
| `currentPassword` | string | Yes |
| `newPassword` | string | Yes (min 6 chars) |
| `confirmPassword` | string | Yes (must match) |

---

### GET `/api/user/achievements`

All achievements with earned status.

**Response (200):**
```json
{
  "achievements": [{ "id", "title", "description", "icon", "category", "requirement", "points", "earned", "earnedAt" }],
  "totalPoints": 250,
  "earnedCount": 5,
  "totalAchievements": 20
}
```

---

## 18. Community & Leaderboard

### GET `/api/community/leaderboard`

Top 20 referrers by commission earnings with badges.

**Query params:** `period` (`all` default, `monthly`)

**Response (200):**
```json
{
  "leaderboard": [{ "rank", "name", "email", "avatar", "totalEarnings", "totalReferrals", "commissionCount", "badge": "gold"|"silver"|"bronze"|null }],
  "currentUser": { ... } | null
}
```

---

## 19. Skill Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/skill-categories` | Optional | List categories (admin sees all) |
| POST | `/api/skill-categories` | Admin | Create category |
| GET | `/api/skill-categories/[id]` | Public | Get single category |
| PATCH | `/api/skill-categories/[id]` | Admin | Update category |
| DELETE | `/api/skill-categories/[id]` | Admin | Delete (no courses) |

---

## 20. Certifications

### GET `/api/certifications`

List user's earned certifications with course and category info.

**Response (200):**
```json
{
  "certifications": [{
    "id", "userId", "courseId", "earnedAt",
    "course": { "id", "title", "skillCategory": { "id", "name", "color" } }
  }]
}
```

---

## Suggested Improvements & New Features

### High Priority

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Push Notifications (FCM/APNs)** | Integrate Firebase Cloud Messaging for real-time push notifications on mobile |
| 2 | **File/Image Upload** | Add multipart upload support for avatars, course thumbnails, forum attachments |
| 3 | **Biometric Auth** | Support fingerprint/face ID login via mobile SDK |
| 4 | **Rate Limiting** | Implement API rate limiting (e.g., 100 req/min per user) |
| 5 | **Email Verification** | Send verification email on registration with confirmation link |
| 6 | **Password Reset (Forgot Password)** | Add forgot-password flow with email-based reset tokens |

### Medium Priority

| # | Feature | Description |
|---|---------|-------------|
| 7 | **Real-time Chat (WebSocket)** | Migrate chat from REST polling to WebSocket/Socket.io for instant messaging |
| 8 | **Deep Linking** | Implement deep links for referral invites, course shares, payment redirects |
| 9 | **Offline Mode** | Cache course content and dashboard data for offline viewing on mobile |
| 10 | **Search API** | Add global search endpoint for courses, forum topics, users |
| 11 | **Transaction Export** | Allow users to export wallet transactions as CSV/PDF |
| 12 | **KYC/Identity Verification** | Add ID verification step before withdrawals |

### Low Priority / Enhancement

| # | Feature | Description |
|---|---------|-------------|
| 13 | **Multi-language (i18n)** | Support multiple languages (English, French, Spanish, etc.) |
| 14 | **Dark Mode Sync** | Sync theme preference between web and mobile |
| 15 | **Course Reviews/Ratings** | Allow students to rate and review completed courses |
| 16 | **Achievement Badges Sharing** | Social sharing of earned achievements |
| 17 | **Investment Calculator** | Client-side ROI calculator tool for investment deals |
| 18 | **Advanced Analytics Dashboard** | Per-user analytics with charts and data export |
| 19 | **Referral Link Generator** | Deep-link-enabled referral URLs with tracking |
| 20 | **Automated Payout Processing** | Cron job for auto-processing approved payouts |
| 21 | **2FA (TOTP)** | Two-factor authentication via authenticator app |
| 22 | **Audit Logging** | Track all admin actions and sensitive operations |
| 23 | **API Versioning** | Add version prefix (e.g., `/api/v1/`) for backward compatibility |
| 24 | **WebSocket Notifications** | Real-time notification delivery via WebSocket |
| 25 | **Mobile-specific Auth** | Device token management for push notifications and session tracking |
