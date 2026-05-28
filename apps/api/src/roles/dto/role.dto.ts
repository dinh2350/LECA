import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RoleDtoSchema = z.object({
  id: z.union([z.number(), z.string()]),
});

export class RoleDto extends createZodDto(RoleDtoSchema) {}
