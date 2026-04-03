import { db } from '@/lib/db';

const SEED_CATEGORIES = [
  {
    name: 'Affiliate Marketing',
    slug: 'affiliate-marketing',
    description: 'Learn how to earn passive income through affiliate partnerships and referral programs.',
    icon: 'Link',
    color: '#D4AF37',
    order: 1,
  },
  {
    name: 'Crypto Trading',
    slug: 'crypto-trading',
    description: 'Master cryptocurrency markets, trading strategies, and blockchain fundamentals.',
    icon: 'Bitcoin',
    color: '#F7931A',
    order: 2,
  },
  {
    name: 'Freelancing',
    slug: 'freelancing',
    description: 'Build a successful freelance career on platforms like Upwork, Fiverr, and more.',
    icon: 'Laptop',
    color: '#FF8C00',
    order: 3,
  },
  {
    name: 'Real Estate Flipping',
    slug: 'real-estate-flipping',
    description: 'Discover strategies for buying, renovating, and selling properties for profit.',
    icon: 'Building2',
    color: '#22C55E',
    order: 4,
  },
  {
    name: 'Dropshipping & E-commerce',
    slug: 'dropshipping-ecommerce',
    description: 'Launch and scale an online store with dropshipping and e-commerce strategies.',
    icon: 'ShoppingCart',
    color: '#8B5CF6',
    order: 5,
  },
  {
    name: 'Financial Literacy',
    slug: 'financial-literacy',
    description: 'Build a strong foundation in personal finance, budgeting, and wealth building.',
    icon: 'PiggyBank',
    color: '#06B6D4',
    order: 6,
  },
  {
    name: 'Investment Fundamentals',
    slug: 'investment-fundamentals',
    description: 'Learn stocks, bonds, ETFs, portfolio diversification, and long-term investing.',
    icon: 'TrendingUp',
    color: '#10B981',
    order: 7,
  },
  {
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Master SEO, social media marketing, content marketing, and paid advertising.',
    icon: 'Megaphone',
    color: '#EC4899',
    order: 8,
  },
];

