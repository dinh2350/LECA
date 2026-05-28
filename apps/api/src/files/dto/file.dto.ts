import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FileDtoSchema = z.object({
  id: z.string(),
  path: z.string().optional(),
});

export class FileDto extends createZodDto(FileDtoSchema) {}
