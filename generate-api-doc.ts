import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, PageBreak, ShadingType,
  Header, Footer, PageNumber, NumberFormat,
  TableOfContents, StyleLevel, BorderStyle,
  Tab, TabStopPosition, TabStopType,
  SectionType, convertInchesToTwip, LevelFormat,
} from "docx";
import * as fs from "fs";

// ===========================
// COLOR PALETTE - Midnight Code
// ===========================
const COLORS = {
  primary: "020617",
  body: "1E293B",
  secondary: "64748B",
  accent: "94A3B8",
  tableBg: "F8FAFC",
  white: "FFFFFF",
  codeBg: "F1F5F9",
  methodPost: "16A34A",
  methodGet: "2563EB",
  methodPut: "D97706",
  methodPatch: "7C3AED",
  methodDelete: "DC2626",
  success: "16A34A",
  error: "DC2626",
  warning: "D97706",
  lightBorder: "E2E8F0",
};

const LINE_SPACING = 250; // 1.3x
const FONT_BODY = "Calibri";
const FONT_HEADING = "Times New Roman";
const FONT_CODE = "Courier New";

// ===========================
// HELPER FUNCTIONS
// ===========================

function createBorder(color = COLORS.lightBorder) {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color },
    bottom: { style: BorderStyle.SINGLE, size: 1, color },
    left: { style: BorderStyle.SINGLE, size: 1, color },
    right: { style: BorderStyle.SINGLE, size: 1, color },
  };
}

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
}

function headerCell(text: string, width?: number) {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: COLORS.tableBg },
    borders: createBorder(),
    verticalAlign: "center",
    width: width ? { size: width, type: "dxa" } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { line: LINE_SPACING },
        children: [
          new TextRun({ text, bold: true, font: FONT_BODY, size: 20, color: COLORS.primary }),
        ],
      }),
    ],
  });
}

function bodyCell(text: string, bold = false, color = COLORS.body, width?: number) {
  return new TableCell({
    borders: createBorder(),
    verticalAlign: "center",
    width: width ? { size: width, type: "dxa" } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { line: LINE_SPACING },
        children: [
          new TextRun({ text, font: FONT_BODY, size: 20, color, bold }),
        ],
      }),
    ],
  });
}

function bodyCellMulti(runs: TextRun[], width?: number) {
  return new TableCell({
    borders: createBorder(),
    verticalAlign: "center",
    width: width ? { size: width, type: "dxa" } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { line: LINE_SPACING },
        children: runs,
      }),
    ],
  });
}

function codeCell(text: string, width?: number) {
  return new TableCell({
    borders: createBorder(),
    verticalAlign: "center",
    width: width ? { size: width, type: "dxa" } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { line: LINE_SPACING },
        children: [
          new TextRun({ text, font: FONT_CODE, size: 18, color: COLORS.body }),
        ],
      }),
    ],
  });
}

function fieldTable(fields: { field: string; type: string; required?: boolean; description: string }[]) {
  const rows = [
    new TableRow({
      children: [
        headerCell("Field", 2200),
        headerCell("Type", 2000),
        headerCell("Required", 1200),
        headerCell("Description", 4600),
      ],
    }),
  ];
  for (const f of fields) {
    rows.push(
      new TableRow({
        children: [
          codeCell(f.field, 2200),
          bodyCell(f.type, false, COLORS.secondary, 2000),
          bodyCell(f.required !== false ? "Yes" : "No", false, f.required !== false ? COLORS.success : COLORS.secondary, 1200),
          bodyCell(f.description, false, COLORS.body, 4600),
        ],
      })
    );
  }
  return new Table({
    width: { size: 100, type: "pct" },
    rows,
  });
}

function endpointMetaTable(
  method: string,
  url: string,
  authRequired: boolean | string,
  adminOnly = false
) {
  const methodColors: Record<string, string> = {
    GET: COLORS.methodGet,
    POST: COLORS.methodPost,
    PUT: COLORS.methodPut,
    PATCH: COLORS.methodPatch,
    DELETE: COLORS.methodDelete,
  };

  return new Table({
    width: { size: 100, type: "pct" },
    rows: [
      new TableRow({
        children: [
          headerCell("Field", 3000),
          headerCell("Value", 7000),
        ],
      }),
      new TableRow({
        children: [
          bodyCell("Method", true, undefined, 3000),
          bodyCellMulti(
            [new TextRun({ text: method, bold: true, font: FONT_CODE, size: 20, color: methodColors[method] || COLORS.body })],
            7000
          ),
        ],
      }),
      new TableRow({
        children: [
          bodyCell("URL", true, undefined, 3000),
          codeCell(url, 7000),
        ],
      }),
      new TableRow({
        children: [
          bodyCell("Auth Required", true, undefined, 3000),
          bodyCell(
            typeof authRequired === "string" ? authRequired : authRequired ? "Yes (Bearer JWT)" : "No",
            false,
            authRequired ? COLORS.success : COLORS.secondary,
            7000
          ),
        ],
      }),
      new TableRow({
        children: [
          bodyCell("Admin Only", true, undefined, 3000),
          bodyCell(adminOnly ? "Yes" : "No", false, adminOnly ? COLORS.error : COLORS.secondary, 7000),
        ],
      }),
    ],
  });
}

function codeBlock(code: string) {
  return new Table({
    width: { size: 100, type: "pct" },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: COLORS.codeBg },
            borders: createBorder(),
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: code.split("\n").map(
              (line) =>
                new Paragraph({
                  spacing: { line: 220 },
                  children: [
                    new TextRun({ text: line || " ", font: FONT_CODE, size: 18, color: COLORS.body }),
                  ],
                })
            ),
          }),
        ],
      }),
    ],
  });
}

function heading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 200, line: LINE_SPACING },
    children: [
      new TextRun({ text, font: FONT_HEADING, size: 28, bold: true, color: COLORS.primary }),
    ],
  });
}

function heading3(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 160, line: LINE_SPACING },
    children: [
      new TextRun({ text, font: FONT_HEADING, size: 24, bold: true, color: COLORS.primary }),
    ],
  });
}

function bodyPara(text: string, spacingAfter = 120) {
  return new Paragraph({
    spacing: { after: spacingAfter, line: LINE_SPACING },
    children: [
      new TextRun({ text, font: FONT_BODY, size: 22, color: COLORS.body }),
    ],
  });
}

function boldBodyPara(boldText: string, normalText: string) {
  return new Paragraph({
    spacing: { after: 120, line: LINE_SPACING },
    children: [
      new TextRun({ text: boldText, font: FONT_BODY, size: 22, color: COLORS.primary, bold: true }),
      new TextRun({ text: normalText, font: FONT_BODY, size: 22, color: COLORS.body }),
    ],
  });
}

function labelPara(label: string) {
  return new Paragraph({
    spacing: { before: 200, after: 80, line: LINE_SPACING },
    children: [
      new TextRun({ text: label, font: FONT_BODY, size: 22, color: COLORS.secondary, bold: true }),
    ],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// Endpoint builder helper
function endpoint(
  title: string,
  method: string,
  url: string,
  desc: string,
  authRequired: boolean | string = false,
  adminOnly = false,
  requestFields?: { field: string; type: string; required?: boolean; description: string }[],
  responseJson?: string,
  extraContent?: (Paragraph | Table)[]
) {
  const items: (Paragraph | Table)[] = [];
  items.push(heading3(title));
  items.push(bodyPara(desc));
  items.push(emptyLine());
  items.push(endpointMetaTable(method, url, authRequired, adminOnly));
  if (requestFields && requestFields.length > 0) {
    items.push(emptyLine());
    items.push(labelPara("Request Body"));
    items.push(fieldTable(requestFields));
  }
  if (responseJson) {
    items.push(emptyLine());
    items.push(labelPara("Response"));
    items.push(codeBlock(responseJson));
  }
  if (extraContent) {
    items.push(emptyLine());
    items.push(...extraContent);
  }
  return items;
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ===========================
// COVER PAGE SECTION
// ===========================
const coverSection = {
  properties: {
    page: {
      margin: {
        top: convertInchesToTwip(1),
        bottom: convertInchesToTwip(1),
        left: convertInchesToTwip(1),
        right: convertInchesToTwip(1),
      },
    },
    titlePage: true,
    sectionType: SectionType.NEXT_PAGE,
  },
  children: [
    // Spacer to push content to vertical center
    ...Array(8).fill(null).map(() => new Paragraph({ spacing: { after: 200 }, children: [] })),
    // Decorative line
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: "━".repeat(40), font: FONT_BODY, size: 22, color: COLORS.accent }),
      ],
    }),
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "HUSTLE UNIVERSITY", font: FONT_HEADING, size: 56, bold: true, color: COLORS.primary }),
      ],
    }),
    // Subtitle
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "REST API Documentation", font: FONT_HEADING, size: 36, color: COLORS.secondary }),
      ],
    }),
    // Decorative line
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: "━".repeat(40), font: FONT_BODY, size: 22, color: COLORS.accent }),
      ],
    }),
    // Tagline
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({ text: "For Mobile App Integration", font: FONT_BODY, size: 24, color: COLORS.accent, italics: true }),
      ],
    }),
    // Version
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Version 1.0  |  June 2025", font: FONT_BODY, size: 22, color: COLORS.secondary }),
      ],
    }),
    // Confidential badge
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({ text: "  CONFIDENTIAL  ", font: FONT_BODY, size: 22, bold: true, color: COLORS.error }),
      ],
    }),
    // Bottom decorative line
    ...Array(6).fill(null).map(() => new Paragraph({ spacing: { after: 200 }, children: [] })),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "━".repeat(40), font: FONT_BODY, size: 22, color: COLORS.accent }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "© 2025 Hustle University. All rights reserved.", font: FONT_BODY, size: 18, color: COLORS.accent }),
      ],
    }),
  ],
};

// ===========================
// TOC SECTION
// ===========================
const tocSection = {
  properties: {
    page: {
      margin: {
        top: convertInchesToTwip(1),
        bottom: convertInchesToTwip(1),
        left: convertInchesToTwip(1),
        right: convertInchesToTwip(1),
      },
    },
  },
  headers: {
    default: new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Hustle University API Documentation", font: FONT_BODY, size: 18, color: COLORS.accent, italics: true }),
          ],
        }),
      ],
    }),
  },
  footers: {
    default: new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", font: FONT_BODY, size: 18, color: COLORS.accent }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: COLORS.accent }),
            new TextRun({ text: " of ", font: FONT_BODY, size: 18, color: COLORS.accent }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_BODY, size: 18, color: COLORS.accent }),
          ],
        }),
      ],
    }),
  },
  children: [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 300, line: LINE_SPACING },
      children: [
        new TextRun({ text: "Table of Contents", font: FONT_HEADING, size: 36, bold: true, color: COLORS.primary }),
      ],
    }),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300 },
      children: [
        new TextRun({ text: "ℹ  Right-click the table above and select \"Update Field\" to refresh page numbers.", font: FONT_BODY, size: 20, color: COLORS.accent, italics: true }),
      ],
    }),
    pageBreak(),
  ],
};

