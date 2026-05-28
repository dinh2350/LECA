import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { selectIdType } from '../../database/select-persistence-module';

// <database-block>
const idType = selectIdType();
// </database-block>

export class Role {
  @Allow()
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @Allow()
  @ApiProperty({
    type: String,
    example: 'admin',
    required: false,
    nullable: true,
  })
  name?: string | null;
}
