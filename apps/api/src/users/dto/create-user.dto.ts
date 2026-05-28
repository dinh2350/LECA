import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: emailSchema.nullable(),
  password: passwordSchema.optional(),
  provider: z.string().optional(),
  socialId: z.string().nullable().optional(),
  firstName: z.string().min(1).nullable(),
  lastName: z.string().min(1).nullable(),
  photo: z.object({ id: z.string() }).nullable().optional(),
  role: z
    .object({ id: z.union([z.number(), z.string()]) })
    .nullable()
    .optional(),
  status: z.object({ id: z.union([z.number(), z.string()]) }).optional(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
