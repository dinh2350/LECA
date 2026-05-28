import { createZodDto } from 'nestjs-zod';
import { emailSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthEmailLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export class AuthEmailLoginDto extends createZodDto(AuthEmailLoginSchema) {}
