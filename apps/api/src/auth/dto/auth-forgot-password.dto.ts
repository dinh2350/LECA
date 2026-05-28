import { createZodDto } from 'nestjs-zod';
import { emailSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthForgotPasswordSchema = z.object({ email: emailSchema });

export class AuthForgotPasswordDto extends createZodDto(
  AuthForgotPasswordSchema,
) {}
