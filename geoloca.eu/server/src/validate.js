import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must include a letter.')
    .regex(/[0-9]/, 'Password must include a number.'),
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export const googleSchema = z.object({
  credential: z.string().min(20).max(10000),
});
