import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthGoogleLoginSchema = z.object({ idToken: z.string().min(1) });

export class AuthGoogleLoginDto extends createZodDto(AuthGoogleLoginSchema) {}