const SEED_COURSES = [
  // Affiliate Marketing
  {
    title: 'Affiliate Marketing Fundamentals',
    description: 'Learn the basics of affiliate marketing — how it works, choosing programs, and your first commission.',
    difficulty: 'beginner',
    skillCategorySlug: 'affiliate-marketing',
    estimatedHours: 3,
    lessons: [
      { title: 'What is Affiliate Marketing?', content: '## What is Affiliate Marketing?\n\nAffiliate marketing is a performance-based business model where you earn a commission by promoting other people\'s (or company\'s) products. You find a product you like, promote it to others, and earn a piece of the profit for each sale that you make.\n\n### How It Works\n1. **You** sign up for an affiliate program (e.g., Amazon Associates, Jumia, Konga)\n2. **You** get a unique referral link\n3. **You** share that link with your audience\n4. When someone buys through your link, **you** earn a commission (typically 3-30%)\n\n### Why Start with Affiliate Marketing?\n- **Low startup cost** — No inventory, no shipping, no customer support\n- **Passive income potential** — Content you create today can earn for months/years\n- **Scalable** — No limit on how many products you can promote\n- **Location independent** — Work from anywhere with an internet connection', estimatedMinutes: 8 },
      { title: 'Choosing Profitable Niches', content: '## Choosing Profitable Niches\n\nYour niche determines your audience, the products you promote, and ultimately your income. Here\'s how to choose wisely.\n\n### Criteria for a Good Niche\n- **Has buying intent** — People actively search for solutions/products\n- **Has affiliate programs** — Multiple products with good commissions\n- **Has moderate competition** — Not too crowded, not too empty\n- **You have interest** — Sustainability matters\n\n### High-Profit Niches for 2024\n1. **Software/SaaS** — 20-50% recurring commissions\n2. **Financial products** — Credit cards, loans, investing (high payout)\n3. **Health & wellness** — Supplements, fitness programs\n4. **Online education** — Courses, certifications\n5. **Web hosting & tools** — $50-200+ per referral', estimatedMinutes: 10 },
      { title: 'Top Affiliate Networks', content: '## Top Affiliate Networks\n\nChoosing the right platform to find products is crucial. Here are the best options:\n\n### Global Networks\n- **Amazon Associates** — The biggest. 1-10% commissions. Massive product catalog.\n- **ShareASale** — 5,000+ merchants. Good for fashion, home, SaaS.\n- **CJ Affiliate** — Premium brands. Higher commissions but stricter approval.\n- **Impact** — Modern platform. Top-tier brands.\n\n### Nigeria/Africa-Focused\n- **Jumia Affiliate** — Up to 11% commission on Africa\'s largest marketplace.\n- **Konga Affiliate** — Nigeria\'s e-commerce giant. Competitive rates.\n\n### Crypto/Finance\n- **Binance Referral** — 20-50% commission on trading fees.\n- **Bybit Affiliate** — Up to 30% commission.\n\n### Key Metrics to Check\n- **Cookie duration** — How long your link stays active (30-90 days is good)\n- **Commission rate** — Higher isn\'t always better (consider volume)\n- **Payout threshold** — Minimum earnings before withdrawal\n- **Payment methods** — PayPal, bank transfer, crypto', estimatedMinutes: 12 },
      { title: 'Creating Content That Converts', content: '## Creating Content That Converts\n\nContent is your #1 asset in affiliate marketing. Here\'s how to create content that actually sells.\n\n### Content Types That Work\n1. **Product Reviews** — In-depth, honest reviews with pros/cons\n2. **Comparison Posts** — "Product A vs Product B" — captures buying-intent searches\n3. "How-To" Guides — Tutorial content that naturally includes product recommendations\n4. **Roundup Posts** — "Top 10 Best..." — Great for SEO and multiple commissions\n5. **Video Content** — YouTube reviews, unboxing, tutorials\n\n### The Affiliate Content Formula\n``nHook → Problem → Solution (product) → Benefits → CTA → FAQ```\n\n### SEO Tips for Affiliate Content\n- Target long-tail keywords with buying intent\n- Include product names, prices, and features\n- Use structured data (schema markup) for rich snippets\n- Internal link between related content\n- Update content regularly to maintain rankings', estimatedMinutes: 15 },
      { title: 'Tracking & Optimizing Performance', content: '## Tracking & Optimizing Performance\n\nYou can\'t improve what you don\'t measure. Here\'s how to track your affiliate performance.\n\n### Key Metrics\n- **Clicks** — How many people click your links\n- **Conversion rate** — Clicks ÷ Sales (aim for 1-5%)\n- **EPC (Earnings Per Click)** — Total earnings ÷ Total clicks\n- **AOV (Average Order Value)** — Average purchase amount\n- **Revenue per page** — Total earnings ÷ Number of pages\n\n### Tools for Tracking\n- **Google Analytics** — Free, powerful traffic analysis\n- **Pretty Links / ThirstyAffiliates** — Link cloaking and click tracking\n- **Voluum** — Advanced affiliate tracking\n- **Spreadsheet** — Simple but effective for beginners\n\n### Optimization Strategies\n1. A/B test your CTAs (button text, placement, color)\n2. Move high-converting links to more visible positions\n3. Remove or replace underperforming products\n4. Add more content around your best-performing topics\n5. Build an email list to promote directly', estimatedMinutes: 10 },
    ],
  },
  {
    title: 'Advanced Affiliate Strategies',
    description: 'Scale your affiliate business with email marketing, paid traffic, and funnel optimization.',
    difficulty: 'advanced',
    skillCategorySlug: 'affiliate-marketing',
    estimatedHours: 5,
    lessons: [
      { title: 'Building an Email List for Affiliates', content: '## Building an Email List for Affiliates\n\nEmail marketing is the #1 channel for affiliate revenue. Here\'s why and how to build it.\n\n### Why Email Beats Social Media\n- **You own the list** — No algorithm changes can take it away\n- **Higher conversion rates** — 3-5x vs social media\n- **Direct access** — Reach people anytime, any number of times\n- **Segmentation** — Send targeted offers based on interests\n\n### Lead Magnet Ideas\n- Free PDF guide related to your niche\n- Email course (5-7 day series)\n- Checklist or template\n- Exclusive discount codes\n- Free tool or calculator\n\n### Email Sequence Framework\n1. **Day 0**: Welcome + deliver lead magnet\n2. **Day 1**: Share your story + build trust\n3. **Day 2**: Provide value (tips, insights)\n4. **Day 3**: First soft recommendation\n5. **Day 5**: Case study / testimonial\n6. **Day 7**: Strong recommendation with urgency', estimatedMinutes: 12 },
      { title: 'Paid Traffic for Affiliate Offers', content: '## Paid Traffic for Affiliate Offers\n\nWhile organic traffic takes time, paid traffic can generate immediate results when done right.\n\n### Best Paid Traffic Sources\n1. **Facebook/Instagram Ads** — Best for physical products, courses\n2. **Google Ads** — Capture people actively searching\n3. **YouTube Ads** — Great for reviews and tutorials\n4. **Native Ads (Taboola, Outbrain)** — Content-style ads on news sites\n\n### The ROI Formula\n```\nRevenue = Traffic × Conversion Rate × Commission × AOV\nProfit = Revenue - Ad Spend\nROI = (Profit / Ad Spend) × 100\n```\n\n### Budget Strategy\n- Start with $5-10/day per campaign\n- Test 3-5 different ad creatives\n- Kill losers after 3 days, scale winners\n- Aim for 2:1 ROAS (Return on Ad Spend) minimum\n\n### Warning Signs\n- Landing page doesn\'t match the ad\n- No clear call-to-action\n- Promoting too many products at once\n- Ignoring mobile optimization (60%+ of traffic is mobile)', estimatedMinutes: 15 },
    ],
  },
  // Crypto Trading
  {
    title: 'Crypto Trading Masterclass',
    description: 'From blockchain basics to advanced trading strategies for cryptocurrency markets.',
    difficulty: 'beginner',
    skillCategorySlug: 'crypto-trading',
    estimatedHours: 6,
    lessons: [
      { title: 'Understanding Blockchain & Cryptocurrency', content: '## Understanding Blockchain & Cryptocurrency\n\nBefore trading, you must understand what you\'re trading.\n\n### What is Blockchain?\nA blockchain is a decentralized, distributed digital ledger that records transactions across many computers. Once recorded, data cannot be altered retroactively.\n\n### Key Concepts\n- **Decentralization** — No central authority controls the network\n- **Immutability** — Transactions cannot be reversed or altered\n- **Transparency** — All transactions are publicly visible\n- **Consensus** — Network agrees on transaction validity\n\n### Major Cryptocurrencies\n1. **Bitcoin (BTC)** — Digital gold, store of value, $50K+ per coin\n2. **Ethereum (ETH)** — Smart contracts platform, powers DeFi and NFTs\n3. **BNB** — Binance ecosystem token\n4. **USDT/USDC** — Stablecoins pegged to USD\n5. **Solana (SOL)** — Fast, low-cost transactions\n\n### Wallet Types\n- **Hot wallets** — Connected to internet (MetaMask, Trust Wallet)\n- **Cold wallets** — Offline storage (Ledger, Trezor)\n- **Exchange wallets** — On Binance, Bybit (least secure)', estimatedMinutes: 12 },
      { title: 'Reading Candlestick Charts', content: '## Reading Candlestick Charts\n\nCandlestick charts are the most common way to visualize price action in crypto.\n\n### Anatomy of a Candle\nEach candle shows 4 data points:\n- **Open** — Starting price\n- **Close** — Ending price\n- **High** — Maximum price\n- **Low** — Minimum price\n\n### Green Candle (Bullish)\n- Close > Open (price went up)\n- Body = Open to Close\n- Wicks = High and Low\n\n### Red Candle (Bearish)\n- Close < Open (price went down)\n- Body = Open to Close\n- Wicks = High and Low\n\n### Common Patterns\n**Bullish (Buy Signals):**\n- Hammer — Long lower wick, small body at top\n- Bullish Engulfing — Green candle fully engulfs previous red\n- Morning Star — Three-candle reversal pattern\n\n**Bearish (Sell Signals):**\n- Shooting Star — Long upper wick, small body at bottom\n- Bearish Engulfing — Red candle fully engulfs previous green\n- Evening Star — Three-candle reversal pattern\n\n### Timeframes\n- **1m, 5m** — Scalping (very short-term)\n- **15m, 1h** — Day trading\n- **4h, 1D** — Swing trading\n- **1W** — Position trading', estimatedMinutes: 15 },
      { title: 'Technical Analysis Basics', content: '## Technical Analysis Basics\n\nTechnical analysis uses historical price data to predict future price movements.\n\n### Support and Resistance\n- **Support** — Price level where buying pressure is strong (price bounces up)\n- **Resistance** — Price level where selling pressure is strong (price bounces down)\n\n### Key Indicators\n1. **Moving Averages (MA)**\n   - **SMA** — Simple average of closing prices\n   - **EMA** — Exponential (gives more weight to recent prices)\n   - **200 EMA** — Major trend indicator\n\n2. **RSI (Relative Strength Index)**\n   - Measures momentum (0-100)\n   - Above 70 = Overbought (potential sell)\n   - Below 30 = Oversold (potential buy)\n\n3. **MACD (Moving Average Convergence Divergence)**\n   - Trend-following momentum indicator\n   - MACD line crossing signal line = buy/sell signal\n\n4. **Volume**\n   - High volume confirms price moves\n   - Low volume suggests weak moves\n\n### Risk Management Rule\n**Never risk more than 1-2% of your trading capital on a single trade.**', estimatedMinutes: 15 },
      { title: 'Risk Management & Position Sizing', content: '## Risk Management & Position Sizing\n\nThe #1 reason traders fail is poor risk management — not bad analysis.\n\n### The Golden Rules\n1. **Never risk more than 1-2% per trade**\n2. **Always use stop-loss orders**\n3. **Risk/Reward ratio minimum 1:2**\n4. **Never trade with money you can\'t afford to lose**\n5. **Have a trading plan and stick to it**\n\n### Position Sizing Formula\n```\nPosition Size = (Account Balance × Risk %) / (Entry Price - Stop Loss)\n```\n\nExample:\n- Account: $1,000\n- Risk per trade: 2% ($20)\n- Entry: $50, Stop Loss: $48 (2% drop)\n- Position Size: $20 / $2 = 10 units\n\n### Types of Orders\n- **Market Order** — Buy/sell immediately at current price\n- **Limit Order** — Buy/sell at a specific price\n- **Stop Loss** — Automatically sell if price drops to level\n- **Take Profit** — Automatically sell when price reaches target\n\n### Common Mistakes\n- Moving your stop loss further away\n- Revenge trading after a loss\n- Over-leveraging (trading with borrowed funds)\n- Not taking profits (letting winners become losers)', estimatedMinutes: 12 },
      { title: 'Trading Psychology', content: '## Trading Psychology\n\nYour mindset is more important than your strategy. Here\'s how to develop a winning psychology.\n\n### The Emotional Trap\n- **Fear** — Causes you to sell too early or not enter trades\n- **Greed** — Causes you to hold too long or risk too much\n- **FOMO** — Fear Of Missing Out causes impulsive entries\n- **Revenge** — Trying to "win back" losses leads to bigger losses\n\n### Developing Discipline\n1. **Have a written trading plan** — Rules for entry, exit, risk\n2. **Journal every trade** — What, why, result, emotions\n3. **Review weekly** — Identify patterns in your behavior\n4. **Take breaks** — After 3 consecutive losses, step away\n5. **Focus on process, not outcome** — Good decisions matter more than results\n\n### The Professional Mindset\n- Treat it like a business, not gambling\n- Accept losses as part of the game (even pros lose 40-50% of trades)\n- Focus on risk management over profit targets\n- Continuous learning and adaptation\n- Patience — Wait for high-probability setups', estimatedMinutes: 10 },
    ],
  },
  // Freelancing
  {
    title: 'Freelancing on Upwork & Fiverr',
    description: 'Build a profitable freelance career from scratch — profile setup, proposals, and scaling.',
    difficulty: 'beginner',
    skillCategorySlug: 'freelancing',
    estimatedHours: 4,
    lessons: [
      { title: 'Choosing Your Freelance Skill', content: '## Choosing Your Freelance Skill\n\nYour skill choice determines your earning potential, competition, and sustainability.\n\n### High-Demand Skills in 2024\n1. **Web Development** — $50-200/hour\n2. **UI/UX Design** — $40-150/hour\n3. **Copywriting** — $30-100/hour\n4. **Video Editing** — $25-80/hour\n5. **Social Media Management** — $20-60/hour\n6. **Data Analysis** — $40-120/hour\n7. **Mobile App Development** — $60-200/hour\n\n### How to Choose\n- **Assess your current skills** — What are you already good at?\n- **Check market demand** — Search on Upwork/Fiverr for your skill\n- **Consider learning curve** — Can you become profitable in 1-3 months?\n- **Think long-term** — Will this skill be relevant in 5 years?\n\n### Skill Stacking Strategy\nInstead of being average at one thing, be good at 2-3 complementary skills:\n- Web Design + SEO + Copywriting = Full website package\n- Video Editing + Motion Graphics = Premium video content\n- Data Analysis + Excel + Visualization = Business intelligence', estimatedMinutes: 10 },
      { title: 'Creating a Winning Profile', content: '## Creating a Winning Profile\n\nYour profile is your storefront. It needs to convert visitors into clients.\n\n### Profile Photo\n- Professional headshot (not a selfie)\n- Good lighting, neutral background\n- Smile — People work with people they like\n\n### Title (Most Important!)\nBad: "Freelance Writer"\nGood: "SEO Content Writer | 500+ Articles | SaaS & Tech"\n\n**Formula:** [Skill] + [Specialty] + [Proof/Result]\n\n### Overview/Bio Formula\n1. **Hook** — One sentence about the transformation you provide\n2. **Proof** — Numbers, results, experience\n3. **Process** — How you work (shows professionalism)\n4. **CTA** — Invite them to message you\n\n### Portfolio\n- Show 3-5 of your BEST work (not all your work)\n- Include results/outcomes, not just deliverables\n- Add case studies with before/after metrics\n- Use clean, well-formatted PDFs', estimatedMinutes: 10 },
      { title: 'Writing Proposals That Get Hired', content: '## Writing Proposals That Get Hired\n\nMost freelancers send generic proposals. Standing out is easier than you think.\n\n### The 3-Part Proposal Framework\n1. **Hook** — Show you understand their specific problem\n2. **Solution** — Briefly explain how you\'ll solve it\n3. **Social Proof** — Share relevant results from past work\n\n### Template\n```\nHi [Client Name],\n\nI noticed you need [specific need from job post]. I\'ve helped [similar client] achieve [specific result] by [specific method].\n\nHere\'s my approach:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nRecent result: [Metric] for [Client] in [timeframe].\n\nI\'d love to discuss your project. When works for a quick call?\n\nBest,\n[Your name]\n```\n\n### Common Mistakes\n- Copy-pasting the same proposal (clients can tell)\n- Focusing on "me" instead of the client\'s problem\n- Bidding too low (race to the bottom)\n- Not asking questions about the project\n- Submitting 10 proposals a day (quality > quantity)', estimatedMinutes: 12 },
      { title: 'Pricing Your Services', content: '## Pricing Your Services\n\nPricing is the hardest part of freelancing. Here\'s how to price for profit.\n\n### Pricing Models\n1. **Hourly** — Simple but limits your income\n2. **Fixed price** — Better for defined scopes\n3. **Value-based** — Best for experienced freelancers (charge based on value delivered)\n\n### How to Calculate Your Rate\n```\nHourly Rate = (Desired Annual Income / Billable Hours) × 1.5\n```\n\nExample:\n- Want to earn $60,000/year\n- Can bill 1,000 hours/year (20 hrs/week)\n- ($60,000 / 1,000) × 1.5 = $90/hour\n\n### Pricing Strategy\n- **Start at market rate** — Check what others charge\n- **Raise 10-20% every 3-6 months** — As your reviews grow\n- **Offer project-based pricing** — Clients prefer fixed costs\n- **Create packages** — Basic ($X), Standard ($Y), Premium ($Z)\n\n### When to Raise Prices\n- You\'re fully booked for 2+ weeks\n- Your JSS (Job Success Score) is above 90%\n- You have 10+ 5-star reviews\n- Clients say "you\'re cheap" (yes, that\'s a signal!)', estimatedMinutes: 12 },
    ],
  },
  // Real Estate
  {
    title: 'Real Estate Flipping 101',
    description: 'Learn the fundamentals of property flipping — finding deals, calculating ROI, and managing renovations.',
    difficulty: 'intermediate',
    skillCategorySlug: 'real-estate-flipping',
    estimatedHours: 4,
    lessons: [
      { title: 'Is Real Estate Flipping Right for You?', content: '## Is Real Estate Flipping Right for You?\n\nProperty flipping can be highly profitable — or financially devastating. Let\'s help you decide.\n\n### What is House Flipping?\nBuying a property below market value, renovating it, and selling it for a profit — usually within 3-6 months.\n\n### Pros\n- High profit potential ($20K-$100K+ per flip)\n- Tangible asset (unlike stocks)\n- Tax advantages (capital gains, depreciation)\n- Can use leverage (OPM — Other People\'s Money)\n\n### Cons\n- Requires significant capital\n- Time-intensive (100+ hours per flip)\n- Market risk (property values can drop)\n- Unexpected renovation costs\n- Carrying costs (mortgage, insurance, taxes while holding)\n\n### The 70% Rule\n```\nMaximum Purchase Price = (After Repair Value × 70%) - Estimated Repair Costs\n```\n\nExample:\n- ARV (After Repair Value): $200,000\n- Estimated Repairs: $30,000\n- Max Purchase: ($200,000 × 70%) - $30,000 = $110,000\n\n### Skills You Need\n- Basic math and budgeting\n- Project management\n- Knowledge of construction/renovations\n- Negotiation skills\n- Patience and persistence', estimatedMinutes: 10 },
      { title: 'Finding Profitable Deals', content: '## Finding Profitable Deals\n\nThe money is made in the purchase, not the sale. Here\'s how to find below-market deals.\n\n### Deal Sources\n1. **MLS (Multiple Listing Service)** — Work with a real estate agent\n2. **Foreclosures** — Bank-owned properties (REO)\n3. **Auctions** — County auctions, online auctions\n4. **Direct Mail** — Send letters to absentee owners, distressed properties\n5. **Networking** — Wholesalers, real estate agents, attorneys\n6. **Driving for Dollars** — Look for neglected properties\n7. **Online Platforms** — Zillow, Redfin, Auction.com\n\n### What Makes a Good Deal?\n- Priced 20-30% below market\n- Needs cosmetic repairs (not structural)\n- Good location (desirable neighborhood)\n- 3+ bedrooms, 2+ bathrooms\n- Comparable sales support the ARV\n\n### Red Flags 🚩\n- Foundation issues\n- Major plumbing/electrical problems\n- Environmental hazards (asbestos, lead)\n- Flood zone\n- Liens or title issues\n- HOA restrictions on renovations\n\n### Due Diligence Checklist\n1. Pull comparable sales (comps) in the area\n2. Get contractor estimates for renovations\n3. Calculate all costs (purchase, repairs, holding, closing)\n4. Verify title is clean\n5. Inspect the property thoroughly', estimatedMinutes: 15 },
      { title: 'Budgeting & Managing Renovations', content: '## Budgeting & Managing Renovations\n\nA flip\'s profitability depends almost entirely on renovation management.\n\n### The 30-30-30-10 Budget Rule\n- **30%** Kitchen & Bathrooms\n- **30%** Flooring, Paint, Lighting\n- **30%** Structural (roof, HVAC, plumbing if needed)\n- **10%** Contingency (always have a buffer!)\n\n### High-ROI Renovations\n1. **Kitchen update** — Cabinets, countertops, appliances (80-100% ROI)\n2. **Bathroom remodel** — Tile, fixtures, vanity (70-90% ROI)\n3. **Fresh paint** — Neutral colors throughout (100%+ ROI)\n4. **Curb appeal** — Landscaping, front door, exterior (100%+ ROI)\n5. **Flooring** — Hardwood or luxury vinyl plank\n\n### Low-ROI Renovations (Avoid)\n- Swimming pools\n- Room additions\n- High-end appliances in a budget neighborhood\n- Custom anything\n\n### Managing Contractors\n- Get 3+ quotes for every major job\n- Never pay 100% upfront (30/30/40 is standard)\n- Get everything in writing\n- Visit the property 2-3x per week\n- Have a daily/weekly checklist', estimatedMinutes: 12 },
    ],
  },
  // Dropshipping & E-commerce
  {
    title: 'Dropshipping for Beginners',
    description: 'Start an online store without inventory — learn product research, store setup, and marketing.',
    difficulty: 'beginner',
    skillCategorySlug: 'dropshipping-ecommerce',
    estimatedHours: 5,
    lessons: [
      { title: 'How Dropshipping Works', content: '## How Dropshipping Works\n\nDropshipping is an e-commerce model where you sell products without holding inventory.\n\n### The Dropshipping Flow\n1. **Customer** places order on your store\n2. **You** forward the order to your supplier\n3. **Supplier** ships directly to the customer\n4. **You** keep the profit margin\n\n### Pros\n- No inventory investment\n- Low startup costs ($100-500)\n- Location independent\n- Wide product selection\n- Easy to test new products\n\n### Cons\n- Low profit margins (10-30%)\n- No control over shipping\n- High competition\n- Customer service challenges\n- Supplier reliability issues\n\n### Costs to Start\n- Domain name: $10-15/year\n- Shopify: $39/month (or free with trial)\n- Theme: $0-200 (free themes work fine)\n- Marketing test budget: $100-500\n- **Total startup: $150-700**\n\n### Realistic Expectations\n- First month: Testing and learning ($0-500 revenue)\n- Months 2-3: Finding winning products ($500-5,000 revenue)\n- Months 4-6: Scaling ($5,000-50,000 revenue)\n- Profit margins: 15-30% of revenue', estimatedMinutes: 10 },
      { title: 'Finding Winning Products', content: '## Finding Winning Products\n\nYour product selection is the single most important factor in dropshipping success.\n\n### Winning Product Criteria\n1. **Solves a problem** — Pain-point products sell themselves\n2. **Hard to find locally** — Not available in regular stores\n3. **High perceived value** — Looks more expensive than it costs\n4. **Lightweight and small** — Cheap shipping, less damage\n5. **$15-50 retail price** — Sweet spot for impulse buying\n6. **Good margins** — Buy for $3-10, sell for $20-50\n\n### Product Research Methods\n1. **AliExpress Dropshipping Center** — See trending products\n2. **TikTok/Instagram** — See what\'s going viral\n3. **Amazon Movers & Shakers** — Fast-growing products\n4. **Google Trends** — Check if interest is growing\n5. **Facebook Ad Library** — See what competitors are advertising\n\n### Product Validation Checklist\n- [ ] Can I find 3+ suppliers on AliExpress?\n- [ ] Shipping time under 15 days?\n- [ ] Competitors selling this successfully?\n- [ ] Good reviews (4+ stars)?\n- [ ] Price allows 3x markup?\n- [ ] Not a branded/patented product?\n\n### Red Flags 🚩\n- Electronics (high defect rate, returns)\n- Fragile items (break in shipping)\n- Health supplements (legal liability)\n- Copyrighted/branded products', estimatedMinutes: 15 },
      { title: 'Setting Up Your Shopify Store', content: '## Setting Up Your Shopify Store\n\nYour store needs to look professional and trustworthy to convert visitors into buyers.\n\n### Step-by-Step Setup\n1. **Create account** — Shopify 14-day free trial\n2. **Choose theme** — Dawn (free) or Turbo (paid)\n3. **Add products** — 5-10 products to start (don\'t add too many)\n4. **Write descriptions** — Focus on benefits, not features\n5. **Set up pages** — About, Contact, Shipping, Returns, FAQ\n6. **Add policies** — Privacy, Terms, Refund policy\n7. **Set up payments** — Shopify Payments (credit card)\n8. **Add trust signals** — Reviews, guarantees, secure checkout badges\n\n### Product Page Essentials\n- High-quality images (3-5 per product)\n- Clear pricing with comparison\n- Benefit-focused description\n- Social proof (reviews, ratings)\n- Urgency elements (limited stock, sale timer)\n- Clear CTA button ("Add to Cart")\n\n### Legal Requirements\n- Privacy Policy\n- Terms of Service\n- Refund/Return Policy\n- Shipping Policy\n- Contact information\n- Business registration (check your country\'s requirements)', estimatedMinutes: 12 },
      { title: 'Marketing Your Store', content: '## Marketing Your Dropshipping Store\n\nTraffic is the lifeblood of your store. Here\'s how to get buyers.\n\n### Facebook & Instagram Ads (Primary)\n- Start with $5-10/day per ad set\n- Use video content (UGC-style works best)\n- Target interests related to your product\n- Test 3-5 different creatives\n- Use Carousel ads to show multiple products\n\n### TikTok Marketing (Organic + Paid)\n- Post 1-3 videos daily showing the product in action\n- Use trending sounds and hashtags\n- Partner with micro-influencers ($50-200 per post)\n- Run Spark Ads ($10-50/day) on viral content\n\n### Email Marketing\n- Collect emails with 10% discount popup\n- Abandoned cart recovery emails (automated)\n- Weekly newsletters with new products/tips\n- Post-purchase follow-up sequence\n\n### Influencer Marketing\n1. Find micro-influencers (5K-50K followers) in your niche\n2. DM them with product offer (free product + commission)\n3. Ask for UGC content you can use in ads\n4. Track results with custom promo codes\n\n### Key Metrics\n- **CPA** (Cost Per Acquisition) — Aim for under $20\n- **ROAS** (Return on Ad Spend) — Aim for 2.5x+\n- **Conversion Rate** — Aim for 1.5-3%\n- **AOV** (Average Order Value) — Aim for $40+\n- **Customer LTV** — Aim for 2x+ CPA', estimatedMinutes: 15 },
    ],
  },
];

