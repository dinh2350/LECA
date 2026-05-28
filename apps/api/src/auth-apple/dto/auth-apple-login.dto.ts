import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthAppleLoginSchema = z.object({
  idToken: z.string().min(1),
  firstName: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  lastName: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === null ? undefined : v)),
});

export class AuthAppleLoginDto extends createZodDto(AuthAppleLoginSchema) {}