// ===========================
// MAIN CONTENT SECTION
// ===========================
const mainContent: (Paragraph | Table)[] = [];

// ======================================================
// SECTION 1: INTRODUCTION
// ======================================================
mainContent.push(heading2("1. Introduction"));

mainContent.push(heading3("1.1 Overview"));
mainContent.push(bodyPara(
  "Hustle University is a comprehensive ed-tech and wealth-generation platform that combines online learning, investment opportunities, referral-based income (MLM), and community features. This API documentation provides mobile app developers with all the endpoints needed to build a fully functional mobile client."
));
mainContent.push(bodyPara(
  "The platform supports user authentication, course enrollment and progress tracking, wallet and payment processing (Flutterwave for card/bank and Cryptomus for cryptocurrency), individual and group investment pools, an escrow system for secure transactions, a multi-level referral program, community features (forum, chat, Q&A sessions), and comprehensive admin management."
));

mainContent.push(heading3("1.2 Base URL"));
mainContent.push(codeBlock("https://api.hustleuniversity.com/v1"));

mainContent.push(heading3("1.3 Authentication"));
mainContent.push(bodyPara(
  "All protected endpoints require a JSON Web Token (JWT) in the Authorization header. Obtain a token by logging in via the authentication endpoints."
));
mainContent.push(codeBlock(`Authorization: Bearer <jwt_token>`));

mainContent.push(heading3("1.4 Response Format"));
mainContent.push(bodyPara("All API responses follow a consistent JSON format:"));
mainContent.push(codeBlock(`{
  "data": { ... },
  "message": "Success"
}`));

mainContent.push(heading3("1.5 Error Format"));
mainContent.push(bodyPara("Errors are returned with appropriate HTTP status codes:"));
mainContent.push(codeBlock(`{
  "error": "Description of the error"
}`));
mainContent.push(bodyPara("Common HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)."));

