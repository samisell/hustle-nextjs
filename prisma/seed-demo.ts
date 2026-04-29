import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'info.venihost@gmail.com';
const OWNER_EMAIL = 'badrusuydu@necub.com';
const PWD = 'password123';

// ─── helpers ────────────────────────────────────────────────────────────────
const days = (n: number) => new Date(Date.now() - n * 86400000);
const hours = (n: number) => new Date(Date.now() - n * 3600000);

const uid = (i: number) => `demo_user_${String(i).padStart(2, '0')}`;
const referralCode = (name: string) => name.toUpperCase().slice(0, 8).padEnd(8, '0').slice(0, 8);

async function main() {
  console.log('🗑️  Clearing all tables…');
  const tables = [
    'ChatMessage','ConversationMember','Conversation',
    'DealVote','DealContribution','DealPayout',
    'QAQuestion','QASession',
    'ForumReply','ForumTopic','ForumCategory',
    'EscrowDispute','EscrowMilestone','EscrowContribution','EscrowTransaction',
    'Commission','Payout',
    'UserAchievement','Achievement',
    'CourseCertification',
    'LessonProgress','Enrollment','Lesson','Course',
    'UserInvestment','InvestmentOpportunity',
    'Earning','Transaction','Wallet',
    'Withdrawal','Payment',
    'Referral','Subscription',
    'InvestmentDeal','InvestmentCategory',
    'SkillCategory',
    'User',
  ];
  for (const t of tables) {
    try { await db.$executeRawUnsafe(`DELETE FROM "${t}"`); } catch { /* noop */ }
  }
  console.log('✅ Tables cleared');

  const hash = await bcrypt.hash(PWD, 10);

  // ═══════════════════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════════════════
  const demoUsers = [
    { id: uid(1), name: 'Chinedu Okafor',   email: 'chinedu@demo.com',  bio: 'Full-time crypto trader and investment enthusiast',         phone: '+2348012345001' },
    { id: uid(2), name: 'Amina Bello',      email: 'amina@demo.com',     bio: 'Real estate investor and financial literacy advocate',       phone: '+2348023455002' },
    { id: uid(3), name: 'Tunde Adeyemi',    email: 'tunde@demo.com',     bio: 'E-commerce entrepreneur scaling my business',                phone: '+2348034565003' },
    { id: uid(4), name: 'Funke Williams',   email: 'funke@demo.com',     bio: 'Digital marketing expert and brand strategist',              phone: '+2348045675004' },
    { id: uid(5), name: 'Emeka Nwachukwu',  email: 'emeka@demo.com',     bio: 'Software developer transitioning into fintech',              phone: '+2348056785005' },
    { id: uid(6), name: 'Zainab Ibrahim',   email: 'zainab@demo.com',    bio: 'Agriculture investment specialist',                          phone: '+2348067895006' },
    { id: uid(7), name: 'Olumide Adekunle', email: 'olumide@demo.com',   bio: 'Stock market analyst and portfolio manager',                 phone: '+2348078905007' },
    { id: uid(8), name: 'Bisola Fashola',   email: 'bisola@demo.com',    bio: 'Healthcare professional investing in healthtech',            phone: '+2348089015008' },
    { id: uid(9), name: 'Yusuf Garuba',     email: 'yusuf@demo.com',     bio: 'Supply chain expert and logistics entrepreneur',              phone: '+2348090125009' },
    { id: uid(10),name: 'Ngozi Eze',        email: 'ngozi@demo.com',     bio: 'Education consultant building an EdTech startup',             phone: '+2348012345010' },
    { id: uid(11),name: 'Segun Alabi',      email: 'segun@demo.com',     bio: 'Renewable energy advocate and green investor',               phone: '+2348023455011' },
  ];

  // referral codes
  const codes: Record<string,string> = {};
  demoUsers.forEach(u => { codes[u.id] = referralCode(u.name); });
  codes['admin'] = 'SAMUEL01';
  codes['owner'] = 'BADRUSSS';

  // referredBy map
  const referredBy: Record<string,string> = {
    [uid(1)]: codes['admin'],
    [uid(2)]: codes['admin'],
    [uid(3)]: codes['admin'],
    [uid(4)]: codes['admin'],
    [uid(5)]: codes[uid(2)],
    [uid(6)]: codes[uid(3)],
    [uid(7)]: codes[uid(1)],
    [uid(8)]: codes[uid(4)],
    [uid(9)]: codes[uid(5)],
    [uid(10)]: codes[uid(2)],
    [uid(11)]: codes[uid(7)],
  };

  // Create admin
  const admin = await db.user.create({
    data: { id: 'admin_001', name: 'Samuel Ajayi', email: ADMIN_EMAIL, password: hash, role: 'admin', referralCode: codes['admin'], emailVerified: days(90), bio: 'Platform administrator', phone: '+2348000000001' },
  });

  // Create owner
  const owner = await db.user.create({
    data: { id: 'owner_001', name: 'Steve Collins', email: OWNER_EMAIL, password: hash, role: 'admin', referralCode: codes['owner'], emailVerified: days(60), bio: 'Platform owner & CEO', phone: '+2348000000000' },
  });

  // Create demo users
  for (const u of demoUsers) {
    await db.user.create({
      data: { id: u.id, name: u.name, email: u.email, password: hash, role: 'user', referralCode: codes[u.id], referredBy: referredBy[u.id], emailVerified: days(90), bio: u.bio, phone: u.phone },
    });
  }
  console.log('✅ Users created:', 13);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. WALLETS
  // ═══════════════════════════════════════════════════════════════════════
  const balances: Record<string,number> = {
    'admin_001': 5000, 'owner_001': 25000,
    [uid(1)]: 12450, [uid(2)]: 8320, [uid(3)]: 3750, [uid(4)]: 15200,
    [uid(5)]: 2100, [uid(6)]: 6800, [uid(7)]: 22000, [uid(8)]: 4500,
    [uid(9)]: 1850, [uid(10)]: 9600, [uid(11)]: 7300,
  };
  const wallets: Record<string,string> = {};
  for (const [uid_, bal] of Object.entries(balances)) {
    const w = await db.wallet.create({ data: { userId: uid_, balance: bal } });
    wallets[uid_] = w.id;
  }
  console.log('✅ Wallets created:', Object.keys(wallets).length);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════
  const subs: [string, string, string, number][] = [
    ['admin_001','premium','active', 60], ['owner_001','premium','active', 45],
    [uid(1),'premium','active', 55], [uid(2),'pro','active', 40],
    [uid(3),'basic','active', 30], [uid(4),'premium','active', 50],
    [uid(5),'pro','expired', 90], [uid(6),'basic','active', 20],
    [uid(7),'premium','active', 35],
  ];
  for (const [userId, plan, status, startDaysAgo] of subs) {
    const start = days(startDaysAgo);
    const endDays = plan === 'premium' ? 365 : plan === 'pro' ? 180 : 30;
    await db.subscription.create({
      data: { userId: userId as string, plan, status, startDate: start, endDate: status === 'expired' ? days(startDaysAgo - endDays) : new Date(start.getTime() + endDays * 86400000) },
    });
  }
  console.log('✅ Subscriptions created:', subs.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. SKILL CATEGORIES
  // ═══════════════════════════════════════════════════════════════════════
  const skillCats = await Promise.all([
    db.skillCategory.create({ data: { name: 'Financial Literacy', slug: 'financial-literacy', icon: 'DollarSign', color: '#D4AF37', order: 1, description: 'Master personal finance, budgeting, and investment fundamentals' } }),
    db.skillCategory.create({ data: { name: 'Crypto Trading', slug: 'crypto-trading', icon: 'Bitcoin', color: '#F7931A', order: 2, description: 'Learn cryptocurrency trading strategies and blockchain technology' } }),
    db.skillCategory.create({ data: { name: 'Real Estate', slug: 'real-estate', icon: 'Building2', color: '#2E8B57', order: 3, description: 'Real estate investment strategies and property management' } }),
    db.skillCategory.create({ data: { name: 'Business Strategy', slug: 'business-strategy', icon: 'Briefcase', color: '#FF8C00', order: 4, description: 'Build and scale your business with proven strategies' } }),
    db.skillCategory.create({ data: { name: 'Digital Skills', slug: 'digital-skills', icon: 'Monitor', color: '#9333EA', order: 5, description: 'Digital marketing, SEO, and online business skills' } }),
    db.skillCategory.create({ data: { name: 'Agriculture', slug: 'agriculture', icon: 'Leaf', color: '#16A34A', order: 6, description: 'Agricultural investment and sustainable farming practices' } }),
  ]);
  console.log('✅ Skill categories created:', skillCats.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 5. COURSES & LESSONS
  // ═══════════════════════════════════════════════════════════════════════
  const courseData: { title: string; catIdx: number; difficulty: string; hours: number; lessons: { t: string; c: string; mins: number }[] }[] = [
    { title: 'Financial Literacy 101', catIdx: 0, difficulty: 'beginner', hours: 12, lessons: [
      { t: 'Understanding Money & Budgeting', c: 'Learn the fundamentals of personal finance. Understand income streams, expense tracking, and how to create a budget that works for your lifestyle. We cover the 50/30/20 rule and envelope budgeting method.', mins: 30 },
      { t: 'Building an Emergency Fund', c: 'Why you need 3-6 months of expenses saved. Learn strategies to build your emergency fund quickly even on a tight budget. Automated savings and high-yield accounts explained.', mins: 25 },
      { t: 'Credit Scores & Debt Management', c: 'Understand how credit scores work, how to improve yours, and strategies for paying off debt efficiently. Learn about the snowball vs avalanche methods.', mins: 35 },
      { t: 'Investment Basics for Beginners', c: 'Introduction to stocks, bonds, mutual funds, and ETFs. Learn how to start investing with as little as $100 and build long-term wealth through compound interest.', mins: 30 },
    ]},
    { title: 'Crypto Trading Masterclass', catIdx: 1, difficulty: 'advanced', hours: 20, lessons: [
      { t: 'Introduction to Blockchain & Cryptocurrency', c: 'Understand blockchain technology from scratch. Learn about Bitcoin, Ethereum, and altcoins. Explore how decentralized finance (DeFi) is changing the financial landscape.', mins: 45 },
      { t: 'Technical Analysis Fundamentals', c: 'Master chart patterns, support and resistance levels, trend lines, and key technical indicators like RSI, MACD, and Bollinger Bands for crypto trading.', mins: 40 },
      { t: 'Reading Candlestick Charts', c: 'Deep dive into candlestick patterns - doji, hammer, engulfing, morning star, and more. Learn to read market sentiment from price action and volume.', mins: 45 },
      { t: 'Risk Management Strategies', c: 'Position sizing, stop-loss placement, take-profit targets, and portfolio risk management. Learn to protect your capital while maximizing returns in volatile markets.', mins: 35 },
      { t: 'Building a Crypto Portfolio', c: 'Diversification strategies, asset allocation models, rebalancing techniques, and how to evaluate fundamental value of cryptocurrency projects.', mins: 40 },
    ]},
    { title: 'Real Estate Investment Fundamentals', catIdx: 2, difficulty: 'intermediate', hours: 15, lessons: [
      { t: 'Types of Real Estate Investments', c: 'Residential, commercial, industrial, and REITs. Understand the pros and cons of each type and how to choose based on your investment goals and risk tolerance.', mins: 35 },
      { t: 'Property Valuation Methods', c: 'Learn comparable sales approach, income capitalization method, and cost approach. Understand how to evaluate properties and identify undervalued opportunities in the market.', mins: 40 },
      { t: 'Financing Your First Investment', c: 'Mortgage options, hard money loans, private lending, and creative financing strategies. Learn how to leverage OPM (Other People\'s Money) to build your portfolio.', mins: 35 },
      { t: 'Managing Rental Properties', c: 'Tenant screening, lease agreements, property maintenance, and property management. Learn the tools and systems to manage properties efficiently.', mins: 30 },
    ]},
    { title: 'Business Strategy & Growth', catIdx: 3, difficulty: 'intermediate', hours: 18, lessons: [
      { t: 'Developing a Business Plan', c: 'Create a comprehensive business plan including executive summary, market analysis, competitive landscape, financial projections, and growth strategy for investors.', mins: 40 },
      { t: 'Market Research & Analysis', c: 'Conduct effective market research using primary and secondary methods. Learn to identify market gaps, validate your business idea, and understand your target audience deeply.', mins: 35 },
      { t: 'Scaling Your Business', c: 'Strategies for scaling from startup to growth stage. Hiring, systems, automation, delegation, and building a team that can execute your vision efficiently.', mins: 40 },
      { t: 'Financial Projections & Budgeting', c: 'Build financial models, create cash flow projections, and understand unit economics. Learn to make data-driven decisions for sustainable business growth.', mins: 35 },
    ]},
    { title: 'Digital Marketing Mastery', catIdx: 4, difficulty: 'beginner', hours: 10, lessons: [
      { t: 'Social Media Marketing', c: 'Master Facebook, Instagram, Twitter, LinkedIn, and TikTok marketing. Learn content creation, community building, paid advertising, and analytics for each platform.', mins: 35 },
      { t: 'Content Strategy & SEO', c: 'Build a content strategy that drives organic traffic. Keyword research, on-page SEO, link building, and creating content that ranks and converts visitors to customers.', mins: 40 },
      { t: 'Paid Advertising & Analytics', c: 'Google Ads, Facebook Ads, and retargeting campaigns. Learn A/B testing, conversion optimization, and using analytics to maximize your advertising ROI.', mins: 35 },
    ]},
    { title: 'Agricultural Investment Guide', catIdx: 5, difficulty: 'beginner', hours: 8, lessons: [
      { t: 'Agri-Business Opportunities in Africa', c: 'Explore the massive potential in African agriculture. From crop farming to livestock, poultry, and aquaculture. Understand government policies and incentives available.', mins: 30 },
      { t: 'Understanding AgriTech', c: 'Precision farming, IoT sensors, drone technology, and farm management software. Learn how technology is revolutionizing agriculture and creating investment opportunities.', mins: 25 },
      { t: 'Sustainable Farming Investments', c: 'Organic farming, vertical farming, hydroponics, and renewable energy in agriculture. Understand ESG investing and sustainable agriculture fund opportunities.', mins: 30 },
    ]},
    { title: 'Advanced Stock Trading', catIdx: 0, difficulty: 'advanced', hours: 16, lessons: [
      { t: 'Fundamental Analysis', c: 'Analyze financial statements, P/E ratios, earnings reports, and macroeconomic indicators. Learn Warren Buffett\'s value investing principles applied to modern markets.', mins: 40 },
      { t: 'Options & Derivatives', c: 'Call options, put options, spreads, straddles, and covered calls. Understand the Greeks (Delta, Gamma, Theta, Vega) and how to use leverage responsibly.', mins: 45 },
      { t: 'Portfolio Diversification', c: 'Modern Portfolio Theory, efficient frontier, correlation analysis, and asset allocation strategies. Build a portfolio that maximizes returns for your risk level.', mins: 35 },
      { t: 'Market Psychology', c: 'Behavioral finance, herd mentality, FOMO, and fear/greed cycles. Learn to manage emotions and make rational decisions in volatile market conditions.', mins: 30 },
    ]},
    { title: 'E-Commerce Empire Building', catIdx: 3, difficulty: 'intermediate', hours: 14, lessons: [
      { t: 'Setting Up Your Online Store', c: 'Platform selection (Shopify, WooCommerce), domain setup, payment gateways, and store design principles that convert visitors into paying customers.', mins: 35 },
      { t: 'Product Sourcing & Pricing', c: 'AliExpress, local suppliers, dropshipping vs holding inventory. Cost analysis, pricing psychology, and building a sustainable supply chain.', mins: 35 },
      { t: 'Customer Acquisition Strategies', c: 'Facebook and Google ads, influencer marketing, email marketing funnels, and retention strategies. Learn CAC optimization and LTV maximization.', mins: 40 },
      { t: 'Scaling to 6 Figures', c: 'Automation, hiring virtual assistants, expanding product lines, and multi-channel selling. Build systems that let your business grow without you.', mins: 35 },
    ]},
  ];

  const courseIds: string[] = [];
  for (let ci = 0; ci < courseData.length; ci++) {
    const cd = courseData[ci];
    const course = await db.course.create({
      data: {
        title: cd.title,
        category: skillCats[cd.catIdx].name,
        skillCategoryId: skillCats[cd.catIdx].id,
        difficulty: cd.difficulty,
        estimatedHours: cd.hours,
        description: `Comprehensive ${cd.difficulty} level course on ${cd.title.toLowerCase()}. Learn from industry experts and practical case studies.`,
      },
    });
    courseIds.push(course.id);

    for (let li = 0; li < cd.lessons.length; li++) {
      await db.lesson.create({
        data: { courseId: course.id, title: cd.lessons[li].t, content: cd.lessons[li].c, order: li + 1, estimatedMinutes: cd.lessons[li].mins },
      });
    }
  }
  console.log('✅ Courses created:', courseIds.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 6. ENROLLMENTS
  // ═══════════════════════════════════════════════════════════════════════
  const enrollData: [string, number[], number[]][] = [
    [uid(1), [0,1,6], [85,60,30]],
    [uid(2), [0,2], [100,75]],
    [uid(3), [3,7], [45,20]],
    [uid(4), [1,4], [90,100]],
    [uid(5), [0,4,6], [100,50,10]],
    [uid(6), [2,5], [40,65]],
    [uid(7), [0,1,2,6], [100,85,90,70]],
    [uid(8), [4,5], [55,30]],
    [uid(9), [3], [15]],
    [uid(10),[0,4,7], [70,40,50]],
    [uid(11),[5], [80]],
    ['owner_001', [0,1,2], [100,65,50]],
  ];

  for (const [userId, courseIdxs, progresses] of enrollData) {
    for (let i = 0; i < courseIdxs.length; i++) {
      const courseId = courseIds[courseIdxs[i]];
      const progress = progresses[i];
      await db.enrollment.create({
        data: {
          userId: userId as string,
          courseId,
          progress,
          completedAt: progress === 100 ? days(5) : null,
          createdAt: days(60),
        },
      });
    }
  }
  console.log('✅ Enrollments created');

  // ═══════════════════════════════════════════════════════════════════════
  // 7. LESSON PROGRESS
  // ═══════════════════════════════════════════════════════════════════════
  for (const [userId, courseIdxs, progresses] of enrollData) {
    for (let i = 0; i < courseIdxs.length; i++) {
      const courseId = courseIds[courseIdxs[i]];
      const progress = progresses[i];
      const course = courseData[courseIdxs[i]];
      const lessonsToComplete = Math.floor((progress / 100) * course.lessons.length);
      const allLessons = await db.lesson.findMany({ where: { courseId }, orderBy: { order: 'asc' } });
      for (let li = 0; li < lessonsToComplete && li < allLessons.length; li++) {
        await db.lessonProgress.create({ data: { userId: userId as string, lessonId: allLessons[li].id, completed: true } }).catch(() => {});
      }
    }
  }
  console.log('✅ Lesson progress created');

  // ═══════════════════════════════════════════════════════════════════════
  // 8. CERTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════
  const certs: [string, number, string][] = [
    [uid(2), 0, 'Financial Literacy Graduate'],
    [uid(5), 0, 'Financial Literacy Graduate'],
    [uid(4), 4, 'Digital Marketing Expert'],
    [uid(7), 0, 'Financial Literacy Graduate'],
    ['owner_001', 0, 'Financial Literacy Graduate'],
  ];
  for (const [userId, courseIdx, badge] of certs) {
    await db.courseCertification.create({
      data: { userId: userId as string, courseId: courseIds[courseIdx], badgeName: badge, badgeIcon: 'Award', earnedAt: days(5) },
    });
  }
  console.log('✅ Certifications created:', certs.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 9. PAYMENTS
  // ═══════════════════════════════════════════════════════════════════════
  const payments: [string, number, string, string, string, number][] = [
    [uid(1), 49.99, 'completed', 'flutterwave', 'subscription', 50],
    [uid(2), 24.99, 'completed', 'flutterwave', 'subscription', 45],
    [uid(3), 9.99, 'completed', 'crypto', 'subscription', 35],
    [uid(4), 49.99, 'completed', 'flutterwave', 'subscription', 48],
    [uid(5), 24.99, 'completed', 'flutterwave', 'subscription', 85],
    [uid(6), 9.99, 'completed', 'flutterwave', 'subscription', 25],
    [uid(7), 49.99, 'completed', 'crypto', 'subscription', 38],
    ['owner_001', 49.99, 'completed', 'flutterwave', 'subscription', 44],
    [uid(1), 500, 'completed', 'flutterwave', 'wallet_funding', 40],
    [uid(1), 1000, 'completed', 'crypto', 'wallet_funding', 30],
    [uid(2), 750, 'completed', 'flutterwave', 'wallet_funding', 35],
    [uid(4), 2000, 'completed', 'flutterwave', 'wallet_funding', 25],
    [uid(7), 1500, 'completed', 'crypto', 'wallet_funding', 20],
    ['owner_001', 5000, 'completed', 'flutterwave', 'wallet_funding', 15],
    [uid(3), 200, 'pending', 'flutterwave', 'wallet_funding', 2],
    [uid(8), 150, 'failed', 'crypto', 'wallet_funding', 1],
    [uid(10), 300, 'completed', 'flutterwave', 'wallet_funding', 10],
  ];
  for (const [userId, amount, status, method, pType, daysAgo] of payments) {
    await db.payment.create({
      data: {
        userId: userId as string, amount, status, paymentMethod: method,
        paymentType: pType, currency: 'USD',
        description: `${pType === 'subscription' ? 'Subscription' : 'Wallet funding'} - ${method}`,
        txRef: `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 20),
        paidAt: status === 'completed' ? days(daysAgo) : null,
        createdAt: days(daysAgo),
      },
    });
  }
  console.log('✅ Payments created:', payments.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 10. TRANSACTIONS (wallet history)
  // ═══════════════════════════════════════════════════════════════════════
  const txns: [string, string, number, string][] = [
    [uid(1), 'credit', 500, 'Wallet funding via Flutterwave'],
    [uid(1), 'credit', 1000, 'Wallet funding via Crypto'],
    [uid(1), 'credit', 10, 'Referral bonus - Amina Bello'],
    [uid(1), 'debit', 49.99, 'Premium subscription payment'],
    [uid(2), 'credit', 750, 'Wallet funding via Flutterwave'],
    [uid(2), 'credit', 10, 'Referral bonus - Emeka Nwachukwu'],
    [uid(2), 'credit', 10, 'Referral bonus - Ngozi Eze'],
    [uid(2), 'debit', 24.99, 'Pro subscription payment'],
    [uid(4), 'credit', 2000, 'Wallet funding via Flutterwave'],
    [uid(4), 'credit', 10, 'Referral bonus - Bisola Fashola'],
    [uid(4), 'debit', 49.99, 'Premium subscription payment'],
    [uid(7), 'credit', 1500, 'Wallet funding via Crypto'],
    [uid(7), 'credit', 10, 'Referral bonus - Segun Alabi'],
    [uid(7), 'debit', 49.99, 'Premium subscription payment'],
    [uid(7), 'credit', 500, 'Investment return - Crypto Staking Pool'],
    [uid(7), 'credit', 200, 'Investment return - Green Energy Bonds'],
    [uid(3), 'credit', 200, 'Wallet funding via Flutterwave'],
    [uid(3), 'debit', 9.99, 'Basic subscription payment'],
    [uid(5), 'credit', 300, 'Wallet funding via Flutterwave'],
    [uid(5), 'debit', 24.99, 'Pro subscription payment'],
    ['owner_001', 'credit', 5000, 'Wallet funding via Flutterwave'],
    ['owner_001', 'credit', 500, 'Investment return - E-Commerce Revenue Share'],
    ['owner_001', 'debit', 49.99, 'Premium subscription payment'],
    [uid(10), 'credit', 300, 'Wallet funding via Flutterwave'],
    [uid(10), 'debit', 9.99, 'Basic subscription payment'],
  ];
  for (const [userId, type, amount, desc] of txns) {
    await db.transaction.create({
      data: { walletId: wallets[userId as string], type, amount, description: desc, createdAt: days(Math.floor(Math.random() * 50) + 5) },
    });
  }
  console.log('✅ Transactions created:', txns.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 11. WITHDRAWALS
  // ═══════════════════════════════════════════════════════════════════════
  const withdrawals: [string, number, string][] = [
    [uid(1), 150, 'completed'], [uid(2), 300, 'processing'],
    [uid(7), 500, 'completed'], [uid(4), 200, 'pending'],
    [uid(10), 100, 'rejected'], ['owner_001', 1000, 'completed'],
  ];
  for (const [userId, amount, status] of withdrawals) {
    await db.withdrawal.create({
      data: { userId: userId as string, amount, status, walletAddress: `0x${Math.random().toString(16).slice(2)}`, createdAt: days(15) },
    });
  }
  console.log('✅ Withdrawals created:', withdrawals.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 12. INVESTMENT OPPORTUNITIES
  // ═══════════════════════════════════════════════════════════════════════
  const invOps = await Promise.all([
    db.investmentOpportunity.create({ data: { title: 'AgriTech Growth Fund', description: 'Invest in cutting-edge agricultural technology companies across Africa. This fund targets startups in precision farming, supply chain optimization, and farm management software.', minInvestment: 50, maxInvestment: 5000, roiPercent: 15, duration: '90 days', status: 'active', totalPool: 12500 } }),
    db.investmentOpportunity.create({ data: { title: 'Real Estate Tokenization', description: 'Fractional ownership in premium real estate properties across Lagos, Abuja, and Dubai. Tokens represent shares in high-value commercial and residential properties.', minInvestment: 100, maxInvestment: 10000, roiPercent: 20, duration: '180 days', status: 'active', totalPool: 28400 } }),
    db.investmentOpportunity.create({ data: { title: 'Crypto Staking Pool', description: 'Stake your crypto assets with our managed pool. We handle node operation, validator selection, and compound rewards for maximum returns on PoS blockchains.', minInvestment: 25, maxInvestment: 2500, roiPercent: 25, duration: '60 days', status: 'active', totalPool: 8250 } }),
    db.investmentOpportunity.create({ data: { title: 'Green Energy Bonds', description: 'Support renewable energy projects across Africa. Solar farms, wind energy, and hydroelectric projects with government backing and guaranteed returns.', minInvestment: 200, maxInvestment: 20000, roiPercent: 12, duration: '365 days', status: 'active', totalPool: 35000 } }),
    db.investmentOpportunity.create({ data: { title: 'E-Commerce Revenue Share', description: 'Share in the revenue of a growing portfolio of e-commerce businesses. Diversified across multiple product categories and markets across Africa.', minInvestment: 50, maxInvestment: 5000, roiPercent: 18, duration: '120 days', status: 'completed', totalPool: 50000 } }),
  ]);
  console.log('✅ Investment opportunities created:', invOps.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 13. USER INVESTMENTS
  // ═══════════════════════════════════════════════════════════════════════
  const userInv: [string, number, number, string][] = [
    [uid(1), 0, 500, 'active'], [uid(1), 2, 1000, 'active'],
    [uid(2), 1, 800, 'active'], [uid(2), 3, 300, 'active'],
    [uid(3), 0, 200, 'active'],
    [uid(4), 1, 1500, 'active'], [uid(4), 4, 500, 'completed'],
    [uid(7), 3, 2000, 'active'], [uid(7), 2, 750, 'active'],
    [uid(6), 0, 400, 'active'],
    [uid(10),1, 600, 'active'],
    [uid(11),3, 1000, 'active'],
    ['owner_001', 0, 2000, 'active'], ['owner_001', 4, 3000, 'completed'],
  ];
  for (const [userId, opIdx, amount, status] of userInv) {
    const op = invOps[opIdx];
    await db.userInvestment.create({
      data: {
        userId: userId as string, opportunityId: op.id, amount,
        roiPercent: op.roiPercent, expectedReturn: amount * (1 + op.roiPercent / 100),
        status, startDate: days(45),
        endDate: status === 'completed' ? days(5) : null,
      },
    });
  }
  console.log('✅ User investments created:', userInv.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 14. EARNINGS
  // ═══════════════════════════════════════════════════════════════════════
  const earnings: [string, number, string, string][] = [
    [uid(1), 10, 'referral', 'Referral bonus for inviting Amina Bello'],
    [uid(1), 10, 'referral', 'Referral bonus for inviting Olumide Adekunle'],
    [uid(2), 10, 'referral', 'Referral bonus for inviting Emeka Nwachukwu'],
    [uid(2), 10, 'referral', 'Referral bonus for inviting Ngozi Eze'],
    [uid(3), 10, 'referral', 'Referral bonus for inviting Zainab Ibrahim'],
    [uid(4), 10, 'referral', 'Referral bonus for inviting Bisola Fashola'],
    [uid(5), 10, 'referral', 'Referral bonus for inviting Yusuf Garuba'],
    [uid(7), 10, 'referral', 'Referral bonus for inviting Segun Alabi'],
    [uid(7), 500, 'investment', 'ROI from Crypto Staking Pool'],
    [uid(7), 200, 'investment', 'ROI from Green Energy Bonds'],
    ['owner_001', 500, 'investment', 'ROI from E-Commerce Revenue Share'],
    ['owner_001', 50, 'bonus', 'Platform activity bonus'],
    [uid(4), 450, 'investment', 'ROI from E-Commerce Revenue Share'],
  ];
  for (const [userId, amount, source, desc] of earnings) {
    await db.earning.create({ data: { walletId: wallets[userId as string], userId: userId as string, amount, source, description: desc } });
  }
  console.log('✅ Earnings created:', earnings.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 15. REFERRALS
  // ═══════════════════════════════════════════════════════════════════════
  const referralPairs: [string, string][] = [
    ['admin_001', uid(1)], ['admin_001', uid(2)], ['admin_001', uid(3)], ['admin_001', uid(4)],
    [uid(2), uid(5)], [uid(3), uid(6)], [uid(1), uid(7)], [uid(4), uid(8)],
    [uid(5), uid(9)], [uid(2), uid(10)], [uid(7), uid(11)],
  ];
  for (const [referrerId, referredId] of referralPairs) {
    await db.referral.create({ data: { referrerId, referredId, earnings: 10, status: 'active' } });
  }
  console.log('✅ Referrals created:', referralPairs.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 16. ESCROW TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════
  const escrows = await Promise.all([
    db.escrowTransaction.create({ data: { title: 'Dubai Real Estate Deal', description: 'Joint investment in luxury apartment complex in Dubai Marina. Target: 10-unit building with rental income.', type: 'deal_funding', status: 'funded', targetAmount: 50000, collectedAmount: 32500, currency: 'USD', feePercent: 2, minContribution: 100, fundingDeadline: days(-5), createdBy: 'admin_001' } }),
    db.escrowTransaction.create({ data: { title: 'Service Payment - Web Development', description: 'Escrow payment for full-stack web development project including frontend, backend, and deployment.', type: 'service_payment', status: 'active', targetAmount: 5000, collectedAmount: 5000, currency: 'USD', feePercent: 5, createdBy: 'admin_001' } }),
    db.escrowTransaction.create({ data: { title: 'Agricultural Equipment Pool', description: 'Community pool to purchase modern farming equipment for cooperative use. Includes tractors, irrigation systems, and processing tools.', type: 'deal_funding', status: 'collecting', targetAmount: 20000, collectedAmount: 8750, currency: 'USD', feePercent: 1.5, minContribution: 50, fundingDeadline: days(30), createdBy: 'admin_001' } }),
    db.escrowTransaction.create({ data: { title: 'Consulting Milestone Payment', description: 'Management consulting engagement with milestone-based release. Strategy development, implementation support, and review phases.', type: 'milestone', status: 'partially_released', targetAmount: 10000, collectedAmount: 10000, currency: 'USD', feePercent: 3, createdBy: 'owner_001' } }),
  ]);
  console.log('✅ Escrow transactions created:', escrows.length);

  // Escrow contributions
  const escContribs: [number, string, number, string][] = [
    [0, uid(1), 5000, 'confirmed'], [0, uid(2), 8000, 'confirmed'], [0, uid(4), 12000, 'confirmed'], [0, uid(7), 7500, 'confirmed'],
    [1, uid(5), 2500, 'confirmed'], [1, uid(7), 2500, 'confirmed'],
    [2, uid(3), 2000, 'confirmed'], [2, uid(6), 3250, 'confirmed'], [2, uid(11), 3500, 'confirmed'],
    [3, uid(1), 5000, 'confirmed'], [3, uid(2), 5000, 'confirmed'],
  ];
  for (const [eIdx, userId, amount, status] of escContribs) {
    await db.escrowContribution.create({
      data: { escrowId: escrows[eIdx].id, userId: userId as string, amount, paymentMethod: 'wallet', status, paidAt: days(20) },
    });
  }

  // Escrow milestones
  const milestones: [number, string, number, string][] = [
    [0, 'Property Acquisition', 30, 'released'], [0, 'Development Phase 1', 40, 'approved'], [0, 'Final Handover', 30, 'pending'],
    [1, 'Design & Planning', 30, 'released'], [1, 'Development', 40, 'released'], [1, 'Testing & Launch', 30, 'pending'],
    [2, 'Equipment Purchase', 50, 'pending'], [2, 'Distribution & Setup', 50, 'pending'],
    [3, 'Strategy Development', 33, 'released'], [3, 'Implementation Support', 34, 'released'], [3, 'Final Review', 33, 'pending'],
  ];
  for (const [eIdx, title, pct, status] of milestones) {
    await db.escrowMilestone.create({
      data: {
        escrowId: escrows[eIdx].id, title, description: `${title} milestone - ${pct}% of total funds`,
        order: milestones.filter(m => m[0] === eIdx).indexOf(milestones.find(m => m[1] === title)!) + 1,
        percentage: pct, status,
        approvedAt: status === 'released' ? days(10) : null,
        releasedAt: status === 'released' ? days(8) : null,
        approvedBy: 'admin_001',
      },
    });
  }

  // Escrow disputes
  await db.escrowDispute.create({
    data: { escrowId: escrows[0].id, raisedById: uid(3), reason: 'Concerns about project timeline and budget allocation. Requesting transparency on fund usage.', status: 'investigating', resolvedBy: 'admin_001' },
  });
  await db.escrowDispute.create({
    data: { escrowId: escrows[1].id, raisedById: uid(5), reason: 'Deliverables not matching the agreed scope. Need clarification on several features.', status: 'resolved', resolution: 'Scope clarified, additional features documented. Both parties agreed.', resolvedBy: 'admin_001', resolvedAt: days(2) },
  });
  console.log('✅ Escrow data created');

  // ═══════════════════════════════════════════════════════════════════════
  // 17. INVESTMENT CATEGORIES & DEALS (Group Investments)
  // ═══════════════════════════════════════════════════════════════════════
  const invCats = await Promise.all([
    db.investmentCategory.create({ data: { name: 'Real Estate', slug: 'real-estate', icon: 'Building2', color: '#2E8B57', description: 'Property investments and real estate opportunities' } }),
    db.investmentCategory.create({ data: { name: 'Agriculture', slug: 'agriculture', icon: 'Leaf', color: '#16A34A', description: 'Agricultural and farming investments' } }),
    db.investmentCategory.create({ data: { name: 'Technology', slug: 'technology', icon: 'Cpu', color: '#3B82F6', description: 'Tech startups and innovation investments' } }),
    db.investmentCategory.create({ data: { name: 'Energy', slug: 'energy', icon: 'Zap', color: '#F59E0B', description: 'Renewable energy and power investments' } }),
  ]);

  const deals = await Promise.all([
    db.investmentDeal.create({ data: { categoryId: invCats[0].id, title: 'Lagos Luxury Apartments Phase 2', description: 'Premium residential apartments in Victoria Island, Lagos. 24 units with world-class amenities including pool, gym, and 24/7 security.', longDescription: 'Phase 2 of our highly successful Lagos Luxury Apartments project. Located in the heart of Victoria Island, this development features 24 premium 2-3 bedroom apartments with modern finishes, smart home technology, and panoramic ocean views.\n\n**Key Features:**\n- Prime location on Victoria Island\n- 24/7 security and concierge\n- Swimming pool and fitness center\n- Smart home automation\n- Dedicated parking spaces\n- High rental yield potential (8-12% annually)', location: 'Lagos, Nigeria', minContribution: 100, targetAmount: 100000, currentPool: 67500, roiPercent: 18, duration: '12 months', status: 'active', startDate: days(30), maturityDate: days(-180), riskLevel: 'medium', minVotes: 10, approvalThreshold: 0.6, votesFor: 45, votesAgainst: 5, createdBy: 'admin_001' } }),
    db.investmentDeal.create({ data: { categoryId: invCats[1].id, title: 'Sustainable Farming Initiative', description: 'Mechanized farming project in Abuja focusing on rice, maize, and poultry production for local and export markets.', longDescription: 'A large-scale sustainable farming initiative located on 500 hectares in the Abuja hinterland. The project utilizes modern irrigation, precision agriculture techniques, and sustainable practices to maximize yield while minimizing environmental impact.', location: 'Abuja, Nigeria', minContribution: 50, targetAmount: 50000, currentPool: 23000, roiPercent: 15, duration: '6 months', status: 'funding', startDate: days(15), riskLevel: 'low', minVotes: 10, approvalThreshold: 0.6, votesFor: 38, votesAgainst: 3, createdBy: 'admin_001' } }),
    db.investmentDeal.create({ data: { categoryId: invCats[2].id, title: 'Tech Startup Portfolio', description: 'Diversified portfolio of 5 early-stage African tech startups across fintech, healthtech, edtech, and logistics.', longDescription: 'Invest in a curated portfolio of 5 high-potential African tech startups. Our investment team has vetted over 200 startups and selected the top 5 based on traction, team, market size, and scalability.', location: 'Pan-African', minContribution: 200, targetAmount: 200000, currentPool: 0, roiPercent: 30, duration: '2 years', status: 'voting', votingDeadline: days(7), riskLevel: 'high', minVotes: 20, approvalThreshold: 0.6, votesFor: 15, votesAgainst: 3, createdBy: 'admin_001' } }),
    db.investmentDeal.create({ data: { categoryId: invCats[3].id, title: 'Solar Farm Investment', description: '50MW solar farm project in Northern Nigeria providing clean energy to the national grid and local communities.', longDescription: 'A transformative solar energy project that will generate 50MW of clean electricity. The project has secured land rights and is in advanced discussions with the national grid operator for power purchase agreements.', location: 'Kano, Nigeria', minContribution: 100, targetAmount: 150000, currentPool: 0, roiPercent: 22, duration: '18 months', status: 'proposed', riskLevel: 'medium', minVotes: 15, approvalThreshold: 0.6, createdBy: 'owner_001' } }),
    db.investmentDeal.create({ data: { categoryId: invCats[0].id, title: 'Commercial Property Fund', description: 'Mixed-use commercial development in Lagos consisting of office spaces, retail units, and warehousing facilities.', longDescription: 'A completed commercial property investment in Lekki Free Trade Zone. The development includes office spaces, retail units, and warehousing facilities fully leased to established businesses.', location: 'Lagos, Nigeria', minContribution: 100, targetAmount: 80000, currentPool: 80000, roiPercent: 16, duration: '12 months', status: 'completed', startDate: days(365), maturityDate: days(5), riskLevel: 'low', minVotes: 10, approvalThreshold: 0.6, votesFor: 52, votesAgainst: 2, createdBy: 'admin_001' } }),
  ]);
  console.log('✅ Investment deals created:', deals.length);

  // Deal contributions
  const dealContribs: [number, string, number][] = [
    [0, uid(1), 5000], [0, uid(2), 8000], [0, uid(4), 15000], [0, uid(7), 20000], [0, uid(10), 6000], [0, 'owner_001', 13500],
    [1, uid(3), 3000], [1, uid(6), 5000], [1, uid(11), 7500], [1, 'owner_001', 7500],
    [4, uid(1), 5000], [4, uid(4), 10000], [4, uid(7), 25000], [4, 'owner_001', 40000],
  ];
  for (const [dIdx, userId, amount] of dealContribs) {
    const deal = deals[dIdx];
    await db.dealContribution.create({
      data: { dealId: deal.id, userId: userId as string, amount, sharePercent: (amount / deal.targetAmount) * 100, expectedReturn: amount * (1 + deal.roiPercent / 100) },
    });
  }

  // Deal votes (for voting/proposed deals)
  const dealVotes: [number, string, string][] = [
    [2, uid(1), 'for'], [2, uid(2), 'for'], [2, uid(3), 'for'], [2, uid(4), 'for'], [2, uid(5), 'for'],
    [2, uid(6), 'for'], [2, uid(7), 'for'], [2, uid(8), 'for'], [2, uid(9), 'against'],
    [2, uid(10), 'for'], [2, uid(11), 'for'], [2, 'owner_001', 'for'], [2, 'admin_001', 'for'],
  ];
  for (const [dIdx, userId, vote] of dealVotes) {
    await db.dealVote.create({ data: { dealId: deals[dIdx].id, userId: userId as string, vote, comment: vote === 'for' ? 'Great opportunity, I\'m in!' : 'Too risky for my portfolio' } });
  }

  // Deal payouts (for completed deal)
  for (const [dIdx, userId, amount] of dealContribs.filter(d => d[0] === 4)) {
    const principal = amount;
    const profit = principal * 0.16;
    await db.dealPayout.create({
      data: { dealId: deals[4].id, userId: userId as string, amount: principal + profit, principal, profit, status: 'completed', processedAt: days(3) },
    });
  }
  console.log('✅ Group investment data created');

  // ═══════════════════════════════════════════════════════════════════════
  // 18. NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════
  const notifs: [string, string, string, string, boolean][] = [
    [uid(1), 'Investment Return!', 'Your Crypto Staking Pool investment has generated $125 in returns.', 'success', true],
    [uid(1), 'New Referral Bonus', 'You earned $10 for referring Amina Bello to the platform!', 'success', true],
    [uid(1), 'Course Update', 'New lesson added: "Advanced Trading Strategies" in Crypto Masterclass.', 'info', false],
    [uid(2), 'Course Completed!', 'Congratulations! You completed Financial Literacy 101 and earned a certification.', 'success', true],
    [uid(2), 'Referral Bonus', 'You earned $10 for referring Emeka Nwachukwu!', 'success', true],
    [uid(3), 'Investment Opportunity', 'New deal "Sustainable Farming Initiative" is now open for funding.', 'info', false],
    [uid(4), 'Certification Earned!', 'You earned the "Digital Marketing Expert" certification!', 'success', true],
    [uid(4), 'Escrow Update', 'The Dubai Real Estate Deal has reached 65% of its funding target.', 'info', false],
    [uid(5), 'Subscription Expired', 'Your Pro subscription has expired. Renew now to continue accessing premium content.', 'warning', false],
    [uid(6), 'Group Investment', 'Your contribution to Sustainable Farming Initiative has been confirmed.', 'success', true],
    [uid(7), 'Big Return!', 'Your Green Energy Bonds investment generated $200 in returns.', 'success', true],
    [uid(7), 'New Achievement', 'You unlocked the "Big Spender" achievement for investing over $1000!', 'success', true],
    [uid(8), 'Withdrawal Rejected', 'Your withdrawal request of $150 was rejected. Please update your wallet address.', 'error', false],
    [uid(9), 'Welcome!', 'Welcome to Hustle University! Start exploring courses and grow your hustle.', 'info', true],
    [uid(10), 'Payment Received', 'Your wallet has been funded with $300 successfully.', 'success', true],
    [uid(11), 'Solar Farm Proposal', 'A new investment deal "Solar Farm Investment" has been proposed. Cast your vote!', 'info', false],
    ['owner_001', 'ROI Received', 'Your E-Commerce Revenue Share investment returned $480 in profits.', 'success', true],
    ['owner_001', 'Welcome to Admin', 'Your admin account is set up. You now have full access to the platform management tools.', 'info', true],
    ['owner_001', 'New User Registered', 'Chinedu Okafor just joined the platform using your referral code.', 'info', false],
    ['admin_001', 'Platform Stats', 'Weekly report: 12 new users, $4,500 in revenue, 3 new investments.', 'info', false],
  ];
  for (const [userId, title, message, type, read] of notifs) {
    await db.notification.create({ data: { userId: userId as string, title, message, type, read } });
  }
  console.log('✅ Notifications created:', notifs.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 19. FORUM (Community)
  // ═══════════════════════════════════════════════════════════════════════
  const forumCats = await Promise.all([
    db.forumCategory.create({ data: { name: 'General Discussion', slug: 'general', icon: 'MessageSquare', color: '#D4AF37', description: 'General discussions about the platform and investing', order: 1 } }),
    db.forumCategory.create({ data: { name: 'Investment Tips', slug: 'investment-tips', icon: 'TrendingUp', color: '#16A34A', description: 'Share and learn investment strategies', order: 2 } }),
    db.forumCategory.create({ data: { name: 'Course Reviews', slug: 'course-reviews', icon: 'Star', color: '#F59E0B', description: 'Review and discuss courses', order: 3 } }),
    db.forumCategory.create({ data: { name: 'Marketplace', slug: 'marketplace', icon: 'ShoppingBag', color: '#9333EA', description: 'Buy, sell, and trade opportunities', order: 4 } }),
  ]);

  const topics = [
    { cat: 0, user: uid(1), title: 'Best crypto to invest in 2025?', content: 'I\'ve been researching and BTC, ETH, and SOL seem strong. What\'s everyone looking at? I\'m particularly interested in projects with real utility and strong fundamentals. Also considering some DeFi tokens.', pinned: true },
    { cat: 2, user: uid(2), title: 'My experience with the Real Estate course', content: 'Just completed the Real Estate Investment Fundamentals course and it was incredibly practical. The section on property valuation methods alone saved me from making a bad investment. Highly recommend for anyone looking to get into real estate!', pinned: false },
    { cat: 1, user: uid(6), title: 'Agriculture investment opportunities in Nigeria', content: 'The Sustainable Farming Initiative on the platform caught my eye. Has anyone invested in agri-deals before? I\'m thinking about contributing but would love to hear from experienced agri-investors.', pinned: false },
    { cat: 1, user: uid(7), title: 'Tips for beginners in stock trading', content: 'After completing the Advanced Stock Trading course, here are my top 5 tips for beginners:\n\n1. Start with paper trading to practice\n2. Never invest more than you can afford to lose\n3. Diversify across sectors\n4. Focus on fundamentals, not hype\n5. Have an exit strategy for every trade\n\nWhat would you add to this list?', pinned: true },
    { cat: 3, user: uid(3), title: 'Looking for business partners', content: 'I\'m scaling my e-commerce business and looking for partners with experience in logistics and supply chain management. Based in Lagos. If interested, let\'s connect!', pinned: false },
    { cat: 1, user: uid(4), title: 'How I made 50% ROI on my first deal', content: 'Invested in the Commercial Property Fund deal 12 months ago and just received my payout with 16% ROI. Combined with the referral bonuses and other investments, my total returns this year are over 50%. The key is diversification and patience!', pinned: false },
    { cat: 0, user: uid(8), title: 'Digital marketing strategies that work', content: 'As a healthcare professional, I never thought digital marketing would be relevant to me. But after taking the Digital Marketing Mastery course, I\'ve been able to promote my healthtech startup effectively. Social media marketing has been the biggest game-changer.', pinned: false },
    { cat: 1, user: uid(11), title: 'Solar energy: The future of Nigerian power', content: 'With the constant power issues in Nigeria, solar energy investments are becoming very attractive. The Solar Farm Investment proposal on the platform looks promising. What are your thoughts on renewable energy as an investment class?', pinned: false },
  ];

  const topicIds: string[] = [];
  for (const t of topics) {
    const topic = await db.forumTopic.create({
      data: { categoryId: forumCats[t.cat].id, userId: t.user, title: t.title, content: t.content, isPinned: t.pinned, replyCount: 0, lastReplyAt: days(2) },
    });
    topicIds.push(topic.id);
  }

  // Forum replies
  const replies: [number, string, string][] = [
    [0, uid(2), 'I\'m bullish on ETH and SOL. ETH especially with the ecosystem growth. Also looking at LINK and AVAX.'],
    [0, uid(4), 'Don\'t sleep on Polygon (MATIC) - the scaling solution narrative is strong for 2025.'],
    [0, uid(7), 'Diversification is key. I spread across BTC (40%), ETH (30%), and a basket of altcoins (30%).'],
    [0, uid(10),'New to crypto but the Crypto Trading Masterclass on this platform really helped me understand the basics.'],
    [0, uid(11),'Has anyone looked into AI-related tokens? That sector seems to have huge potential.'],
    [1, uid(1), 'Great review! I\'m enrolling in this course next. The property valuation section sounds exactly what I need.'],
    [1, uid(7), 'I completed it too. The financing section was eye-opening - didn\'t know about hard money loans before.'],
    [1, uid(4), 'Agree with this review. I used the rental property management tips on my own property and it\'s been amazing.'],
    [2, uid(1), 'I invested in the AgriTech Growth Fund and it\'s been performing well. Agriculture in Nigeria has huge untapped potential.'],
    [2, uid(10),'As an EdTech founder, I see the potential in AgriTech too. The Sustainable Farming Initiative looks solid.'],
    [2, uid(3), 'I\'m in on the Sustainable Farming deal. The team behind it has a good track record.'],
    [2, uid(11),'Agriculture is the future of Nigerian economy. I\'m contributing to the equipment pool deal.'],
    [3, uid(2), 'Great tips Olumide! I\'d add: learn to read financial statements. It\'s the foundation of fundamental analysis.'],
    [3, uid(4), 'Tip #6: Keep a trading journal. Reviewing your trades helps you identify patterns and mistakes.'],
    [3, uid(1), 'Would add: understand market cycles. Bear markets are for accumulating, bull markets for taking profits.'],
    [3, uid(5), 'As a dev transitioning to fintech, the course on options and derivatives was invaluable. Highly technical but worth it.'],
    [3, uid(9), 'Just started the course. The fundamental analysis section is already changing how I think about stocks.'],
    [4, uid(4), 'I have logistics experience! Let\'s connect. I\'ve been looking for e-commerce partnerships.'],
    [4, uid(6), 'I know someone who might be interested. I\'ll share your contact.'],
    [5, uid(2), 'That\'s impressive Funke! What\'s your strategy for selecting which deals to invest in?'],
    [5, uid(7), 'Diversification really is the key. I\'m spread across real estate, energy, and crypto.'],
    [5, uid(1), 'Congratulations! The Commercial Property Fund deal was indeed a great opportunity.'],
    [5, uid(10),'Inspiring! I just made my first investment and hoping for similar returns.'],
    [6, uid(4), 'Social media marketing is indeed powerful! I grew my brand from 0 to 50K followers using the strategies from the course.'],
    [6, uid(3), 'The paid advertising section was a game-changer for my e-commerce store. ROAS went from 1.5x to 4x.'],
    [7, uid(1), 'I\'m voting for the Solar Farm deal. Energy is one of Nigeria\'s biggest challenges and opportunities.'],
    [7, uid(7), 'The ROI projection of 22% is attractive but the 18-month duration requires patience. Worth it though.'],
  ];
  for (const [tIdx, userId, content] of replies) {
    await db.forumReply.create({ data: { topicId: topicIds[tIdx], userId, content, createdAt: days(Math.floor(Math.random() * 10) + 1) } });
    await db.forumTopic.update({ where: { id: topicIds[tIdx] }, data: { replyCount: { increment: 1 } } });
  }
  console.log('✅ Forum data created:', topics.length, 'topics,', replies.length, 'replies');

  // ═══════════════════════════════════════════════════════════════════════
  // 20. CHAT MESSAGES
  // ═══════════════════════════════════════════════════════════════════════
  // Conversation 1: Chinedu <-> Amina (private)
  const conv1 = await db.conversation.create({ data: { isGroup: false, lastMessageAt: hours(2) } });
  await db.conversationMember.create({ data: { conversationId: conv1.id, userId: uid(1) } });
  await db.conversationMember.create({ data: { conversationId: conv1.id, userId: uid(2) } });
  const chat1: [string, string, number][] = [
    [uid(1), 'Hey Amina! How\'s your Real Estate investment going?', 24],
    [uid(2), 'Going great! The Lagos deal is already 67% funded. Exciting times.', 23],
    [uid(1), 'I put in $5K. Hoping it matures well. Have you looked at the Dubai deal?', 22],
    [uid(2), 'Yes! I contributed $8K. The property acquisition milestone was just released.', 21],
    [uid(1), 'Nice. I\'m also looking at the Solar Farm proposal. What do you think?', 20],
    [uid(2), 'Solar energy in Nigeria is a no-brainer. I\'m definitely voting for it when it opens.', 10],
    [uid(1), 'Agreed. Let\'s co-invest if it gets approved.', 5],
    [uid(2), 'Deal! I\'ll let you know when voting starts. 🤝', 2],
  ];
  for (const [userId, content, hoursAgo] of chat1) {
    await db.chatMessage.create({ data: { conversationId: conv1.id, userId: userId as string, content, createdAt: hours(hoursAgo) } });
  }

  // Conversation 2: Tunde, Funke, Olumide (group)
  const conv2 = await db.conversation.create({ data: { name: 'Investment Club 📈', isGroup: true, lastMessageAt: hours(1) } });
  await db.conversationMember.create({ data: { conversationId: conv2.id, userId: uid(3) } });
  await db.conversationMember.create({ data: { conversationId: conv2.id, userId: uid(4) } });
  await db.conversationMember.create({ data: { conversationId: conv2.id, userId: uid(7) } });
  const chat2: [string, string, number][] = [
    [uid(3), 'Welcome to the Investment Club everyone! 🎉', 48],
    [uid(4), 'Thanks Tunde! Excited to share strategies with you all.', 47],
    [uid(7), 'Great idea. I\'ll share my stock analysis every week.', 46],
    [uid(3), 'Anyone looked at the Tech Startup Portfolio deal?', 24],
    [uid(4), 'Yes! 30% ROI is tempting but the 2-year lock is long. Worth it for the diversification though.', 23],
    [uid(7), 'I voted for it. Tech is the future. And it\'s a portfolio of 5 startups, so risk is spread.', 1],
  ];
  for (const [userId, content, hoursAgo] of chat2) {
    await db.chatMessage.create({ data: { conversationId: conv2.id, userId: userId as string, content, createdAt: hours(hoursAgo) } });
  }

  // Conversation 3: Admin <-> Owner (support)
  const conv3 = await db.conversation.create({ data: { name: 'Platform Support', isGroup: false, lastMessageAt: hours(6) } });
  await db.conversationMember.create({ data: { conversationId: conv3.id, userId: 'admin_001' } });
  await db.conversationMember.create({ data: { conversationId: conv3.id, userId: 'owner_001' } });
  const chat3: [string, string, number][] = [
    [uid(1), 'Hi Admin, I need help with my withdrawal. It\'s been pending for a while.', 72],
    ['admin_001', 'Hi! Let me check on that for you right away. Can you share the withdrawal ID?', 71],
    [uid(1), 'It\'s WDR-2025-001. Amount is $150 via Bitcoin.', 70],
    ['admin_001', 'Found it! It\'s been approved and is now processing. You should receive it within 24 hours. Thanks for your patience!', 69],
  ];
  for (const [userId, content, hoursAgo] of chat3) {
    await db.chatMessage.create({ data: { conversationId: conv3.id, userId: userId as string, content, createdAt: hours(hoursAgo) } });
  }
  console.log('✅ Chat data created: 3 conversations,', chat1.length + chat2.length + chat3.length, 'messages');

  // ═══════════════════════════════════════════════════════════════════════
  // 21. QA SESSIONS
  // ═══════════════════════════════════════════════════════════════════════
  const qa1 = await db.qASession.create({
    data: { title: 'Crypto Market Outlook 2025', description: 'Join Dr. Adekunle Ogunlesi as he shares his expert analysis of the cryptocurrency market for 2025. Topics include Bitcoin halving effects, DeFi evolution, and emerging altcoins.', expertName: 'Dr. Adekunle Ogunlesi', expertBio: 'Chief Investment Officer at NigerCap with 15+ years in crypto markets', expertTitle: 'Chief Investment Officer, NigerCap', scheduledAt: days(-3), duration: 60, status: 'upcoming', hostId: 'admin_001' },
  });
  const qa2 = await db.qASession.create({
    data: { title: 'Real Estate Investment Strategies', description: 'Mrs. Folake Williams shares proven strategies for real estate investing in emerging markets, with focus on African opportunities.', expertName: 'Mrs. Folake Williams', expertBio: 'CEO of HomeVest Africa, managing $50M+ in real estate assets across 5 African countries', expertTitle: 'CEO, HomeVest Africa', scheduledAt: days(-14), duration: 90, status: 'ended', hostId: 'admin_001' },
  });

  // Questions for upcoming session
  await Promise.all([
    db.qAQuestion.create({ data: { sessionId: qa1.id, userId: uid(1), content: 'What\'s your outlook on Bitcoin after the halving? Will we see $100K this year?', upvotes: 15 } }),
    db.qAQuestion.create({ data: { sessionId: qa1.id, userId: uid(7), content: 'Which DeFi protocols do you recommend for beginners looking to earn yield?', upvotes: 12 } }),
    db.qAQuestion.create({ data: { sessionId: qa1.id, userId: uid(4), content: 'How do you manage risk in a highly volatile crypto portfolio?', upvotes: 8 } }),
  ]);

  // Questions for ended session (answered)
  await Promise.all([
    db.qAQuestion.create({ data: { sessionId: qa2.id, userId: uid(2), content: 'What\'s the minimum capital needed to start in real estate?', upvotes: 25, isAnswered: true, answer: 'You can start with as little as $100 through tokenized real estate platforms like ours. However, for direct property purchases, you\'d need at least 10-20% of the property value as down payment.', answeredAt: days(-14) } }),
    db.qAQuestion.create({ data: { sessionId: qa2.id, userId: uid(1), content: 'Is it better to invest in residential or commercial properties?', upvotes: 20, isAnswered: true, answer: 'Both have merits. Residential offers steady rental income with lower risk, while commercial properties offer higher yields but with longer vacancy periods. I recommend starting with residential and diversifying into commercial as your portfolio grows.', answeredAt: days(-14) } }),
    db.qAQuestion.create({ data: { sessionId: qa2.id, userId: uid(6), content: 'What role does technology play in modern real estate investing?', upvotes: 18, isAnswered: true, answer: 'Technology is transforming real estate through PropTech - from virtual tours and AI-powered valuation tools to blockchain-based property records and tokenized ownership. It\'s making real estate more accessible and transparent.', answeredAt: days(-14) } }),
    db.qAQuestion.create({ data: { sessionId: qa2.id, userId: uid(3), content: 'How do you evaluate the potential of a location for property investment?', upvotes: 16, isAnswered: true, answer: 'Look at infrastructure development, population growth, government policies, and economic indicators. In Nigeria, areas near new transportation hubs, commercial districts, and government development zones offer the best potential.', answeredAt: days(-14) } }),
    db.qAQuestion.create({ data: { sessionId: qa2.id, userId: uid(10), content: 'What financing options are available for first-time real estate investors?', upvotes: 14, isAnswered: true, answer: 'Options include mortgage loans, cooperative society contributions, real estate crowdfunding, and joint ventures. The key is to match the financing method to your risk tolerance and investment timeline.', answeredAt: days(-14) } }),
  ]);
  console.log('✅ QA sessions created: 2 sessions, 8 questions');

  // ═══════════════════════════════════════════════════════════════════════
  // 22. ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════════════
  const achievements = await Promise.all([
    db.achievement.create({ data: { title: 'First Course', description: 'Complete your first course', icon: 'GraduationCap', category: 'learning', requirement: 'Complete 1 course', points: 50 } }),
    db.achievement.create({ data: { title: 'Course Master', description: 'Complete 5 courses', icon: 'BookOpen', category: 'learning', requirement: 'Complete 5 courses', points: 200 } }),
    db.achievement.create({ data: { title: 'Early Bird', description: 'Register within first month of launch', icon: 'Clock', category: 'general', requirement: 'Register early', points: 25 } }),
    db.achievement.create({ data: { title: 'Networker', description: 'Refer 3 users to the platform', icon: 'Users', category: 'referral', requirement: 'Refer 3 users', points: 100 } }),
    db.achievement.create({ data: { title: 'Investor', description: 'Make your first investment', icon: 'TrendingUp', category: 'investment', requirement: 'Make 1 investment', points: 75 } }),
    db.achievement.create({ data: { title: 'Big Spender', description: 'Invest over $1,000 total', icon: 'DollarSign', category: 'investment', requirement: 'Invest $1,000+', points: 150 } }),
    db.achievement.create({ data: { title: 'Community Leader', description: 'Post 5 forum topics', icon: 'MessageSquare', category: 'engagement', requirement: 'Post 5 topics', points: 100 } }),
    db.achievement.create({ data: { title: 'Social Butterfly', description: 'Participate in 3 group investments', icon: 'Handshake', category: 'engagement', requirement: 'Join 3 deals', points: 125 } }),
  ]);

  // Award achievements
  const userAchievements: [string, number[]][] = [
    [uid(1), [0, 2, 3, 4, 5, 7]],
    [uid(2), [0, 2, 3, 4, 6]],
    [uid(3), [2, 4, 7]],
    [uid(4), [0, 2, 3, 4, 5, 6, 7]],
    [uid(5), [0, 2, 4]],
    [uid(6), [2, 4, 7]],
    [uid(7), [0, 2, 3, 4, 5, 6]],
    [uid(8), [2, 4]],
    [uid(9), [2]],
    [uid(10),[2, 4]],
    [uid(11),[2, 4, 7]],
    ['owner_001', [0, 2, 3, 4, 5, 6, 7]],
  ];
  let uaCount = 0;
  for (const [userId, achIdxs] of userAchievements) {
    for (const achIdx of achIdxs) {
      await db.userAchievement.create({ data: { userId: userId as string, achievementId: achievements[achIdx].id } }).catch(() => {});
      uaCount++;
    }
  }
  console.log('✅ Achievements created:', achievements.length, 'achievements,', uaCount, 'awards');

  // ═══════════════════════════════════════════════════════════════════════
  // 23. COMMISSIONS (MLM)
  // ═══════════════════════════════════════════════════════════════════════
  const commissions: [string, string, number, number][] = [
    ['admin_001', uid(1), 1, 5], ['admin_001', uid(2), 1, 5], ['admin_001', uid(3), 1, 2.5], ['admin_001', uid(4), 1, 5],
    [uid(1), uid(2), 2, 2.5], [uid(1), uid(7), 1, 5],
    [uid(2), uid(5), 1, 2.5], [uid(2), uid(10), 1, 2.5],
    [uid(3), uid(6), 1, 1.25],
    [uid(4), uid(8), 1, 2.5],
    [uid(5), uid(9), 1, 1.25],
    [uid(7), uid(11), 1, 5],
  ];
  for (const [userId, sourceUserId, level, amount] of commissions) {
    await db.commission.create({
      data: { userId: userId as string, sourceUserId: sourceUserId as string, level, amount, percentage: 5, status: 'paid', description: `Level ${level} commission` },
    });
  }
  console.log('✅ Commissions created:', commissions.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 24. PAYOUTS
  // ═══════════════════════════════════════════════════════════════════════
  const payouts: [string, number, string, string, string][] = [
    [uid(1), 150, 'bitcoin', 'completed', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
    [uid(2), 300, 'usdt', 'processing', '0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16'],
    [uid(7), 500, 'bank_transfer', 'completed', 'GTBank / 0123456789 / Olumide Adekunle'],
    [uid(4), 200, 'usdt', 'pending', '0x8ba1f109551bD432803012645Ac136ddd64DBA72'],
  ];
  for (const [userId, amount, method, status, detail] of payouts) {
    await db.payout.create({
      data: {
        userId: userId as string, amount, method, currency: method === 'bitcoin' ? 'BTC' : method === 'usdt' ? 'USDT' : 'USD',
        status, walletAddress: method !== 'bank_transfer' ? detail : undefined,
        bankName: method === 'bank_transfer' ? detail.split(' / ')[0] : undefined,
        bankAccount: method === 'bank_transfer' ? detail.split(' / ')[1] : undefined,
        bankAccountName: method === 'bank_transfer' ? detail.split(' / ')[2] : undefined,
        processedAt: status === 'completed' ? days(3) : undefined,
      },
    });
  }
  console.log('✅ Payouts created:', payouts.length);

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🎉 DEMO DATA IMPORT COMPLETE!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('  Owner/Admin: badrusuydu@necub.com / password123');
  console.log('  Admin:      info.venihost@gmail.com / password123');
  console.log('  Demo User:  chinedu@demo.com / password123');
  console.log('  (All 11 demo users use password: password123)\n');
  console.log('📊 DATA SUMMARY:');
  console.log('  Users: 13 (2 admins + 11 demo)');
  console.log('  Courses: 8 with 31 lessons');
  console.log('  Enrollments: 20+ across users');
  console.log('  Payments: 17');
  console.log('  Investment Opportunities: 5');
  console.log('  User Investments: 14');
  console.log('  Escrow Transactions: 4');
  console.log('  Group Investment Deals: 5');
  console.log('  Forum Topics: 8 with 27 replies');
  console.log('  Chat Conversations: 3 with 18 messages');
  console.log('  QA Sessions: 2 with 8 questions');
  console.log('  Achievements: 8 with 60+ awards');
  console.log('  Notifications: 20');
  console.log('════════════════════════════════════════════════════════════');
}

main().catch(console.error).finally(() => process.exit(0));
