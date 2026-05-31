export interface AssessmentPrompt {
  index: number;
  text: string;
  aiFollowUp: string;
}

export const ASSESSMENT_PROMPTS: AssessmentPrompt[] = [
  {
    index: 0,

    text: 'Please introduce yourself. Tell me your name and what you do for work.',
    aiFollowUp: 'Nice to meet you! That sounds interesting.',
  },
  {
    index: 1,
    text: 'Describe your daily routine at work. What tasks do you usually do each day?',
    aiFollowUp: 'It sounds like you have a busy day!',
  },
  {
    index: 2,
    text: 'Tell me about a challenge you faced at work recently and how you handled it.',
    aiFollowUp:
      'That must have been difficult. How did you feel about the outcome?',
  },
  {
    index: 3,
    text: 'If you could improve one aspect of how English is taught in your country, what would it be and why?',
    aiFollowUp: "That's a thoughtful perspective.",
  },
  {
    index: 4,
    text: 'Describe a complex decision you made recently. What factors did you weigh, and what was the result?',
    aiFollowUp:
      'Thank you for sharing that — it takes real reflection to analyse decisions like that.',
  },
];

export const TOTAL_PROMPTS = ASSESSMENT_PROMPTS.length; // 5