mainContent.push(heading3("1.6 Rate Limiting"));
mainContent.push(bodyPara(
  "API requests are rate-limited to 100 requests per minute per user. Exceeding this limit returns a 429 Too Many Requests response with a Retry-After header indicating when the next request can be made."
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 2: AUTHENTICATION
// ======================================================
mainContent.push(heading2("2. Authentication"));
mainContent.push(bodyPara(
  "The authentication endpoints handle user registration and login. On successful authentication, a JWT token is returned that must be included in the Authorization header for all protected endpoints."
));

mainContent.push(...endpoint(
  "Register a New User",
  "POST",
  "/api/auth/register",
  "Creates a new user account. Generates a unique referral code, hashes the password, creates a wallet, and processes referral bonuses if applicable.",
  false,
  false,
  [
    { field: "name", type: "string", description: "Full name of the user (max 100 characters)" },
    { field: "email", type: "string", description: "Valid email address (must be unique)" },
    { field: "password", type: "string", description: "Password (min 8 characters)" },
    { field: "confirmPassword", type: "string", description: "Must match the password field" },
    { field: "referralCode", type: "string", required: false, description: "Referral code of the person who referred this user (optional)" },
  ],
  `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...abc",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "referralCode": "JOHN-ABC123",
    "createdAt": "2025-06-01T10:00:00.000Z"
  },
  "message": "Registration successful"
}`
));

mainContent.push(...endpoint(
  "Login",
  "POST",
  "/api/auth/login",
  "Authenticates a user with email and password. Returns a JWT token and user profile data including subscription and wallet information.",
  false,
  false,
  [
    { field: "email", type: "string", description: "Registered email address" },
    { field: "password", type: "string", description: "User password" },
  ],
  `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...abc",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "referralCode": "JOHN-ABC123",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "startDate": "2025-05-01T...",
      "endDate": "2025-06-01T..."
    },
    "wallet": {
      "balance": 150.00
    }
  }
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 3: USER PROFILE & SETTINGS
// ======================================================
mainContent.push(heading2("3. User Profile & Settings"));
mainContent.push(bodyPara(
  "These endpoints allow users to view and update their profile information, change passwords, view statistics, and track achievements."
));

mainContent.push(...endpoint(
  "Get User Profile",
  "GET",
  "/api/user/profile",
  "Returns the authenticated user's complete profile including personal info, subscription plan, and wallet balance.",
  true,
  false,
  undefined,
  `{
  "id": "clx...abc",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "referralCode": "JOHN-ABC123",
  "referredBy": null,
  "avatar": null,
  "bio": null,
  "phone": null,
  "createdAt": "2025-06-01T10:00:00.000Z",
  "subscription": {
    "plan": "pro",
    "status": "active"
  },
  "walletBalance": 150.00
}`
));

mainContent.push(...endpoint(
  "Update User Profile",
  "PUT",
  "/api/user/profile",
  "Updates the authenticated user's profile fields. Email and role cannot be changed through this endpoint.",
  true,
  false,
  [
    { field: "name", type: "string", required: false, description: "Full name (non-empty, max 100 characters)" },
    { field: "bio", type: "string", required: false, description: "Biography (max 500 characters)" },
    { field: "phone", type: "string", required: false, description: "Phone number (non-empty if provided, max 20 characters)" },
    { field: "avatar", type: "string", required: false, description: "URL to avatar image" },
  ],
  `{
  "message": "Profile updated successfully",
  "user": {
    "id": "clx...abc",
    "name": "John Doe Updated",
    "bio": "Entrepreneur & learner",
    "phone": "+1234567890"
  }
}`
));

mainContent.push(...endpoint(
  "Change Password",
  "POST",
  "/api/user/password",
  "Allows the authenticated user to change their password. The current password must be verified before updating.",
  true,
  false,
  [
    { field: "currentPassword", type: "string", description: "The user's current password" },
    { field: "newPassword", type: "string", description: "New password (min 8 characters, max 128)" },
  ],
  `{
  "message": "Password updated successfully"
}`
));

mainContent.push(...endpoint(
  "Get User Stats",
  "GET",
  "/api/user/stats",
  "Returns comprehensive statistics for the authenticated user including wallet balance, investment counts, referral stats, course progress, achievements, and unread notification count.",
  true,
  false,
  undefined,
  `{
  "walletBalance": 150.00,
  "investments": {
    "total": 3,
    "totalAmount": 500.00,
    "activeCount": 2
  },
  "referrals": {
    "total": 5
  },
  "courses": {
    "enrolled": 4,
    "completed": 2
  },
  "achievements": {
    "earned": 5,
    "totalPoints": 250
  },
  "subscription": {
    "plan": "pro",
    "status": "active"
  },
  "unreadNotifications": 3,
  "withdrawals": {
    "total": 1,
    "pending": 0,
    "approved": 0,
    "completed": 1,
    "rejected": 0
  }
}`
));

mainContent.push(...endpoint(
  "Get Achievements",
  "GET",
  "/api/user/achievements",
  "Returns all available achievements with the authenticated user's earned status. On the first call, 12 seed achievements are automatically created.",
  true,
  false,
  undefined,
  `{
  "achievements": [
    {
      "id": "ach_01",
      "title": "First Steps",
      "description": "Complete your first course",
      "icon": "trophy",
      "category": "learning",
      "requirement": "Complete 1 course",
      "points": 10,
      "earned": true,
      "earnedAt": "2025-06-05T..."
    }
  ],
  "totalPoints": 250,
  "totalEarned": 5
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 4: DASHBOARD
// ======================================================
mainContent.push(heading2("4. Dashboard"));
mainContent.push(bodyPara("The dashboard endpoint provides a consolidated view of the user's key data for the main dashboard screen."));

mainContent.push(...endpoint(
  "Get Dashboard Data",
  "GET",
  "/api/dashboard",
  "Returns all data needed to render the main dashboard: overview stats, recent activity, subscription info, recent achievements, learning progress, investment summary, and weekly earnings chart data.",
  true,
  false,
  undefined,
  `{
  "stats": {
    "balance": 150.00,
    "totalReferrals": 5,
    "coursesCompleted": 2,
    "activeInvestments": 2
  },
  "activities": [
    {
      "id": "tx_01",
      "type": "credit",
      "amount": 10.00,
      "description": "Referral bonus",
      "createdAt": "2025-06-10T..."
    }
  ],
  "subscription": {
    "plan": "pro",
    "status": "active",
    "endDate": "2025-07-01T..."
  },
  "unreadNotifications": 3,
  "recentAchievements": [
    {
      "id": "ach_01",
      "title": "First Steps",
      "points": 10,
      "earnedAt": "2025-06-05T..."
    }
  ],
  "learningProgress": {
    "totalEnrolled": 4,
    "completed": 2,
    "totalLessonsCompleted": 24
  },
  "investmentSummary": {
    "totalInvested": 500.00,
    "activeCount": 2,
    "totalReturns": 75.00
  },
  "weeklyEarnings": [
    { "date": "2025-06-04", "amount": 25.00 },
    { "date": "2025-06-05", "amount": 10.00 },
    { "date": "2025-06-06", "amount": 0 },
    { "date": "2025-06-07", "amount": 40.00 },
    { "date": "2025-06-08", "amount": 15.00 },
    { "date": "2025-06-09", "amount": 0 },
    { "date": "2025-06-10", "amount": 35.00 }
  ]
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 5: COURSES & LEARNING
// ======================================================
mainContent.push(heading2("5. Courses & Learning"));
mainContent.push(bodyPara(
  "The courses and learning endpoints allow users to browse the course catalog, enroll in courses, track progress, earn certifications, and explore skill categories."
));

mainContent.push(...endpoint(
  "List All Courses",
  "GET",
  "/api/courses",
  "Returns a list of all available courses with enrollment counts and lesson counts. This endpoint is public and does not require authentication.",
  false,
  false,
  undefined,
  `{
  "courses": [
    {
      "id": "course_01",
      "title": "Cryptocurrency Fundamentals",
      "description": "Learn the basics of crypto...",
      "category": "Crypto",
      "difficulty": "beginner",
      "estimatedHours": 5,
      "_count": {
        "lessons": 12,
        "enrollments": 150
      }
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Get Course Detail",
  "GET",
  "/api/courses/[id]",
  "Returns detailed course information including all lessons in order. If authenticated, includes the user's enrollment status and completed lesson IDs.",
  "Yes (optional — enriches response with enrollment data)",
  false,
  undefined,
  `{
  "id": "course_01",
  "title": "Cryptocurrency Fundamentals",
  "description": "Learn the basics of crypto...",
  "category": "Crypto",
  "difficulty": "beginner",
  "estimatedHours": 5,
  "lessons": [
    {
      "id": "lesson_01",
      "title": "What is Blockchain?",
      "content": "Full lesson content...",
      "order": 1,
      "estimatedMinutes": 15
    }
  ],
  "enrollment": {
    "progress": 75,
    "completedLessonIds": ["lesson_01", "lesson_02", "lesson_03"]
  }
}`
));

mainContent.push(...endpoint(
  "Enroll in a Course",
  "POST",
  "/api/courses/enroll",
  "Enrolls the authenticated user in a specific course. Creates an enrollment record and sends a notification. Duplicate enrollments are handled gracefully.",
  true,
  false,
  [
    { field: "courseId", type: "string", description: "The course ID to enroll in" },
  ],
  `{
  "message": "Successfully enrolled in course",
  "enrollment": {
    "id": "enr_01",
    "courseId": "course_01",
    "progress": 0,
    "createdAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Update Course Progress",
  "POST",
  "/api/courses/progress",
  "Marks a lesson as completed for the authenticated user. Automatically recalculates the overall course progress percentage. Awards a $5 wallet bonus when the course reaches 100% completion.",
  true,
  false,
  [
    { field: "courseId", type: "string", description: "The course ID" },
    { field: "lessonId", type: "string", description: "The lesson ID to mark as completed" },
  ],
  `{
  "message": "Lesson progress updated",
  "enrollment": {
    "progress": 83.3,
    "completedAt": null
  },
  "bonusAwarded": false
}`
));

mainContent.push(...endpoint(
  "Get Certifications",
  "GET",
  "/api/certifications",
  "Returns all certifications earned by the authenticated user. Certifications are automatically awarded upon 100% course completion.",
  true,
  false,
  undefined,
  `{
  "certifications": [
    {
      "id": "cert_01",
      "badgeName": "Crypto Trading Master",
      "badgeIcon": "Award",
      "earnedAt": "2025-06-05T...",
      "course": {
        "id": "course_01",
        "title": "Cryptocurrency Fundamentals"
      }
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Get Skill Categories",
  "GET",
  "/api/skill-categories",
  "Returns all skill categories with their associated courses. Useful for browsing the course catalog by topic.",
  false,
  false,
  undefined,
  `{
  "categories": [
    {
      "id": "cat_01",
      "name": "Cryptocurrency",
      "slug": "cryptocurrency",
      "description": "Learn about digital currencies",
      "icon": "Bitcoin",
      "color": "#D4AF37",
      "order": 1,
      "isActive": true,
      "courses": [
        {
          "id": "course_01",
          "title": "Cryptocurrency Fundamentals",
          "difficulty": "beginner"
        }
      ]
    }
  ]
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 6: WALLET & PAYMENTS
// ======================================================
mainContent.push(heading2("6. Wallet & Payments"));
mainContent.push(bodyPara(
  "The wallet and payment endpoints handle balance inquiries, withdrawals, subscription management, and payment processing through Flutterwave (card/bank) and Cryptomus (cryptocurrency)."
));

mainContent.push(...endpoint(
  "Get Wallet Balance & Transactions",
  "GET",
  "/api/wallet",
  "Returns the user's wallet balance, the last 20 transactions, and the last 10 earnings.",
  true,
  false,
  undefined,
  `{
  "balance": 150.00,
  "transactions": [
    {
      "id": "tx_01",
      "type": "credit",
      "amount": 10.00,
      "description": "Referral bonus",
      "createdAt": "2025-06-10T..."
    }
  ],
  "earnings": [
    {
      "id": "earn_01",
      "amount": 10.00,
      "source": "referral",
      "description": "Referral bonus",
      "createdAt": "2025-06-10T..."
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Request Withdrawal",
  "POST",
  "/api/wallet/withdraw",
  "Creates a withdrawal request from the user's wallet. Minimum withdrawal amount is $10. Creates a withdrawal record with 'pending' status and sends a notification.",
  true,
  false,
  [
    { field: "amount", type: "number", description: "Amount to withdraw (minimum $10)" },
    { field: "walletAddress", type: "string", required: false, description: "Crypto wallet address or bank account details" },
  ],
  `{
  "message": "Withdrawal request submitted",
  "withdrawal": {
    "id": "wd_01",
    "amount": 50.00,
    "status": "pending",
    "walletAddress": "0xabc...",
    "createdAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Get Subscription",
  "GET",
  "/api/subscription",
  "Returns the authenticated user's current subscription details including plan, status, dates, and payment method information.",
  true,
  false,
  undefined,
  `{
  "id": "sub_01",
  "plan": "pro",
  "status": "active",
  "startDate": "2025-05-01T...",
  "endDate": "2025-06-01T...",
  "paymentMethod": "flutterwave",
  "paymentType": "subscription",
  "txRef": "FLW-MOCK-12345",
  "paidAt": "2025-05-01T..."
}`
));

mainContent.push(...endpoint(
  "Switch Subscription Plan",
  "POST",
  "/api/subscription/switch",
  "Switches the user's subscription to a different plan. Available plans: basic ($9.99), pro ($29.99), premium ($99.99).",
  true,
  false,
  [
    { field: "plan", type: "string", description: 'Target plan: "basic", "pro", or "premium"' },
  ],
  `{
  "message": "Subscription plan switched successfully",
  "subscription": {
    "id": "sub_01",
    "plan": "premium",
    "status": "active",
    "startDate": "2025-06-10T...",
    "endDate": "2025-07-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Initialize Payment (Flutterwave)",
  "POST",
  "/api/payments/initialize",
  "Initializes a Flutterwave payment for subscription or wallet funding. Returns a payment link for the user to complete checkout.",
  true,
  false,
  [
    { field: "amount", type: "number", description: "Payment amount" },
    { field: "type", type: "string", description: '"subscription" or "wallet_funding"' },
    { field: "plan", type: "string", required: false, description: 'Plan name (required if type is "subscription")' },
  ],
  `{
  "message": "Payment initialized",
  "paymentLink": "https://checkout.flutterwave.com/v3/hosted/pay/...",
  "txRef": "FLW-UY-1732..."
}`
));

mainContent.push(...endpoint(
  "Verify Payment",
  "GET",
  "/api/payments/verify",
  "Verifies the status of a payment by transaction reference. Supports both Flutterwave and Cryptomus payments based on the method parameter.",
  true,
  false,
  undefined,
  `{
  "status": "completed",
  "txRef": "FLW-UY-1732...",
  "amount": 29.99,
  "paymentMethod": "flutterwave",
  "paidAt": "2025-06-10T..."
}`
));

mainContent.push(...endpoint(
  "Initialize Crypto Payment (Cryptomus)",
  "POST",
  "/api/payments/crypto/initialize",
  "Creates a Cryptomus invoice for cryptocurrency payment. Returns a checkout URL, crypto address, QR code, and network details.",
  true,
  false,
  [
    { field: "amount", type: "number", description: "Payment amount in USD" },
    { field: "type", type: "string", description: '"subscription" or "wallet_funding"' },
    { field: "plan", type: "string", required: false, description: 'Plan name (required if type is "subscription")' },
    { field: "cryptoCurrency", type: "string", required: false, description: "Target crypto currency (e.g., USDT, BTC)" },
  ],
  `{
  "message": "Crypto payment initialized",
  "paymentLink": "https://pay.cryptomus.com/...",
  "cryptoAddress": "0x742d35Cc...",
  "qrCode": "data:image/png;base64,...",
  "network": "TRC20",
  "amountCrypto": 29.99,
  "txRef": "CRYPTO-UY-1732..."
}`
));

mainContent.push(...endpoint(
  "Verify Crypto Payment",
  "GET",
  "/api/payments/crypto/verify",
  "Polls the Cryptomus invoice status. Handles states: paid, paid_over, expired, and cancel.",
  true,
  false,
  undefined,
  `{
  "status": "paid",
  "txRef": "CRYPTO-UY-1732...",
  "amount": 29.99,
  "paymentMethod": "crypto",
  "paidAt": "2025-06-10T..."
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 7: INVESTMENTS
// ======================================================
mainContent.push(heading2("7. Investments"));
mainContent.push(bodyPara(
  "Individual investment endpoints allow users to browse active investment opportunities and commit funds. Investments are debited from the user's wallet."
));

mainContent.push(...endpoint(
  "List Investment Opportunities",
  "GET",
  "/api/investments",
  "Returns all active investment opportunities with the total pool amount and investor count. Includes the authenticated user's existing investments.",
  true,
  false,
  undefined,
  `{
  "opportunities": [
    {
      "id": "inv_01",
      "title": "Real Estate Fund Q3",
      "description": "Diversified real estate...",
      "minInvestment": 50,
      "maxInvestment": 5000,
      "roiPercent": 12.5,
      "duration": "90 days",
      "status": "active",
      "totalPool": 25000,
      "_count": {
        "investments": 45
      },
      "myInvestment": {
        "amount": 200,
        "expectedReturn": 225,
        "status": "active"
      }
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Invest in an Opportunity",
  "POST",
  "/api/investments/invest",
  "Commits funds to an investment opportunity. Validates min/max amounts, checks wallet balance, creates the investment record, updates the pool, debits the wallet, and sends a notification.",
  true,
  false,
  [
    { field: "opportunityId", type: "string", description: "The investment opportunity ID" },
    { field: "amount", type: "number", description: "Amount to invest (must be within min/max)" },
  ],
  `{
  "message": "Investment successful",
  "investment": {
    "id": "usr_inv_01",
    "amount": 200,
    "roiPercent": 12.5,
    "expectedReturn": 225,
    "status": "active",
    "startDate": "2025-06-10T..."
  }
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 8: GROUP INVESTMENT POOL
// ======================================================
mainContent.push(heading2("8. Group Investment Pool"));
mainContent.push(bodyPara(
  "Group investment pools allow users to collectively fund investment deals. Deals go through a proposal → voting → funding → active → matured lifecycle. Users can contribute, vote, and receive distributed payouts."
));

mainContent.push(...endpoint(
  "List Group Investment Deals",
  "GET",
  "/api/group-investments",
  "Returns all investment deals. Supports filtering by status. Includes the user's contribution and vote status for each deal.",
  true,
  false,
  undefined,
  `{
  "deals": [
    {
      "id": "deal_01",
      "title": "Lagos Real Estate Syndicate",
      "description": "Pool funds for...",
      "minContribution": 10,
      "maxContribution": 1000,
      "targetAmount": 50000,
      "currentPool": 25000,
      "roiPercent": 15,
      "duration": "6 months",
      "status": "funding",
      "riskLevel": "medium",
      "votesFor": 25,
      "votesAgainst": 3,
      "category": {
        "name": "Real Estate",
        "icon": "Building"
      },
      "myContribution": {
        "amount": 200,
        "sharePercent": 0.8,
        "status": "confirmed"
      },
      "myVote": "for"
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Create a Group Investment Deal",
  "POST",
  "/api/group-investments",
  "Creates a new investment deal proposal. The deal starts in 'proposed' status and moves to 'voting' when the voting deadline is set.",
  true,
  false,
  [
    { field: "categoryId", type: "string", required: false, description: "Investment category ID" },
    { field: "title", type: "string", description: "Deal title" },
    { field: "description", type: "string", description: "Deal description" },
    { field: "longDescription", type: "string", required: false, description: "Detailed markdown description" },
    { field: "location", type: "string", required: false, description: "Geographic location of the investment" },
    { field: "minContribution", type: "number", description: "Minimum contribution per user" },
    { field: "maxContribution", type: "number", required: false, description: "Maximum contribution per user (null = no max)" },
    { field: "targetAmount", type: "number", description: "Total target pool" },
    { field: "roiPercent", type: "number", description: "Expected ROI percentage" },
    { field: "duration", type: "string", description: 'Investment duration (e.g., "6 months")' },
    { field: "riskLevel", type: "string", description: '"low", "medium", or "high"' },
  ],
  `{
  "message": "Deal created successfully",
  "deal": {
    "id": "deal_02",
    "title": "Tech Startup Fund",
    "status": "proposed",
    "currentPool": 0,
    "createdAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Get Deal Detail",
  "GET",
  "/api/group-investments/[id]",
  "Returns comprehensive details for a specific deal including all contributions, votes, and payout history.",
  true,
  false,
  undefined,
  `{
  "id": "deal_01",
  "title": "Lagos Real Estate Syndicate",
  "description": "Pool funds for...",
  "currentPool": 25000,
  "targetAmount": 50000,
  "status": "funding",
  "contributions": [
    {
      "userId": "clx...abc",
      "userName": "John Doe",
      "amount": 200,
      "sharePercent": 0.8,
      "status": "confirmed"
    }
  ],
  "votes": [
    {
      "userId": "clx...abc",
      "vote": "for",
      "comment": "Great opportunity"
    }
  ],
  "payouts": []
}`
));

mainContent.push(...endpoint(
  "Update a Deal",
  "PATCH",
  "/api/group-investments/[id]",
  "Updates an investment deal. Only the deal creator or admin can modify deal details.",
  true,
  false,
  [
    { field: "title", type: "string", required: false, description: "Updated deal title" },
    { field: "description", type: "string", required: false, description: "Updated description" },
    { field: "status", type: "string", required: false, description: 'New status' },
    { field: "targetAmount", type: "number", required: false, description: "Updated target amount" },
    { field: "roiPercent", type: "number", required: false, description: "Updated ROI percentage" },
  ],
  `{
  "message": "Deal updated successfully",
  "deal": { "id": "deal_01", "title": "Updated Title" }
}`
));

mainContent.push(...endpoint(
  "Delete a Deal",
  "DELETE",
  "/api/group-investments/[id]",
  "Deletes an investment deal. Only the deal creator or admin can delete. Cannot delete deals with active contributions.",
  true,
  false,
  undefined,
  `{
  "message": "Deal deleted successfully"
}`
));

mainContent.push(...endpoint(
  "Contribute to a Deal",
  "POST",
  "/api/group-investments/[id]/contribute",
  "Contributes funds from the user's wallet to a group investment deal. Validates min/max contribution amounts and wallet balance.",
  true,
  false,
  [
    { field: "amount", type: "number", description: "Amount to contribute" },
  ],
  `{
  "message": "Contribution successful",
  "contribution": {
    "amount": 200,
    "sharePercent": 0.8,
    "expectedReturn": 230,
    "status": "confirmed"
  }
}`
));

mainContent.push(...endpoint(
  "Vote on a Deal",
  "POST",
  "/api/group-investments/[id]/vote",
  "Submits a vote (for/against) on a proposed investment deal. Users can only vote once per deal.",
  true,
  false,
  [
    { field: "vote", type: "string", description: '"for" or "against"' },
    { field: "comment", type: "string", required: false, description: "Optional comment explaining the vote" },
  ],
  `{
  "message": "Vote recorded successfully",
  "deal": {
    "votesFor": 26,
    "votesAgainst": 3
  }
}`
));

mainContent.push(...endpoint(
  "Distribute Deal Payouts",
  "POST",
  "/api/group-investments/[id]/distribute",
  "Distributes returns to all confirmed contributors of a matured deal. Calculates each contributor's share based on their contribution percentage. Admin only.",
  true,
  true,
  [
    { field: "totalReturn", type: "number", description: "Total return amount to distribute" },
  ],
  `{
  "message": "Payouts distributed successfully",
  "payouts": [
    {
      "userId": "clx...abc",
      "amount": 230,
      "principal": 200,
      "profit": 30,
      "status": "completed"
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Get Investment Categories",
  "GET",
  "/api/group-investments/categories",
  "Returns all investment categories with their deals and statistics.",
  false,
  false,
  undefined,
  `{
  "categories": [
    {
      "id": "cat_01",
      "name": "Real Estate",
      "slug": "real-estate",
      "description": "Property investments",
      "icon": "Building",
      "color": "#D4AF37",
      "isActive": true,
      "_count": {
        "deals": 5
      }
    }
  ]
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 9: REFERRALS & MLM
// ======================================================
mainContent.push(heading2("9. Referrals & MLM"));
mainContent.push(bodyPara(
  "The referral system implements a 3-level multi-level marketing (MLM) structure. Users earn commissions on payments made by their direct referrals (Level 1), second-level referrals (Level 2), and third-level referrals (Level 3)."
));

mainContent.push(...endpoint(
  "Get Referral Overview",
  "GET",
  "/api/referrals",
  "Returns the authenticated user's referral code, total referral count, active referrals (those who have enrolled in courses), total earnings, and a list of referred users.",
  true,
  false,
  undefined,
  `{
  "referralCode": "JOHN-ABC123",
  "totalReferrals": 15,
  "activeReferrals": [
    {
      "id": "clx...def",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2025-06-01T...",
      "enrollments": 3
    }
  ],
  "totalEarnings": 150.00,
  "referredUsers": [
    {
      "id": "clx...def",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2025-06-01T..."
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Get Commission History",
  "GET",
  "/api/referrals/commissions",
  "Returns paginated commission history with level-based filtering. Includes a summary of total earnings per MLM level.",
  true,
  false,
  undefined,
  `{
  "commissions": [
    {
      "id": "comm_01",
      "level": 1,
      "amount": 5.99,
      "percentage": 20,
      "description": "Level 1 commission from Jane Smith",
      "createdAt": "2025-06-10T...",
      "sourceUser": {
        "name": "Jane Smith"
      }
    }
  ],
  "summary": {
    "totalEarned": 150.00,
    "level1": { "earnings": 80.00, "count": 10 },
    "level2": { "earnings": 50.00, "count": 25 },
    "level3": { "earnings": 20.00, "count": 50 }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "totalPages": 5
  }
}`
));

mainContent.push(...endpoint(
  "Get Referral Tree",
  "GET",
  "/api/referrals/tree",
  "Returns the user's referral network as a hierarchical tree structure. Configurable depth up to 5 levels.",
  true,
  false,
  undefined,
  `{
  "tree": {
    "id": "clx...abc",
    "name": "John Doe",
    "children": [
      {
        "id": "clx...def",
        "name": "Jane Smith",
        "children": [
          {
            "id": "clx...ghi",
            "name": "Bob Wilson",
            "children": []
          }
        ]
      }
    ]
  },
  "stats": {
    "totalNetwork": 90,
    "directReferrals": 15,
    "level2Count": 45,
    "level3Count": 30
  }
}`
));

mainContent.push(...endpoint(
  "Get Referral Growth Analytics",
  "GET",
  "/api/referrals/growth",
  "Returns network growth analytics including total network size, recent signups chart (30-day daily breakdown), growth rate percentage, and monthly commission earnings.",
  true,
  false,
  undefined,
  `{
  "totalNetwork": 90,
  "directReferrals": 15,
  "level2Count": 45,
  "level3Count": 30,
  "recentSignups": [
    { "date": "2025-06-01", "count": 2 },
    { "date": "2025-06-02", "count": 5 },
    { "date": "2025-06-03", "count": 1 }
  ],
  "growthRate": 12.5,
  "monthlyEarnings": {
    "may": 45.00,
    "june": 30.00
  }
}`
));

mainContent.push(...endpoint(
  "Create Payout Request",
  "POST",
  "/api/referrals/payout",
  "Creates a payout request for commission earnings. Supports Bitcoin, USDT, and bank transfer methods. Minimum $10. Validates wallet balance and method-specific requirements.",
  true,
  false,
  [
    { field: "amount", type: "number", description: "Payout amount (minimum $10)" },
    { field: "method", type: "string", description: '"bitcoin", "usdt", or "bank_transfer"' },
    { field: "currency", type: "string", required: false, description: '"USD", "USDT", or "BTC" (default: USD)' },
    { field: "walletAddress", type: "string", required: false, description: "Crypto wallet address (for bitcoin/usdt)" },
    { field: "bankName", type: "string", required: false, description: "Bank name (for bank_transfer)" },
    { field: "bankAccount", type: "string", required: false, description: "Bank account number" },
    { field: "bankAccountName", type: "string", required: false, description: "Account holder name" },
  ],
  `{
  "message": "Payout request created successfully",
  "payout": {
    "id": "pay_01",
    "amount": 50.00,
    "method": "bitcoin",
    "currency": "BTC",
    "status": "pending",
    "createdAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Get Payout History",
  "GET",
  "/api/referrals/payout",
  "Returns paginated payout history for the authenticated user.",
  true,
  false,
  undefined,
  `{
  "payouts": [
    {
      "id": "pay_01",
      "amount": 50.00,
      "method": "bitcoin",
      "currency": "BTC",
      "status": "completed",
      "txHash": "0xabc123...",
      "processedAt": "2025-06-12T...",
      "createdAt": "2025-06-10T..."
    }
  ]
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 10: ESCROW SYSTEM
// ======================================================
mainContent.push(heading2("10. Escrow System"));
mainContent.push(bodyPara(
  "The escrow system provides secure fund holding for deals, investments, service payments, and milestone-based releases. Escrows go through collecting → funded → active → released lifecycle stages, with support for disputes, milestones, and expiration handling."
));

mainContent.push(...endpoint(
  "List Escrows",
  "GET",
  "/api/escrow",
  "Lists escrow transactions. Admin view includes contributor, milestone, and dispute counts. User view shows their specific contribution status. Supports ?status= and ?type= query filters.",
  true,
  false,
  undefined,
  `{
  "escrows": [
    {
      "id": "esc_01",
      "title": "Deal #1 - Real Estate Fund",
      "type": "deal_funding",
      "status": "collecting",
      "targetAmount": 50000,
      "collectedAmount": 25000,
      "currency": "USD",
      "fundingPercentage": 50,
      "feePercent": 2.5,
      "minContribution": 100,
      "maxContribution": 5000,
      "fundingDeadline": "2025-07-01T...",
      "releaseDate": "2025-08-01T...",
      "createdAt": "2025-06-01T..."
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Create Escrow",
  "POST",
  "/api/escrow",
  "Creates a new escrow transaction. Admin only. Supports optional milestones with percentage validation (must sum to 100%).",
  true,
  true,
  [
    { field: "title", type: "string", description: "Escrow title" },
    { field: "description", type: "string", required: false, description: "Detailed description" },
    { field: "type", type: "string", required: false, description: '"deal_funding", "investment_deal", "service_payment", or "milestone"' },
    { field: "targetAmount", type: "number", description: "Funding target" },
    { field: "feePercent", type: "number", required: false, description: "Platform fee percentage (default: 0)" },
    { field: "minContribution", type: "number", required: false, description: "Minimum contribution per user" },
    { field: "maxContribution", type: "number", required: false, description: "Maximum contribution (0 = no max)" },
    { field: "fundingDeadline", type: "string", required: false, description: "ISO date for funding deadline" },
    { field: "releaseDate", type: "string", required: false, description: "ISO date for auto-release" },
    { field: "terms", type: "string", required: false, description: "JSON string of terms & conditions" },
    { field: "milestones", type: "array", required: false, description: "Array of { title, description, percentage } (must sum to 100%)" },
  ],
  `{
  "message": "Escrow created successfully",
  "escrow": {
    "id": "esc_02",
    "title": "New Deal Escrow",
    "status": "collecting",
    "targetAmount": 100000,
    "collectedAmount": 0,
    "createdAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Get Escrow Detail",
  "GET",
  "/api/escrow/[id]",
  "Returns full escrow details including all contributions (with user names), milestones (with approver info), disputes, and funding percentage. Admin sees all details; users see limited info plus their specific contribution.",
  true,
  false,
  undefined,
  `{
  "id": "esc_01",
  "title": "Deal #1 - Real Estate Fund",
  "status": "collecting",
  "targetAmount": 50000,
  "collectedAmount": 25000,
  "fundingPercentage": 50,
  "contributions": [
    {
      "userId": "clx...abc",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "amount": 500,
      "status": "confirmed",
      "paidAt": "2025-06-05T..."
    }
  ],
  "milestones": [
    {
      "id": "ms_01",
      "title": "Phase 1 Completion",
      "percentage": 50,
      "status": "pending"
    }
  ],
  "disputes": [],
  "myContribution": {
    "amount": 500,
    "status": "confirmed"
  }
}`
));

mainContent.push(...endpoint(
  "Contribute to Escrow",
  "POST",
  "/api/escrow/[id]/contribute",
  "Authenticated users can contribute to an escrow. For wallet payment, directly debits the wallet. For flutterwave/crypto, creates a pending contribution and returns a payment URL.",
  true,
  false,
  [
    { field: "amount", type: "number", description: "Contribution amount" },
    { field: "paymentMethod", type: "string", required: false, description: '"wallet" (default), "flutterwave", or "crypto"' },
  ],
  `{
  "message": "Contribution successful",
  "contribution": {
    "amount": 500,
    "status": "confirmed",
    "paidAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Release All Escrow Funds",
  "POST",
  "/api/escrow/[id]/release",
  "Admin only. Releases all funds proportionally to contributors (net of platform fees).",
  true,
  true,
  undefined,
  `{
  "message": "Funds released successfully",
  "escrow": {
    "id": "esc_01",
    "status": "released",
    "collectedAmount": 50000
  }
}`
));

mainContent.push(...endpoint(
  "Refund All Contributions",
  "POST",
  "/api/escrow/[id]/refund",
  "Admin only. Refunds all confirmed contributions back to user wallets.",
  true,
  true,
  undefined,
  `{
  "message": "All contributions refunded successfully",
  "escrow": {
    "id": "esc_01",
    "status": "refunded"
  }
}`
));

mainContent.push(...endpoint(
  "Cancel Escrow",
  "POST",
  "/api/escrow/[id]/cancel",
  "Admin only. Cancels the escrow and automatically refunds all contributions.",
  true,
  true,
  undefined,
  `{
  "message": "Escrow cancelled successfully",
  "escrow": {
    "id": "esc_01",
    "status": "cancelled"
  }
}`
));

mainContent.push(...endpoint(
  "Raise a Dispute",
  "POST",
  "/api/escrow/[id]/disputes",
  "Contributors with confirmed contributions can raise a dispute. Changes the escrow status to 'disputed'.",
  true,
  false,
  [
    { field: "reason", type: "string", description: "Reason for the dispute" },
    { field: "evidence", type: "string", required: false, description: "JSON string with supporting evidence" },
  ],
  `{
  "message": "Dispute raised successfully",
  "dispute": {
    "id": "disp_01",
    "reason": "Funds not released as per terms",
    "status": "open",
    "createdAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Resolve a Dispute",
  "POST",
  "/api/escrow/[id]/disputes/[disputeId]/resolve",
  "Admin only. Resolves a dispute with one of three actions: dismiss (reverts escrow status), refund (refunds all contributions), or release (releases all funds).",
  true,
  true,
  [
    { field: "action", type: "string", description: '"dismiss", "refund", or "release"' },
    { field: "resolution", type: "string", description: "Resolution explanation" },
  ],
  `{
  "message": "Dispute resolved successfully",
  "dispute": {
    "id": "disp_01",
    "status": "resolved",
    "resolution": "Terms verified, releasing funds",
    "resolvedAt": "2025-06-11T..."
  }
}`
));

mainContent.push(...endpoint(
  "Process Expired Escrows",
  "POST",
  "/api/escrow/process-expired",
  "Admin only. Automatically processes escrows that have passed their funding deadline without reaching the target. Refunds all confirmed contributions.",
  true,
  true,
  undefined,
  `{
  "message": "Processed 2 expired escrows",
  "processed": [
    {
      "id": "esc_03",
      "title": "Expired Deal",
      "status": "expired",
      "refundCount": 15
    }
  ]
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 11: COMMUNITY FEATURES
// ======================================================
mainContent.push(heading2("11. Community Features"));
mainContent.push(bodyPara(
  "The community features include a forum system for discussions, private messaging (1-on-1 and group chat), live Q&A sessions with experts, and a leaderboard for community engagement."
));

// 11.1 Forum
mainContent.push(heading3("11.1 Forum"));
mainContent.push(bodyPara("The forum system allows users to create topics, reply to discussions, and browse content by categories."));

mainContent.push(...endpoint(
  "Get Forum Categories",
  "GET",
  "/api/forum/categories",
  "Returns all active forum categories with topic counts.",
  false,
  false,
  undefined,
  `{
  "categories": [
    {
      "id": "fcat_01",
      "name": "General Discussion",
      "slug": "general",
      "description": "General topics",
      "icon": "MessageSquare",
      "color": "#D4AF37",
      "isActive": true,
      "_count": { "topics": 25 }
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Create Forum Topic",
  "POST",
  "/api/forum/topics",
  "Creates a new forum topic in a specified category.",
  true,
  false,
  [
    { field: "categoryId", type: "string", required: false, description: "Category ID (optional)" },
    { field: "title", type: "string", description: "Topic title" },
    { field: "content", type: "string", description: "Topic content (markdown supported)" },
    { field: "tags", type: "string", required: false, description: "JSON array of tag strings" },
  ],
  `{
  "message": "Topic created",
  "topic": {
    "id": "topic_01",
    "title": "Best crypto strategies?",
    "categoryId": "fcat_01",
    "replyCount": 0,
    "createdAt": "2025-06-10T..."
  }
}`
));

mainContent.push(...endpoint(
  "Get Forum Topics",
  "GET",
  "/api/forum/topics",
  "Returns a list of forum topics with author info and reply counts. Supports pagination and category filtering.",
  false,
  false,
  undefined,
  `{
  "topics": [
    {
      "id": "topic_01",
      "title": "Best crypto strategies?",
      "content": "I'm looking for...",
      "author": {
        "id": "clx...abc",
        "name": "John Doe",
        "avatar": null
      },
      "category": {
        "name": "General Discussion"
      },
      "replyCount": 5,
      "lastReplyAt": "2025-06-11T...",
      "createdAt": "2025-06-10T..."
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Get Topic Detail",
  "GET",
  "/api/forum/topics/[id]",
  "Returns a forum topic with all its replies ordered by creation date.",
  false,
  false,
  undefined,
  `{
  "id": "topic_01",
  "title": "Best crypto strategies?",
  "content": "I'm looking for...",
  "author": { "name": "John Doe" },
  "replies": [
    {
      "id": "reply_01",
      "content": "I recommend DCA...",
      "author": { "name": "Jane Smith" },
      "createdAt": "2025-06-10T..."
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Reply to Topic",
  "POST",
  "/api/forum/topics/[id]/replies",
  "Adds a reply to a forum topic. Updates the topic's replyCount and lastReplyAt timestamp.",
  true,
  false,
  [
    { field: "content", type: "string", description: "Reply content (markdown supported)" },
  ],
  `{
  "message": "Reply added",
  "reply": {
    "id": "reply_02",
    "content": "Great question! Here's my take...",
    "createdAt": "2025-06-11T..."
  }
}`
));

// 11.2 Private Chat
mainContent.push(heading3("11.2 Private Chat"));
mainContent.push(bodyPara("The chat system supports 1-on-1 and group conversations with message history and read receipts."));

mainContent.push(...endpoint(
  "Get Conversations",
  "GET",
  "/api/chat/conversations",
  "Returns all conversations for the authenticated user, sorted by last message time.",
  true,
  false,
  undefined,
  `{
  "conversations": [
    {
      "id": "conv_01",
      "name": "Jane Smith",
      "isGroup": false,
      "lastMessageAt": "2025-06-11T...",
      "members": [
        { "userId": "clx...abc", "name": "John Doe" },
        { "userId": "clx...def", "name": "Jane Smith" }
      ],
      "lastMessage": {
        "content": "Sounds good!",
        "createdAt": "2025-06-11T..."
      },
      "unreadCount": 2
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Create Conversation",
  "POST",
  "/api/chat/conversations",
  "Creates a new 1-on-1 or group conversation with specified members.",
  true,
  false,
  [
    { field: "name", type: "string", required: false, description: "Group chat name (required for group chats)" },
    { field: "isGroup", type: "boolean", required: false, description: "Whether this is a group chat (default: false)" },
    { field: "memberIds", type: "string[]", description: "Array of user IDs to add to the conversation" },
  ],
  `{
  "message": "Conversation created",
  "conversation": {
    "id": "conv_02",
    "name": "Investment Club",
    "isGroup": true,
    "members": [
      { "userId": "clx...abc", "name": "John Doe" },
      { "userId": "clx...def", "name": "Jane Smith" }
    ]
  }
}`
));

mainContent.push(...endpoint(
  "Get Conversation Messages",
  "GET",
  "/api/chat/conversations/[id]/messages",
  "Returns all messages in a conversation, ordered by creation date. Only accessible to conversation members.",
  true,
  false,
  undefined,
  `{
  "messages": [
    {
      "id": "msg_01",
      "content": "Hey everyone!",
      "author": {
        "id": "clx...abc",
        "name": "John Doe"
      },
      "isRead": true,
      "createdAt": "2025-06-11T10:00:00.000Z"
    },
    {
      "id": "msg_02",
      "content": "Hi John!",
      "author": {
        "id": "clx...def",
        "name": "Jane Smith"
      },
      "isRead": false,
      "createdAt": "2025-06-11T10:05:00.000Z"
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Send Message",
  "POST",
  "/api/chat/conversations/[id]/messages",
  "Sends a message to a conversation. Only accessible to conversation members.",
  true,
  false,
  [
    { field: "content", type: "string", description: "Message content" },
  ],
  `{
  "message": "Message sent",
  "chatMessage": {
    "id": "msg_03",
    "content": "Let's discuss the new deal",
    "isRead": false,
    "createdAt": "2025-06-11T10:10:00.000Z"
  }
}`
));

mainContent.push(...endpoint(
  "Mark Messages as Read",
  "POST",
  "/api/chat/conversations/[id]/read",
  "Marks all unread messages in a conversation as read for the authenticated user.",
  true,
  false,
  undefined,
  `{
  "message": "Messages marked as read",
  "markedCount": 3
}`
));

// 11.3 Q&A Sessions
mainContent.push(heading3("11.3 Q&A Sessions"));
mainContent.push(bodyPara("Live Q&A sessions allow users to ask questions to experts. Questions can be upvoted and answered by the session host."));

mainContent.push(...endpoint(
  "List Q&A Sessions",
  "GET",
  "/api/qa/sessions",
  "Returns all Q&A sessions with status information. Sessions go through upcoming → live → ended lifecycle.",
  false,
  false,
  undefined,
  `{
  "sessions": [
    {
      "id": "qa_01",
      "title": "Crypto Market Analysis Live",
      "description": "Weekly market analysis",
      "expertName": "Dr. Sarah Chen",
      "expertTitle": "Chief Analyst",
      "scheduledAt": "2025-06-15T14:00:00.000Z",
      "duration": 60,
      "status": "upcoming",
      "_count": { "questions": 10 }
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Create Q&A Session",
  "POST",
  "/api/qa/sessions",
  "Creates a new Q&A session. Requires expert details and scheduling information.",
  true,
  false,
  [
    { field: "title", type: "string", description: "Session title" },
    { field: "description", type: "string", required: false, description: "Session description" },
    { field: "expertName", type: "string", description: "Expert's name" },
    { field: "expertBio", type: "string", required: false, description: "Expert's bio" },
    { field: "expertTitle", type: "string", required: false, description: "Expert's title" },
    { field: "scheduledAt", type: "string", description: "ISO datetime for the session" },
    { field: "duration", type: "number", required: false, description: "Duration in minutes (default: 60)" },
  ],
  `{
  "message": "Session created",
  "session": {
    "id": "qa_02",
    "title": "Investment Strategies for Beginners",
    "status": "upcoming",
    "scheduledAt": "2025-06-20T..."
  }
}`
));

mainContent.push(...endpoint(
  "Get Q&A Session Detail",
  "GET",
  "/api/qa/sessions/[id]",
  "Returns session details with all questions sorted by upvotes.",
  false,
  false,
  undefined,
  `{
  "id": "qa_01",
  "title": "Crypto Market Analysis Live",
  "expertName": "Dr. Sarah Chen",
  "scheduledAt": "2025-06-15T14:00:00.000Z",
  "status": "upcoming",
  "questions": [
    {
      "id": "q_01",
      "content": "What's your take on BTC halving?",
      "author": { "name": "John Doe" },
      "upvotes": 15,
      "isAnswered": false,
      "createdAt": "2025-06-10T..."
    }
  ]
}`
));

mainContent.push(...endpoint(
  "Update Q&A Session",
  "PATCH",
  "/api/qa/sessions/[id]",
  "Updates a Q&A session. Only the host or admin can modify.",
  true,
  false,
  [
    { field: "title", type: "string", required: false, description: "Updated title" },
    { field: "status", type: "string", required: false, description: '"upcoming", "live", or "ended"' },
    { field: "scheduledAt", type: "string", required: false, description: "Updated scheduled time" },
    { field: "duration", type: "number", required: false, description: "Updated duration" },
  ],
  `{
  "message": "Session updated",
  "session": { "id": "qa_01", "status": "live" }
}`
));

mainContent.push(...endpoint(
  "Ask a Question",
  "POST",
  "/api/qa/sessions/[id]/questions",
  "Submits a question to a Q&A session.",
  true,
  false,
  [
    { field: "content", type: "string", description: "Question content" },
  ],
  `{
  "message": "Question submitted",
  "question": {
    "id": "q_02",
    "content": "How do you evaluate altcoins?",
    "upvotes": 0,
    "isAnswered": false
  }
}`
));

mainContent.push(...endpoint(
  "Upvote a Question",
  "POST",
  "/api/qa/sessions/[id]/questions/[questionId]/upvote",
  "Upvotes a question. Users can only upvote once per question (toggle on/off).",
  true,
  false,
  undefined,
  `{
  "message": "Question upvoted",
  "upvotes": 16
}`
));

mainContent.push(...endpoint(
  "Answer a Question",
  "POST",
  "/api/qa/sessions/[id]/questions/[questionId]/answer",
  "Provides an answer to a question. Only the session host or admin can answer.",
  true,
  false,
  [
    { field: "answer", type: "string", description: "Answer content" },
  ],
  `{
  "message": "Question answered",
  "question": {
    "id": "q_01",
    "isAnswered": true,
    "answer": "The BTC halving reduces supply...",
    "answeredAt": "2025-06-15T..."
  }
}`
));

// 11.4 Leaderboard
mainContent.push(heading3("11.4 Leaderboard"));
mainContent.push(bodyPara("The leaderboard ranks users based on community engagement, learning progress, and investment activity."));

mainContent.push(...endpoint(
  "Get Community Leaderboard",
  "GET",
  "/api/community/leaderboard",
  "Returns the top-ranked users on the community leaderboard based on points from courses completed, investments, referrals, and community participation.",
  false,
  false,
  undefined,
  `{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "clx...abc",
      "name": "John Doe",
      "avatar": null,
      "points": 1250,
      "coursesCompleted": 12,
      "referralCount": 25,
      "investmentCount": 8
    },
    {
      "rank": 2,
      "userId": "clx...def",
      "name": "Jane Smith",
      "avatar": null,
      "points": 980,
      "coursesCompleted": 10,
      "referralCount": 15,
      "investmentCount": 5
    }
  ]
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 12: NOTIFICATIONS
// ======================================================
mainContent.push(heading2("12. Notifications"));
mainContent.push(bodyPara(
  "The notification system keeps users informed about platform events. Notifications are automatically created for registrations, enrollments, investments, withdrawals, and other key actions."
));

mainContent.push(...endpoint(
  "Get Notifications",
  "GET",
  "/api/notifications",
  "Returns all notifications for the authenticated user, sorted newest first. Includes unread count.",
  true,
  false,
  undefined,
  `{
  "notifications": [
    {
      "id": "notif_01",
      "title": "Investment Successful",
      "message": "Your $200 investment in Real Estate Fund has been confirmed.",
      "type": "success",
      "read": false,
      "createdAt": "2025-06-10T..."
    },
    {
      "id": "notif_02",
      "title": "Withdrawal Approved",
      "message": "Your $50 withdrawal has been approved.",
      "type": "info",
      "read": true,
      "createdAt": "2025-06-09T..."
    }
  ],
  "unreadCount": 1
}`
));

mainContent.push(...endpoint(
  "Mark All Notifications as Read",
  "PUT",
  "/api/notifications",
  "Marks all notifications for the authenticated user as read.",
  true,
  false,
  undefined,
  `{
  "message": "All notifications marked as read",
  "markedCount": 5
}`
));

mainContent.push(...endpoint(
  "Mark Single Notification as Read",
  "PUT",
  "/api/notifications/[id]",
  "Marks a specific notification as read. Validates ownership of the notification.",
  true,
  false,
  undefined,
  `{
  "message": "Notification marked as read",
  "notification": {
    "id": "notif_01",
    "read": true
  }
}`
));

mainContent.push(...endpoint(
  "Delete Notification",
  "DELETE",
  "/api/notifications/[id]",
  "Deletes a specific notification. Validates ownership of the notification.",
  true,
  false,
  undefined,
  `{
  "message": "Notification deleted"
}`
));

mainContent.push(pageBreak());

// ======================================================
// SECTION 13: ADMIN APIs
// ======================================================
mainContent.push(heading2("13. Admin APIs"));
mainContent.push(bodyPara(
  "All admin endpoints require the authenticated user to have the admin role. Unauthorized access returns a 403 Forbidden response."
));
mainContent.push(bodyPara(
  "The admin APIs provide comprehensive platform management capabilities including user management, content management, financial oversight, and system analytics."
));

// Admin endpoints summary table
mainContent.push(heading3("13.1 Admin Endpoints Overview"));

const adminEndpoints = [
  { method: "GET", url: "/api/admin/stats", desc: "Platform analytics dashboard (user growth, revenue, subscriptions, investments)" },
  { method: "GET", url: "/api/admin?action=users", desc: "List all users with wallet balance, subscription, and counts" },
  { method: "GET", url: "/api/admin/users/[id]", desc: "Get user detail with transactions, payments, and stats" },
  { method: "PATCH", url: "/api/admin/users/[id]", desc: "Update user name/role" },
  { method: "DELETE", url: "/api/admin/users/[id]", desc: "Suspend user account (sets role to 'suspended')" },
  { method: "POST", url: "/api/admin/users/[id]/balance", desc: "Adjust user wallet balance (credit/debit with reason)" },
  { method: "PUT", url: "/api/admin/users/[id]/role", desc: "Update user role" },
  { method: "GET", url: "/api/admin?action=withdrawals", desc: "List all withdrawal requests with user info" },
  { method: "PUT", url: "/api/admin/withdrawals/[id]", desc: "Approve, reject, or complete a withdrawal" },
  { method: "GET", url: "/api/admin/courses", desc: "List all courses with enrollment counts" },
  { method: "POST", url: "/api/admin?action=create-course", desc: "Create a new course" },
  { method: "GET", url: "/api/admin/courses/[id]", desc: "Get course detail with lessons and enrollments" },
  { method: "PATCH", url: "/api/admin/courses/[id]", desc: "Update course details" },
  { method: "DELETE", url: "/api/admin/courses/[id]", desc: "Delete course (cascading)" },
  { method: "POST", url: "/api/admin/courses/[id]/lessons", desc: "Add lesson to course" },
  { method: "GET", url: "/api/admin/investments", desc: "List investment opportunities" },
  { method: "POST", url: "/api/admin?action=create-investment", desc: "Create investment opportunity" },
  { method: "GET", url: "/api/admin/investments/[id]", desc: "Get investment detail with investors" },
  { method: "PATCH", url: "/api/admin/investments/[id]", desc: "Update investment opportunity" },
  { method: "DELETE", url: "/api/admin/investments/[id]", desc: "Delete investment (no active investors)" },
  { method: "GET", url: "/api/admin/payments", desc: "Paginated payment listing with filters" },
  { method: "GET", url: "/api/admin/payouts", desc: "List referral payout requests" },
  { method: "PUT", url: "/api/admin/payouts/[id]", desc: "Approve/reject/complete a payout" },
  { method: "POST", url: "/api/admin/notifications/broadcast", desc: "Send notification to all users or specific user IDs" },
];

const adminRows = [
  new TableRow({
    children: [
      headerCell("Method", 1800),
      headerCell("Endpoint", 4500),
      headerCell("Description", 4700),
    ],
  }),
];

for (const ep of adminEndpoints) {
  const methodColors: Record<string, string> = {
    GET: COLORS.methodGet,
    POST: COLORS.methodPost,
    PUT: COLORS.methodPut,
    PATCH: COLORS.methodPatch,
    DELETE: COLORS.methodDelete,
  };
  adminRows.push(
    new TableRow({
      children: [
        bodyCellMulti(
          [new TextRun({ text: ep.method, bold: true, font: FONT_CODE, size: 18, color: methodColors[ep.method] || COLORS.body })],
          1800
        ),
        codeCell(ep.url, 4500),
        bodyCell(ep.desc, false, COLORS.body, 4700),
      ],
    })
  );
}

mainContent.push(new Table({ width: { size: 100, type: "pct" }, rows: adminRows }));

mainContent.push(pageBreak());

// ======================================================
// SECTION 14: DATA MODELS
// ======================================================
mainContent.push(heading2("14. Data Models"));
mainContent.push(bodyPara(
  "The following are the key Prisma data models used in the Hustle University platform. These models define the database schema and relationships."
));

const dataModels: { name: string; fields: { name: string; type: string; description: string }[] }[] = [
  {
    name: "User",
    fields: [
      { name: "id", type: "String", description: "Unique identifier (cuid)" },
      { name: "name", type: "String", description: "Full name" },
      { name: "email", type: "String (unique)", description: "Email address" },
      { name: "password", type: "String", description: "Hashed password (bcrypt)" },
      { name: "role", type: "String", description: '"user" or "admin"' },
      { name: "referralCode", type: "String (unique)", description: "Unique referral code" },
      { name: "referredBy", type: "String?", description: "Referrer's code" },
      { name: "avatar", type: "String?", description: "Avatar URL" },
      { name: "bio", type: "String?", description: "Biography" },
      { name: "phone", type: "String?", description: "Phone number" },
      { name: "createdAt", type: "DateTime", description: "Account creation date" },
      { name: "updatedAt", type: "DateTime", description: "Last update date" },
    ],
  },
  {
    name: "Course",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "title", type: "String", description: "Course title" },
      { name: "description", type: "String?", description: "Course description" },
      { name: "category", type: "String?", description: "Course category" },
      { name: "thumbnail", type: "String?", description: "Thumbnail URL" },
      { name: "difficulty", type: "String", description: '"beginner", "intermediate", "advanced"' },
      { name: "skillCategoryId", type: "String?", description: "Skill category reference" },
      { name: "estimatedHours", type: "Int", description: "Estimated completion hours" },
      { name: "createdAt", type: "DateTime", description: "Creation date" },
    ],
  },
  {
    name: "Wallet",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "userId", type: "String (unique)", description: "Owner user ID" },
      { name: "balance", type: "Float", description: "Current balance (default: 0)" },
      { name: "createdAt", type: "DateTime", description: "Creation date" },
      { name: "updatedAt", type: "DateTime", description: "Last update date" },
    ],
  },
  {
    name: "InvestmentDeal",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "categoryId", type: "String?", description: "Investment category reference" },
      { name: "title", type: "String", description: "Deal title" },
      { name: "description", type: "String", description: "Deal description" },
      { name: "longDescription", type: "String?", description: "Detailed markdown description" },
      { name: "location", type: "String?", description: "Geographic location" },
      { name: "minContribution", type: "Float", description: "Min contribution per user" },
      { name: "maxContribution", type: "Float?", description: "Max contribution (null = unlimited)" },
      { name: "targetAmount", type: "Float", description: "Target pool amount" },
      { name: "currentPool", type: "Float", description: "Current collected amount" },
      { name: "roiPercent", type: "Float", description: "Expected ROI %" },
      { name: "duration", type: "String", description: 'Investment duration (e.g., "6 months")' },
      { name: "status", type: "String", description: '"proposed", "voting", "funding", "active", "matured", "completed", "cancelled"' },
      { name: "riskLevel", type: "String", description: '"low", "medium", "high"' },
      { name: "createdBy", type: "String", description: "Creator user ID" },
    ],
  },
  {
    name: "Commission",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "userId", type: "String", description: "User who earns this commission" },
      { name: "sourceUserId", type: "String", description: "User whose action generated it" },
      { name: "paymentId", type: "String?", description: "Related payment ID" },
      { name: "level", type: "Int", description: "MLM level (1, 2, or 3)" },
      { name: "amount", type: "Float", description: "Commission amount" },
      { name: "percentage", type: "Float", description: "Commission rate applied" },
      { name: "status", type: "String", description: '"paid", "pending", "reversed"' },
      { name: "description", type: "String?", description: "Description" },
      { name: "createdAt", type: "DateTime", description: "Creation date" },
    ],
  },
  {
    name: "EscrowTransaction",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "title", type: "String", description: "Escrow title" },
      { name: "type", type: "String", description: '"deal_funding", "investment_deal", "service_payment", "milestone"' },
      { name: "status", type: "String", description: '"collecting", "funded", "active", "disputed", "partially_released", "released", "refunded", "cancelled", "expired"' },
      { name: "targetAmount", type: "Float", description: "Funding target" },
      { name: "collectedAmount", type: "Float", description: "Current collected amount" },
      { name: "feePercent", type: "Float", description: "Platform fee %" },
      { name: "minContribution", type: "Float", description: "Min contribution per user" },
      { name: "maxContribution", type: "Float", description: "Max contribution (0 = no max)" },
      { name: "fundingDeadline", type: "DateTime?", description: "Funding deadline" },
      { name: "releaseDate", type: "DateTime?", description: "Scheduled release date" },
      { name: "terms", type: "String?", description: "Terms (JSON string)" },
      { name: "createdBy", type: "String", description: "Admin creator user ID" },
    ],
  },
  {
    name: "ForumTopic",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "categoryId", type: "String?", description: "Forum category reference" },
      { name: "userId", type: "String", description: "Author user ID" },
      { name: "title", type: "String", description: "Topic title" },
      { name: "content", type: "String", description: "Topic content" },
      { name: "tags", type: "String?", description: "JSON array of tags" },
      { name: "isPinned", type: "Boolean", description: "Whether pinned" },
      { name: "isLocked", type: "Boolean", description: "Whether locked" },
      { name: "replyCount", type: "Int", description: "Number of replies" },
      { name: "lastReplyAt", type: "DateTime?", description: "Last reply timestamp" },
    ],
  },
  {
    name: "Conversation",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "name", type: "String?", description: "Group chat name" },
      { name: "isGroup", type: "Boolean", description: "Whether group chat" },
      { name: "lastMessageAt", type: "DateTime?", description: "Last message timestamp" },
    ],
  },
  {
    name: "QASession",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "title", type: "String", description: "Session title" },
      { name: "description", type: "String?", description: "Session description" },
      { name: "expertName", type: "String", description: "Expert's name" },
      { name: "expertBio", type: "String?", description: "Expert's bio" },
      { name: "expertTitle", type: "String?", description: "Expert's title" },
      { name: "scheduledAt", type: "DateTime", description: "Scheduled datetime" },
      { name: "duration", type: "Int", description: "Duration in minutes" },
      { name: "status", type: "String", description: '"upcoming", "live", "ended"' },
      { name: "hostId", type: "String", description: "Host user ID" },
    ],
  },
  {
    name: "Payment",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "userId", type: "String", description: "Payer user ID" },
      { name: "amount", type: "Float", description: "Payment amount" },
      { name: "currency", type: "String", description: 'Currency (default: "USD")' },
      { name: "status", type: "String", description: '"pending", "completed", "failed"' },
      { name: "paymentMethod", type: "String", description: '"mock", "flutterwave", "crypto"' },
      { name: "paymentType", type: "String?", description: '"subscription" or "wallet_funding"' },
      { name: "txRef", type: "String? (unique)", description: "Transaction reference" },
      { name: "flutterwaveTransactionId", type: "String?", description: "Flutterwave transaction ID" },
      { name: "metadata", type: "String?", description: "Additional data (JSON)" },
      { name: "paidAt", type: "DateTime?", description: "Payment confirmation date" },
    ],
  },
  {
    name: "Notification",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "userId", type: "String", description: "Target user ID" },
      { name: "title", type: "String", description: "Notification title" },
      { name: "message", type: "String", description: "Notification message" },
      { name: "type", type: "String", description: '"info", "success", "warning", "error"' },
      { name: "read", type: "Boolean", description: "Whether read" },
      { name: "createdAt", type: "DateTime", description: "Creation date" },
    ],
  },
  {
    name: "Subscription",
    fields: [
      { name: "id", type: "String", description: "Unique identifier" },
      { name: "userId", type: "String (unique)", description: "Subscriber user ID" },
      { name: "plan", type: "String", description: '"basic", "pro", "premium"' },
      { name: "status", type: "String", description: '"active", "inactive", "expired"' },
      { name: "startDate", type: "DateTime?", description: "Subscription start" },
      { name: "endDate", type: "DateTime?", description: "Subscription end" },
    ],
  },
];

for (const model of dataModels) {
  mainContent.push(heading3(`14.${dataModels.indexOf(model) + 1} ${model.name}`));
  const modelRows = [
    new TableRow({
      children: [
        headerCell("Field", 2500),
        headerCell("Type", 3000),
        headerCell("Description", 4500),
      ],
    }),
  ];
  for (const field of model.fields) {
    modelRows.push(
      new TableRow({
        children: [
          codeCell(field.name, 2500),
          bodyCell(field.type, false, COLORS.secondary, 3000),
          bodyCell(field.description, false, COLORS.body, 4500),
        ],
      })
    );
  }
  mainContent.push(new Table({ width: { size: 100, type: "pct" }, rows: modelRows }));
  mainContent.push(emptyLine());
}

mainContent.push(pageBreak());

// ======================================================
// SECTION 15: RECOMMENDED NEW FEATURES
// ======================================================
mainContent.push(heading2("15. Recommended New Features"));
mainContent.push(bodyPara(
  "The following features are recommended for future development to enhance the platform's capabilities and provide a better mobile app experience."
));

const recommendedFeatures: { title: string; description: string }[] = [
  { title: "Push Notifications (Firebase/OneSignal)", description: "Implement real-time push notifications via Firebase Cloud Messaging or OneSignal to alert users about payments, investments, messages, and important platform events." },
  { title: "OAuth Social Login (Google, Apple)", description: "Add OAuth 2.0 social login support for Google and Apple to streamline the registration process and reduce friction for new users." },
  { title: "Two-Factor Authentication (TOTP)", description: "Implement TOTP-based 2FA using apps like Google Authenticator for enhanced account security on sensitive operations." },
  { title: "File/Image Upload for Profiles and Chat", description: "Add file and image upload capabilities using cloud storage (AWS S3/Cloudinary) for user avatars, chat attachments, and course content." },
  { title: "WebSocket Real-Time Chat (Socket.io)", description: "Replace HTTP polling with WebSocket connections via Socket.io for real-time messaging in private chats and community features." },
  { title: "Video Streaming for Courses", description: "Integrate video hosting (AWS CloudFront, Mux) for course video content with adaptive bitrate streaming and offline download support." },
  { title: "Advanced Search & Filtering (Algolia/Meilisearch)", description: "Implement full-text search across courses, forum topics, and community content with faceted filtering, autocomplete, and typo tolerance." },
  { title: "Email Notification Service (SendGrid/Resend)", description: "Set up transactional email service for account verification, payment receipts, course updates, and marketing communications." },
  { title: "Rate Limiting & API Throttling", description: "Implement configurable rate limiting per endpoint and user tier using Redis or in-memory throttling to protect against abuse." },
  { title: "API Versioning (v1, v2)", description: "Add URL-based or header-based API versioning to support backward compatibility during platform evolution." },
  { title: "Mobile-Optimized API (Pagination, Field Selection)", description: "Implement cursor-based pagination, sparse fieldsets (?fields=name,email), and response compression for mobile network efficiency." },
  { title: "Analytics & Event Tracking", description: "Integrate analytics (Mixpanel, Amplitude, or PostHog) to track user behavior, feature adoption, funnel analysis, and conversion rates." },
  { title: "Referral Link Tracking & Attribution", description: "Build a referral link system with deep linking support, UTM parameters, and multi-touch attribution for marketing campaigns." },
  { title: "Scheduled Tasks (Cron Jobs for Expirations, Distributions)", description: "Implement scheduled tasks using node-cron or Bull queue for processing expired escrows, investment maturations, and subscription renewals." },
  { title: "Multi-Language Support (i18n)", description: "Add internationalization using next-intl or i18next for the mobile app with support for English, French, Spanish, and other languages." },
  { title: "Offline Mode & Data Sync", description: "Implement offline-first architecture with local storage caching, conflict resolution, and background sync for course content and messages." },
  { title: "Biometric Authentication", description: "Support Face ID, Touch ID, and fingerprint authentication for secure and convenient app access on supported devices." },
  { title: "In-App Purchase Integration", description: "Integrate Apple App Store and Google Play in-app purchase APIs for subscription plans alongside existing payment gateways." },
  { title: "Advanced Reporting & Export (CSV/PDF)", description: "Build reporting endpoints for transaction history, investment performance, referral earnings, and course progress with CSV/PDF export." },
  { title: "Gamification Enhancements (Streaks, Badges, XP)", description: "Expand the achievement system with daily streaks, XP points, level progression, and unlockable badges to increase engagement." },
  { title: "Community Moderation Tools", description: "Implement content moderation features including flag/report system, admin review queue, automated content filtering, and user warnings." },
  { title: "Dark/Light Theme API Endpoint", description: "Add API endpoints for persisting user theme preferences with automatic system theme detection on the mobile app." },
  { title: "API Key Management for Third-Party Integrations", description: "Build an API key management system allowing third-party developers to integrate with the platform under configurable scopes and rate limits." },
  { title: "Webhook System for External Integrations", description: "Create a webhook system that pushes event notifications to registered URLs for payment confirmations, user events, and investment updates." },
  { title: "Health Check / Status Endpoint", description: "Implement a /api/health endpoint returning service status, database connectivity, payment gateway status, and system uptime metrics." },
];

const featureRows = [
  new TableRow({
    children: [
      headerCell("#", 600),
      headerCell("Feature", 3600),
      headerCell("Description", 6800),
    ],
  }),
];

for (let i = 0; i < recommendedFeatures.length; i++) {
  const f = recommendedFeatures[i];
  featureRows.push(
    new TableRow({
      children: [
        bodyCell(`${i + 1}`, false, COLORS.secondary, 600),
        bodyCell(f.title, true, COLORS.primary, 3600),
        bodyCell(f.description, false, COLORS.body, 6800),
      ],
    })
  );
}

mainContent.push(new Table({ width: { size: 100, type: "pct" }, rows: featureRows }));

mainContent.push(pageBreak());

// ======================================================
// BACK COVER SECTION
// ======================================================
const backCoverSection = {
  properties: {
    page: {
      margin: {
        top: convertInchesToTwip(1),
        bottom: convertInchesToTwip(1),
        left: convertInchesToTwip(1),
        right: convertInchesToTwip(1),
      },
    },
    sectionType: SectionType.NEXT_PAGE,
  },
  children: [
    ...Array(10).fill(null).map(() => new Paragraph({ spacing: { after: 200 }, children: [] })),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: "━".repeat(40), font: FONT_BODY, size: 22, color: COLORS.accent }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "HUSTLE UNIVERSITY", font: FONT_HEADING, size: 48, bold: true, color: COLORS.primary }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "REST API Documentation", font: FONT_HEADING, size: 28, color: COLORS.secondary }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: "━".repeat(40), font: FONT_BODY, size: 22, color: COLORS.accent }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Version 1.0  •  June 2025", font: FONT_BODY, size: 22, color: COLORS.accent }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "For Mobile App Integration", font: FONT_BODY, size: 20, color: COLORS.accent, italics: true }),
      ],
    }),
    ...Array(4).fill(null).map(() => new Paragraph({ spacing: { after: 200 }, children: [] })),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "This document is confidential and intended solely for", font: FONT_BODY, size: 18, color: COLORS.accent }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "authorized mobile app developers and partners.", font: FONT_BODY, size: 18, color: COLORS.accent }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "© 2025 Hustle University. All rights reserved.", font: FONT_BODY, size: 18, color: COLORS.accent }),
      ],
    }),
  ],
};

// ===========================
// BUILD DOCUMENT
// ===========================
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: FONT_BODY,
          size: 22,
          color: COLORS.body,
        },
        paragraph: {
          spacing: { line: LINE_SPACING },
        },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          font: FONT_HEADING,
          size: 36,
          bold: true,
          color: COLORS.primary,
        },
        paragraph: {
          spacing: { before: 360, after: 200, line: LINE_SPACING },
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          font: FONT_HEADING,
          size: 28,
          bold: true,
          color: COLORS.primary,
        },
        paragraph: {
          spacing: { before: 360, after: 200, line: LINE_SPACING },
        },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          font: FONT_HEADING,
          size: 24,
          bold: true,
          color: COLORS.primary,
        },
        paragraph: {
          spacing: { before: 280, after: 160, line: LINE_SPACING },
        },
      },
    ],
  },
  features: {
    updateFields: true,
  },
  sections: [
    coverSection,
    tocSection,
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Hustle University API Documentation", font: FONT_BODY, size: 18, color: COLORS.accent, italics: true }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", font: FONT_BODY, size: 18, color: COLORS.accent }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: COLORS.accent }),
                new TextRun({ text: " of ", font: FONT_BODY, size: 18, color: COLORS.accent }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_BODY, size: 18, color: COLORS.accent }),
              ],
            }),
          ],
        }),
      },
      children: mainContent,
    },
    backCoverSection,
  ],
});

// ===========================
// SAVE DOCUMENT
// ===========================
async function main() {
  const buffer = await Packer.toBuffer(doc);
  const outputPath = "/home/z/my-project/Hustle_University_API_Documentation.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Document generated successfully: ${outputPath}`);
  console.log(`📄 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
}

main().catch(console.error);
