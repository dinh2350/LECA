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
