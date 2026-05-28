import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const StatusDtoSchema = z.object({
  id: z.union([z.number(), z.string()]),
});

export class StatusDto extends createZodDto(StatusDtoSchema) {}
