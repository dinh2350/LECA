import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MissedPhraseDto {
  @ApiProperty() phrase: string;
  @ApiProperty() exampleSentence: string;
}

export class SessionSummaryResponseDto {
  @ApiProperty() sessionId: string;
  @ApiPropertyOptional({ nullable: true }) scenarioTitle: string | null;
  @ApiPropertyOptional({ nullable: true }) fluencyScore: number | null;
  @ApiPropertyOptional({ nullable: true }) pronunciationScore: number | null;
  @ApiPropertyOptional({ nullable: true }) vocabularyScore: number | null;
  @ApiPropertyOptional({ nullable: true }) durationSeconds: number | null;
  @ApiProperty() turnCount: number;
  @ApiProperty() speakingMs: number;
  @ApiProperty({ type: [String] }) phrasesUsed: string[];
  @ApiProperty({ type: [MissedPhraseDto] }) phrasesMissed: MissedPhraseDto[];
  @ApiPropertyOptional({ nullable: true }) topPhonemeError: string | null;
  @ApiProperty() phonemeErrorCount: number;
}
