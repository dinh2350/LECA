import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    description: 'Title of the scenario practiced, if applicable',
  })
  scenarioTitle?: string;

  @ApiPropertyOptional({
    description: 'Fluency score 0–100, null if not computed',
  })
  fluencyScore?: number;

  @ApiPropertyOptional({
    description: 'Pronunciation score 0–100, null if not computed',
  })
  pronunciationScore?: number;

  @ApiPropertyOptional({
    description: 'Vocabulary score 0–100, null if not computed',
  })
  vocabularyScore?: number;

  @ApiPropertyOptional({ description: 'Total session duration in seconds' })
  durationSeconds?: number;

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

  @ApiPropertyOptional({
    description: 'IPA symbol of the most frequently mispronounced phoneme',
  })
  topPhonemeError?: string;

  @ApiProperty({
    description: 'Number of times the top phoneme was mispronounced',
  })
  phonemeErrorCount: number;
}
