// apps/api/src/conversation-sessions/dto/phoneme-errors-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { WordPairDto, PHONEME_WORD_PAIRS } from '../phoneme-word-pairs.const';

export { WordPairDto, PHONEME_WORD_PAIRS };

export class PhonemeErrorsResponseDto {
  @ApiProperty({
    nullable: true,
    description: 'IPA symbol of the most frequently mispronounced phoneme',
  })
  topPhoneme: string | null;

  @ApiProperty({
    description:
      'Number of times the top phoneme was mispronounced (0 if none)',
  })
  errorCount: number;

  @ApiProperty({
    type: [WordPairDto],
    description: 'Word pairs for the minimal pair drill',
  })
  wordPairs: WordPairDto[];
}
