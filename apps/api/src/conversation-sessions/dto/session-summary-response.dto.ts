import { ApiProperty } from '@nestjs/swagger';

export class MissedPhraseDto {
  @ApiProperty({ description: 'The key phrase from the scenario' })
  phrase: string;

  @ApiProperty({
    description: 'Example sentence demonstrating the phrase in context',
  })
  exampleSentence: string;
}

export class SessionSummaryResponseDto {
  @ApiProperty({ description: 'UUID of the conversation session' })
  sessionId: string;

  @ApiProperty({
    nullable: true,
    description: 'Title of the scenario practiced, if applicable',
  })
  scenarioTitle: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Fluency score 0–100, null if not computed',
  })
  fluencyScore: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Pronunciation score 0–100, null if not computed',
  })
  pronunciationScore: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Vocabulary score 0–100, null if not computed',
  })
  vocabularyScore: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Total session duration in seconds',
  })
  durationSeconds: number | null;

  @ApiProperty({ description: 'Number of learner turns in the session' })
  turnCount: number;

  @ApiProperty({ description: 'Total learner speaking time in milliseconds' })
  speakingMs: number;

  @ApiProperty({
    type: [String],
    description: 'Scenario phrases the learner used naturally',
  })
  phrasesUsed: string[];

  @ApiProperty({
    type: [MissedPhraseDto],
    description: 'Up to 3 scenario phrases the learner did not use',
  })
  phrasesMissed: MissedPhraseDto[];

  @ApiProperty({
    nullable: true,
    description: 'IPA symbol of the most frequently mispronounced phoneme',
  })
  topPhonemeError: string | null;

  @ApiProperty({
    description: 'Number of times the top phoneme was mispronounced',
  })
  phonemeErrorCount: number;
}
