import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScenarioPhraseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phrase: string;

  @ApiProperty()
  exampleSentence: string;

  @ApiPropertyOptional()
  audioUrl?: string | null;

  @ApiPropertyOptional()
  difficulty?: string | null;

  @ApiProperty()
  displayOrder: number;
}

export class ScenarioListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ description: 'CEFR level: A1–C2' })
  difficulty: string;

  @ApiProperty({ enum: ['everyday', 'work'] })
  situationType: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional({ description: '1.00–5.00 average rating' })
  ratingAvg?: number | null;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty()
  useCount: number;

  @ApiPropertyOptional({ description: "Author's display name" })
  authorName?: string | null;
}

export class ScenarioDetailDto extends ScenarioListItemDto {
  @ApiProperty()
  aiRole: string;

  @ApiProperty()
  context: string;

  @ApiPropertyOptional()
  openingLine?: string | null;

  @ApiProperty({ type: [ScenarioPhraseDto] })
  phrases: ScenarioPhraseDto[];
}

export class ScenarioListResponseDto {
  @ApiProperty({ type: [ScenarioListItemDto] })
  data: ScenarioListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
