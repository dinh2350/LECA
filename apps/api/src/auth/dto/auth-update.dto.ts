import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthUpdateSchema = z.object({
  photo: z.object({ id: z.string() }).nullable().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  oldPassword: z.string().min(1).optional(),
});

export class AuthUpdateDto extends createZodDto(AuthUpdateSchema) {}
