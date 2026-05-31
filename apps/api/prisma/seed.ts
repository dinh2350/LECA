import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@leca.dev';
const ADMIN_PASSWORD = 'Admin@LECA2026!';

const SCENARIOS: Array<{
  title: string;
  description: string;
  aiRole: string;
  context: string;
  difficulty: string;
  situationType: string;
  tags: string[];
  phrases: Array<{ phrase: string; exampleSentence: string; difficulty: string }>;
}> = [
  {
    title: 'Ordering at a Coffee Shop',
    description: 'Practice ordering drinks and food at a café',
    aiRole: 'A friendly barista at a busy coffee shop',
    context:
      'You are a barista at a popular coffee shop. Greet the customer, take their order, clarify any questions about size or customisation, and confirm the total price.',
    difficulty: 'A1',
    situationType: 'everyday',
    tags: ['food', 'shopping', 'daily-life'],
    phrases: [
      {
        phrase: "I'd like to order",
        exampleSentence: "I'd like to order a medium latte, please.",
        difficulty: 'A1',
      },
      {
        phrase: 'Could I have',
        exampleSentence: 'Could I have that with oat milk?',
        difficulty: 'A1',
      },
      {
        phrase: 'How much is that?',
        exampleSentence: 'How much is that in total?',
        difficulty: 'A1',
      },
    ],
  },
  {
    title: 'Asking for Directions',
    description: 'Learn how to ask for and understand directions in a city',
    aiRole: 'A local resident who knows the city well',
    context:
      'You are a helpful local standing near a landmark. A tourist will ask you for directions to various places. Give clear, step-by-step directions using street names and landmarks.',
    difficulty: 'A1',
    situationType: 'everyday',
    tags: ['travel', 'navigation', 'daily-life'],
    phrases: [
      {
        phrase: 'Excuse me, how do I get to',
        exampleSentence: 'Excuse me, how do I get to the train station?',
        difficulty: 'A1',
      },
      {
        phrase: 'Turn left / Turn right',
        exampleSentence: 'Turn left at the traffic lights.',
        difficulty: 'A1',
      },
      {
        phrase: "It's about … minutes' walk",
        exampleSentence: "It's about ten minutes' walk from here.",
        difficulty: 'A1',
      },
    ],
  },
  {
    title: 'Doctor Appointment',
    description: 'Describe symptoms and understand medical advice',
    aiRole: 'A general practitioner at a clinic',
    context:
      'You are a doctor seeing a patient. Ask about their symptoms, how long they have had them, and any allergies. Provide simple advice and explain any prescription.',
    difficulty: 'A2',
    situationType: 'everyday',
    tags: ['health', 'medical', 'daily-life'],
    phrases: [
      {
        phrase: "I've been feeling",
        exampleSentence: "I've been feeling dizzy since yesterday.",
        difficulty: 'A2',
      },
      {
        phrase: 'I have a pain in my',
        exampleSentence: 'I have a pain in my lower back.',
        difficulty: 'A2',
      },
      {
        phrase: 'How long should I take this?',
        exampleSentence: 'How long should I take this medicine?',
        difficulty: 'A2',
      },
    ],
  },
  {
    title: 'Job Interview — Introduction',
    description: 'Practice introducing yourself and answering common interview questions',
    aiRole: 'A friendly HR recruiter for a tech company',
    context:
      'You are an HR recruiter conducting an initial 15-minute phone screen for a junior software developer role. Ask standard opening questions: Tell me about yourself, why do you want this role, and one strength/weakness.',
    difficulty: 'B1',
    situationType: 'work',
    tags: ['career', 'interview', 'professional'],
    phrases: [
      {
        phrase: 'I have experience in',
        exampleSentence: 'I have experience in building REST APIs with Node.js.',
        difficulty: 'B1',
      },
      {
        phrase: 'My greatest strength is',
        exampleSentence: 'My greatest strength is my ability to learn quickly.',
        difficulty: 'B1',
      },
      {
        phrase: "I'm particularly interested in this role because",
        exampleSentence:
          "I'm particularly interested in this role because it aligns with my long-term career goals.",
        difficulty: 'B1',
      },
    ],
  },
  {
    title: 'Hotel Check-In',
    description: 'Check in to a hotel, confirm booking details, and ask about amenities',
    aiRole: 'A hotel receptionist at a mid-range city hotel',
    context:
      'You are a hotel receptionist. The guest will arrive to check in. Confirm their reservation, ask for ID and payment, explain breakfast timings, Wi-Fi password, and checkout procedure.',
    difficulty: 'A2',
    situationType: 'everyday',
    tags: ['travel', 'accommodation', 'daily-life'],
    phrases: [
      {
        phrase: 'I have a reservation under',
        exampleSentence: 'I have a reservation under the name Nguyen.',
        difficulty: 'A2',
      },
      {
        phrase: 'Could you tell me the Wi-Fi password?',
        exampleSentence: 'Could you tell me the Wi-Fi password, please?',
        difficulty: 'A2',
      },
      {
        phrase: 'What time is checkout?',
        exampleSentence: 'What time is checkout tomorrow?',
        difficulty: 'A2',
      },
    ],
  },
  {
    title: 'Workplace Meeting — Sharing an Update',
    description: 'Share a project status update in a team meeting',
    aiRole: 'A project manager running a weekly stand-up meeting',
    context:
      'You are a project manager. Run a brief stand-up. Ask each team member: what they worked on, any blockers, and their plan for today. Respond to blockers with constructive follow-up questions.',
    difficulty: 'B1',
    situationType: 'work',
    tags: ['business', 'meetings', 'professional'],
    phrases: [
      {
        phrase: 'Yesterday I completed',
        exampleSentence: 'Yesterday I completed the integration tests for the auth module.',
        difficulty: 'B1',
      },
      {
        phrase: "I'm currently blocked by",
        exampleSentence: "I'm currently blocked by a dependency issue with the API.",
        difficulty: 'B1',
      },
      {
        phrase: 'Today I plan to',
        exampleSentence: 'Today I plan to review the pull requests and fix the failing tests.',
        difficulty: 'B1',
      },
    ],
  },
  {
    title: 'Shopping for Clothes',
    description: 'Ask about sizes, prices, and return policies in a clothing store',
    aiRole: 'A helpful shop assistant in a clothing store',
    context:
      'You are a shop assistant. Help the customer find the right size, explain the current promotions, and describe the return policy clearly.',
    difficulty: 'A1',
    situationType: 'everyday',
    tags: ['shopping', 'fashion', 'daily-life'],
    phrases: [
      {
        phrase: 'Do you have this in a different size?',
        exampleSentence: 'Do you have this in a larger size?',
        difficulty: 'A1',
      },
      {
        phrase: 'Can I try this on?',
        exampleSentence: 'Can I try this on, please?',
        difficulty: 'A1',
      },
      {
        phrase: "What's your return policy?",
        exampleSentence: "What's your return policy if it doesn't fit?",
        difficulty: 'A2',
      },
    ],
  },
  {
    title: 'Negotiating a Deadline',
    description: 'Professionally negotiate a project deadline with your manager',
    aiRole: 'A direct but fair line manager',
    context:
      'You are a manager who has just requested a deliverable by Friday. The employee will try to negotiate a later deadline. Listen to their reasoning, ask clarifying questions, and reach a compromise.',
    difficulty: 'B2',
    situationType: 'work',
    tags: ['business', 'negotiation', 'professional'],
    phrases: [
      {
        phrase: 'I appreciate the urgency, however',
        exampleSentence:
          'I appreciate the urgency, however I need a couple of extra days to ensure quality.',
        difficulty: 'B2',
      },
      {
        phrase: 'Would it be possible to extend the deadline to',
        exampleSentence: 'Would it be possible to extend the deadline to next Monday?',
        difficulty: 'B2',
      },
      {
        phrase: 'I can deliver a first draft by',
        exampleSentence: 'I can deliver a first draft by Thursday and the final version on Monday.',
        difficulty: 'B2',
      },
    ],
  },
  {
    title: 'Making a Complaint',
    description: 'Politely make a complaint about a product or service',
    aiRole: 'A customer service representative',
    context:
      'You are a customer service agent for an e-commerce company. A customer will call with a complaint about a late or damaged delivery. Apologise, verify the order, and offer a resolution.',
    difficulty: 'A2',
    situationType: 'everyday',
    tags: ['customer-service', 'complaints', 'daily-life'],
    phrases: [
      {
        phrase: "I'm calling about an issue with my order",
        exampleSentence: "I'm calling about an issue with my order number 12345.",
        difficulty: 'A2',
      },
      {
        phrase: 'The item arrived damaged',
        exampleSentence: 'The item arrived damaged — the screen is cracked.',
        difficulty: 'A2',
      },
      {
        phrase: 'I would like a refund / replacement',
        exampleSentence: 'I would like a full refund, please.',
        difficulty: 'A2',
      },
    ],
  },
  {
    title: 'Discussing a News Article',
    description: 'Express and defend opinions about a current news topic',
    aiRole: 'A curious friend who enjoys debating current affairs',
    context:
      'You are discussing a recent news article about climate change with a friend. Offer your own perspective, ask for their opinion, agree or politely disagree, and use evidence to support your points.',
    difficulty: 'B2',
    situationType: 'everyday',
    tags: ['current-affairs', 'discussion', 'opinions'],
    phrases: [
      {
        phrase: 'In my opinion',
        exampleSentence:
          'In my opinion, governments need to act more decisively on carbon emissions.',
        difficulty: 'B1',
      },
      {
        phrase: "I see your point, but I think",
        exampleSentence: "I see your point, but I think renewable energy adoption is accelerating faster than you suggest.",
        difficulty: 'B2',
      },
      {
        phrase: 'What do you think about',
        exampleSentence: 'What do you think about the new carbon tax proposal?',
        difficulty: 'B1',
      },
    ],
  },
  // ── Education ─────────────────────────────────────────────────────────────
  {
    title: 'University Enrollment',
    description: 'Navigate the enrollment process at a university admissions office',
    aiRole: 'A university admissions officer',
    context:
      'You are an admissions officer. A prospective student is inquiring about enrollment, required documents, deadlines, and available programmes. Answer clearly and guide them step by step.',
    difficulty: 'B1',
    situationType: 'education',
    tags: ['university', 'academic', 'enrollment'],
    phrases: [
      { phrase: "I'm interested in applying for", exampleSentence: "I'm interested in applying for the Computer Science programme.", difficulty: 'B1' },
      { phrase: 'What documents do I need to submit?', exampleSentence: 'What documents do I need to submit with my application?', difficulty: 'B1' },
      { phrase: 'What is the application deadline?', exampleSentence: 'What is the application deadline for the autumn intake?', difficulty: 'A2' },
      { phrase: 'Are there any scholarships available?', exampleSentence: 'Are there any scholarships available for international students?', difficulty: 'B1' },
      { phrase: 'Could you send me more information about', exampleSentence: 'Could you send me more information about the tuition fees?', difficulty: 'B1' },
    ],
  },
  {
    title: 'Academic Supervision Meeting',
    description: 'Discuss your research progress with your thesis supervisor',
    aiRole: 'A supportive but demanding university thesis supervisor',
    context:
      'You are a thesis supervisor having a monthly check-in with your postgraduate student. Ask about research progress, literature review, methodology decisions, and next milestones. Give constructive feedback.',
    difficulty: 'C1',
    situationType: 'education',
    tags: ['research', 'academic', 'postgraduate'],
    phrases: [
      { phrase: 'My research is currently focused on', exampleSentence: 'My research is currently focused on natural language processing for low-resource languages.', difficulty: 'C1' },
      { phrase: 'I have been reviewing the literature on', exampleSentence: 'I have been reviewing the literature on transformer architectures.', difficulty: 'C1' },
      { phrase: 'One challenge I am encountering is', exampleSentence: 'One challenge I am encountering is the limited availability of annotated data.', difficulty: 'B2' },
      { phrase: 'I would like your advice on', exampleSentence: 'I would like your advice on choosing between quantitative and qualitative methods.', difficulty: 'B2' },
      { phrase: 'My next milestone is to', exampleSentence: 'My next milestone is to complete the data collection by the end of next month.', difficulty: 'B1' },
    ],
  },
  // ── Technology ────────────────────────────────────────────────────────────
  {
    title: 'Tech Support Call',
    description: 'Report a technical issue and follow troubleshooting instructions',
    aiRole: 'A patient technical support agent for a software company',
    context:
      "You are a tech support agent. A customer is calling about an issue (app won't open, can't log in, data won't sync). Ask diagnostic questions, guide them through steps, and escalate if needed.",
    difficulty: 'A2',
    situationType: 'technology',
    tags: ['IT', 'support', 'troubleshooting'],
    phrases: [
      { phrase: 'My app is not working', exampleSentence: 'My app is not working — it crashes every time I open it.', difficulty: 'A2' },
      { phrase: 'I have already tried', exampleSentence: 'I have already tried restarting the device.', difficulty: 'A2' },
      { phrase: 'Can you walk me through', exampleSentence: 'Can you walk me through the steps to reset my password?', difficulty: 'B1' },
      { phrase: "The error message says", exampleSentence: "The error message says 'Connection timed out'.", difficulty: 'A2' },
      { phrase: 'How long will it take to fix?', exampleSentence: 'How long will it take to fix this issue?', difficulty: 'A2' },
    ],
  },
  {
    title: 'Software Demo Presentation',
    description: 'Present a software product to a potential enterprise client',
    aiRole: 'A sceptical but open-minded potential enterprise client',
    context:
      'You are an enterprise client attending a 30-minute software demo. Ask detailed questions about features, security, integration, pricing, and support. Challenge vague answers.',
    difficulty: 'B2',
    situationType: 'technology',
    tags: ['sales', 'SaaS', 'presentations', 'business'],
    phrases: [
      { phrase: 'Let me walk you through the key features', exampleSentence: 'Let me walk you through the key features of our platform.', difficulty: 'B2' },
      { phrase: 'How does this integrate with', exampleSentence: 'How does this integrate with our existing CRM system?', difficulty: 'B2' },
      { phrase: 'What are your security certifications?', exampleSentence: 'What are your security certifications — do you have SOC 2?', difficulty: 'C1' },
      { phrase: 'Could you give us a ballpark figure for', exampleSentence: 'Could you give us a ballpark figure for the annual licence cost?', difficulty: 'B2' },
      { phrase: 'What does the onboarding process look like?', exampleSentence: 'What does the onboarding process look like for a team of 50 users?', difficulty: 'B1' },
    ],
  },
  // ── Social ────────────────────────────────────────────────────────────────
  {
    title: 'Dinner Party Invitation',
    description: 'Invite a colleague to a dinner party and discuss arrangements',
    aiRole: 'A friendly colleague who would love to attend',
    context:
      'You are a colleague of the learner. They are inviting you to a dinner party. Ask about the date, time, dress code, what to bring, dietary requirements, and how to get there.',
    difficulty: 'A2',
    situationType: 'social',
    tags: ['social', 'invitations', 'daily-life'],
    phrases: [
      { phrase: 'I was wondering if you would like to come to', exampleSentence: 'I was wondering if you would like to come to a small dinner party at my place.', difficulty: 'B1' },
      { phrase: "It's going to be on", exampleSentence: "It's going to be on Saturday the 15th at 7 pm.", difficulty: 'A2' },
      { phrase: 'Feel free to bring', exampleSentence: 'Feel free to bring a bottle of wine if you like.', difficulty: 'A2' },
      { phrase: 'Do you have any dietary requirements?', exampleSentence: 'Do you have any dietary requirements I should know about?', difficulty: 'B1' },
      { phrase: 'I really look forward to seeing you', exampleSentence: 'I really look forward to seeing you there!', difficulty: 'A2' },
    ],
  },
  // ── Travel ────────────────────────────────────────────────────────────────
  {
    title: 'Airport Check-In',
    description: 'Check in for a flight, handle baggage, and get boarding information',
    aiRole: 'An airline check-in agent at an international airport',
    context:
      'You are a check-in agent. Verify the passenger booking, ask about baggage, assign their seat, explain luggage limits, and advise on gate and boarding time.',
    difficulty: 'A2',
    situationType: 'travel',
    tags: ['travel', 'airport', 'flying'],
    phrases: [
      { phrase: "I'm checking in for flight", exampleSentence: "I'm checking in for flight VN123 to London.", difficulty: 'A1' },
      { phrase: 'Could I have a window seat?', exampleSentence: 'Could I have a window seat, please?', difficulty: 'A1' },
      { phrase: 'How many bags can I check in?', exampleSentence: 'How many bags can I check in without extra charge?', difficulty: 'A2' },
      { phrase: 'What time does boarding start?', exampleSentence: 'What time does boarding start and which gate is it?', difficulty: 'A2' },
      { phrase: 'I have a connecting flight to', exampleSentence: 'I have a connecting flight to Paris — will my bag be transferred automatically?', difficulty: 'B1' },
    ],
  },
  {
    title: 'Visa Application Interview',
    description: 'Practise answering a visa consular officer at an embassy',
    aiRole: 'A visa consular officer at an embassy',
    context:
      'You are a consular officer conducting a short visa interview. Ask about the purpose of the visit, duration, accommodation, financial means, ties to the home country, and travel history.',
    difficulty: 'B2',
    situationType: 'travel',
    tags: ['visa', 'travel', 'official'],
    phrases: [
      { phrase: 'The purpose of my visit is to', exampleSentence: 'The purpose of my visit is to attend an academic conference in London.', difficulty: 'B1' },
      { phrase: 'I plan to stay for', exampleSentence: 'I plan to stay for two weeks.', difficulty: 'A2' },
      { phrase: 'I have strong ties to my home country because', exampleSentence: 'I have strong ties to my home country because I own a business there.', difficulty: 'B2' },
      { phrase: 'I have sufficient funds to cover my expenses', exampleSentence: 'I have sufficient funds to cover my expenses — I can provide bank statements.', difficulty: 'B2' },
      { phrase: 'This is my first visit to', exampleSentence: 'This is my first visit to the United Kingdom.', difficulty: 'A2' },
    ],
  },
  // ── Banking ───────────────────────────────────────────────────────────────
  {
    title: 'Opening a Bank Account',
    description: 'Open a personal bank account and understand available services',
    aiRole: 'A bank customer service representative',
    context:
      'You are a bank representative. A new customer wants to open a current account. Explain account types, required documents, fees, online banking features, and debit card setup.',
    difficulty: 'B1',
    situationType: 'banking',
    tags: ['finance', 'banking', 'daily-life'],
    phrases: [
      { phrase: "I'd like to open a bank account", exampleSentence: "I'd like to open a current account, please.", difficulty: 'A2' },
      { phrase: 'What documents do I need?', exampleSentence: 'What documents do I need to bring?', difficulty: 'A2' },
      { phrase: 'Are there any monthly fees?', exampleSentence: 'Are there any monthly fees for this account?', difficulty: 'B1' },
      { phrase: 'How does the online banking work?', exampleSentence: 'How does the online banking work — can I transfer money internationally?', difficulty: 'B1' },
      { phrase: 'How long does it take to get a debit card?', exampleSentence: 'How long does it take to receive a debit card after opening the account?', difficulty: 'A2' },
    ],
  },
  // ── Entertainment ─────────────────────────────────────────────────────────
  {
    title: 'Cinema Ticket Booking',
    description: 'Book cinema tickets and choose seats at the box office',
    aiRole: 'A cinema box-office attendant',
    context:
      'You are a cinema attendant. Help the customer choose a film, select a showing time, pick seats, and pay. Offer any promotions or loyalty programmes.',
    difficulty: 'A1',
    situationType: 'entertain',
    tags: ['leisure', 'cinema', 'daily-life'],
    phrases: [
      { phrase: 'Two tickets for', exampleSentence: 'Two tickets for the 7 pm showing of Interstellar, please.', difficulty: 'A1' },
      { phrase: 'Are there any seats in the middle?', exampleSentence: 'Are there any seats available in the middle of the cinema?', difficulty: 'A1' },
      { phrase: "What's on this weekend?", exampleSentence: "What's on this weekend — any new releases?", difficulty: 'A1' },
      { phrase: 'Do you have a student discount?', exampleSentence: 'Do you have a student discount?', difficulty: 'A2' },
      { phrase: 'What time does it finish?', exampleSentence: 'What time does the film finish?', difficulty: 'A1' },
    ],
  },
  // ── Social (2nd) ──────────────────────────────────────────────────────────
  {
    title: 'Flat-Share Viewing',
    description: 'View a room to rent in a shared flat and ask the right questions',
    aiRole: 'A current tenant showing a room in their shared flat',
    context:
      'You are a tenant in a 3-bedroom flat. A prospective new flatmate has come to view the room. Show them around, explain house rules, bills, and neighbours. Answer their questions honestly.',
    difficulty: 'B1',
    situationType: 'social',
    tags: ['housing', 'renting', 'daily-life'],
    phrases: [
      { phrase: "How much is the rent per month?", exampleSentence: "How much is the rent per month, including bills?", difficulty: 'A2' },
      { phrase: 'Are bills included?', exampleSentence: 'Are bills included in the rent, or do we split them separately?', difficulty: 'B1' },
      { phrase: 'What are the house rules?', exampleSentence: 'What are the house rules about guests and noise?', difficulty: 'A2' },
      { phrase: 'How long is the notice period?', exampleSentence: 'How long is the notice period if I decide to move out?', difficulty: 'B1' },
      { phrase: 'When would the room be available from?', exampleSentence: 'When would the room be available from?', difficulty: 'A2' },
    ],
  },
];

