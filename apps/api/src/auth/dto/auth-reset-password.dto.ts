import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthResetPasswordSchema = z.object({
  password: passwordSchema,
  hash: z.string().min(1),
});

export class AuthResetPasswordDto extends createZodDto(
  AuthResetPasswordSchema,
) {}
