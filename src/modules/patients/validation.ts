import { z } from 'zod';

export const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

export const createPatientSchema = z.object({
  mr_number: z
    .string()
    .trim()
    .min(3, 'MR number must be at least 3 characters.')
    .max(50, 'MR number cannot exceed 50 characters.')
    .regex(
      /^[A-Za-z0-9\-_/]+$/,
      'MR number may only contain letters, numbers, hyphens, underscores, and forward slashes.',
    ),
  full_name: z
    .string()
    .trim()
    .min(2, 'Patient full name must be at least 2 characters.')
    .max(150, 'Patient full name cannot exceed 150 characters.'),
  father_name: z
    .string()
    .trim()
    .max(150, 'Father/Guardian name cannot exceed 150 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
  cnic: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      (val) => !val || val === '' || cnicRegex.test(val),
      'CNIC must follow the 13-digit format: 00000-0000000-0.',
    ),
  date_of_birth: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      const parsed = new Date(val);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    }, 'Date of birth cannot be in the future.'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select a valid gender option.',
  }),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number cannot exceed 30 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, 'Address cannot exceed 500 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const updatePatientSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Patient full name must be at least 2 characters.')
    .max(150, 'Patient full name cannot exceed 150 characters.')
    .optional(),
  father_name: z
    .string()
    .trim()
    .max(150, 'Father/Guardian name cannot exceed 150 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
  cnic: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      (val) => !val || val === '' || cnicRegex.test(val),
      'CNIC must follow the 13-digit format: 00000-0000000-0.',
    ),
  date_of_birth: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      const parsed = new Date(val);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    }, 'Date of birth cannot be in the future.'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number cannot exceed 30 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, 'Address cannot exceed 500 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type CreatePatientSchema = z.infer<typeof createPatientSchema>;
export type UpdatePatientSchema = z.infer<typeof updatePatientSchema>;
