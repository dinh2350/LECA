import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const jsonPreprocess = (val: unknown) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

const FilterUserSchema = z.object({
  roles: z
    .array(z.object({ id: z.union([z.number(), z.string()]) }))
    .nullable()
    .optional(),
});

const SortUserSchema = z.object({
  orderBy: z.string(),
  order: z.enum(['ASC', 'DESC']),
});

const QueryUserSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  filters: z.preprocess(jsonPreprocess, FilterUserSchema).nullable().optional(),
  sort: z
    .preprocess(jsonPreprocess, z.array(SortUserSchema))
    .nullable()
    .optional(),
});

export class FilterUserDto extends createZodDto(FilterUserSchema) {}
export class SortUserDto extends createZodDto(SortUserSchema) {}
export class QueryUserDto extends createZodDto(QueryUserSchema) {}