async function main() {
  console.log('Seeding LECA database…');

  // 1. Create admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const adminUser = await prisma.lecaUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      displayName: 'LECA Admin',
      role: 'admin',
      isActive: true,
    },
  });
  console.log(`  Admin user: ${adminUser.email} (${adminUser.id})`);

  // 2. Create General Practice scenario pack
  const pack = await prisma.scenarioPack.upsert({
    where: { slug: 'general-practice' },
    update: {},
    create: {
      name: 'General Practice',
      slug: 'general-practice',
      domain: 'general',
      description: 'Everyday English conversations for all levels — A1 through B2.',
      difficultyMin: 'A1',
      difficultyMax: 'B2',
      isFeatured: true,
    },
  });
  console.log(`  Scenario pack: ${pack.name} (${pack.id})`);

  // 3. Seed scenarios + phrases
  for (const s of SCENARIOS) {
    const existing = await prisma.scenario.findFirst({
      where: { title: s.title, packId: pack.id },
    });

    const scenario = existing
      ? existing
      : await prisma.scenario.create({
          data: {
            packId: pack.id,
            authorId: adminUser.id,
            title: s.title,
            description: s.description,
            aiRole: s.aiRole,
            context: s.context,
            difficulty: s.difficulty,
            situationType: s.situationType,
            tags: s.tags,
            status: 'featured',
          },
        });

    if (!existing) {
      for (let i = 0; i < s.phrases.length; i++) {
        const p = s.phrases[i];
        await prisma.scenarioPhrase.create({
          data: {
            scenarioId: scenario.id,
            phrase: p.phrase,
            exampleSentence: p.exampleSentence,
            difficulty: p.difficulty,
            displayOrder: i,
          },
        });
      }
      console.log(`  Scenario: "${scenario.title}" (${s.difficulty}) — ${s.phrases.length} phrases`);
    } else {
      console.log(`  Scenario: "${scenario.title}" already exists, skipped`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
