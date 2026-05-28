import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthRegisterLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export class AuthRegisterLoginDto extends createZodDto(
  AuthRegisterLoginSchema,
) {}
