import { z } from 'zod';

export const emailSchema = z.string().email().transform((v) => v.toLowerCase());
export const passwordSchema = z.string().min(6);
