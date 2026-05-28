import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthConfirmEmailSchema = z.object({ hash: z.string().min(1) });

export class AuthConfirmEmailDto extends createZodDto(AuthConfirmEmailSchema) {}
