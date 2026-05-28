import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthFacebookLoginSchema = z.object({ accessToken: z.string().min(1) });

export class AuthFacebookLoginDto extends createZodDto(
  AuthFacebookLoginSchema,
) {}
