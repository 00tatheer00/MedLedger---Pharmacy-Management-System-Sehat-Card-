import { z } from 'zod';

export const createPrescriptionItemSchema = z.object({
  medicine_id: z.string().trim().min(1, 'Medicine selection is required.'),
  prescribed_quantity: z
    .number({ message: 'Prescribed quantity must be a valid number.' })
    .int('Prescribed quantity must be an integer.')
    .positive('Prescribed quantity must be greater than zero.'),
  dosage_instructions: z
    .string()
    .trim()
    .max(255, 'Dosage instructions cannot exceed 255 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(255, 'Notes cannot exceed 255 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const createPrescriptionSchema = z.object({
  prescription_number: z
    .string()
    .trim()
    .min(3, 'Prescription number must be at least 3 characters.')
    .max(50, 'Prescription number cannot exceed 50 characters.')
    .regex(
      /^[A-Za-z0-9\-_/]+$/,
      'Prescription number may only contain alphanumeric characters, hyphens, and slashes.',
    ),
  patient_id: z.string().trim().min(1, 'Patient selection is required.'),
  admission_id: z.string().trim().optional().nullable().or(z.literal('')),
  prescriber_name: z
    .string()
    .trim()
    .min(2, 'Prescriber doctor name must be at least 2 characters.')
    .max(150, 'Prescriber doctor name cannot exceed 150 characters.'),
  prescription_date: z.string().refine((val) => {
    const parsed = new Date(val);
    return !isNaN(parsed.getTime());
  }, 'Valid prescription date is required.'),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),
  items: z
    .array(createPrescriptionItemSchema)
    .min(1, 'At least one medicine item must be prescribed.'),
});

export type CreatePrescriptionItemSchema = z.infer<typeof createPrescriptionItemSchema>;
export type CreatePrescriptionSchema = z.infer<typeof createPrescriptionSchema>;