export async function seedLearningHub() {
  console.log('🌱 Seeding Learning Hub categories and courses...');

  // Seed categories
  for (const cat of SEED_CATEGORIES) {
    const existing = await db.skillCategory.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await db.skillCategory.create({ data: cat });
      console.log(`  ✅ Created category: ${cat.name}`);
    } else {
      console.log(`  ⏭️  Category exists: ${cat.name}`);
    }
  }

  // Seed courses with lessons
  for (const courseData of SEED_COURSES) {
    const skillCat = await db.skillCategory.findUnique({
      where: { slug: courseData.skillCategorySlug },
    });

    if (!skillCat) {
      console.log(`  ⚠️  Skipping "${courseData.title}" — category not found: ${courseData.skillCategorySlug}`);
      continue;
    }

    const existing = await db.course.findFirst({
      where: { title: courseData.title, skillCategoryId: skillCat.id },
    });

    if (!existing) {
      const course = await db.course.create({
        data: {
          title: courseData.title,
          description: courseData.description,
          difficulty: courseData.difficulty,
          category: skillCat.name,
          skillCategoryId: skillCat.id,
          estimatedHours: courseData.estimatedHours,
        },
      });

      for (let i = 0; i < courseData.lessons.length; i++) {
        const lesson = courseData.lessons[i];
        await db.lesson.create({
          data: {
            courseId: course.id,
            title: lesson.title,
            content: lesson.content,
            order: i + 1,
            estimatedMinutes: lesson.estimatedMinutes || 5,
          },
        });
      }

      console.log(`  ✅ Created course: ${courseData.title} (${courseData.lessons.length} lessons)`);
    } else {
      console.log(`  ⏭️  Course exists: ${courseData.title}`);
    }
  }

  console.log('🎉 Learning Hub seeding complete!');
}

// Run directly
seedLearningHub().catch(console.error);
