import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  email: emailSchema.nullable().optional(),
  password: passwordSchema.optional(),
  provider: z.string().optional(),
  socialId: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  photo: z.object({ id: z.string() }).nullable().optional(),
  role: z
    .object({ id: z.union([z.number(), z.string()]) })
    .nullable()
    .optional(),
  status: z.object({ id: z.union([z.number(), z.string()]) }).optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
