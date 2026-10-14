import { z } from 'zod';

export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Vial',
  'Ampoule',
  'Injection',
  'Ointment',
  'Cream',
  'Eye Drops',
  'Ear Drops',
  'Inhaler',
  'Infusion',
  'Sachet',
  'Suppository',
] as const;

export const UNITS_OF_MEASURE = [
  'Tablet',
  'Capsule',
  'Bottle',
  'Vial',
  'Ampoule',
  'Box',
  'Tube',
  'Sachet',
  'Piece',
  'Pack',
] as const;

export const THERAPEUTIC_CATEGORIES = [
  'Antibiotics & Antimicrobials',
  'Analgesics & Anti-inflammatory',
  'Cardiovascular & Antihypertensives',
  'Diabetes & Endocrine',
  'Gastrointestinal',
  'Respiratory',
  'Central Nervous System',
  'Emergency & Resuscitation',
  'Dermatological',
  'Ophthalmology',
  'Obstetrics & Gynecology',
  'Vitamins & Minerals',
  'Other',
] as const;

export const createMedicineSchema = z.object({
  item_code: z
    .string()
    .trim()
    .max(50, 'Item code must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  name: z
    .string({ message: 'Medicine brand or proprietary name is required' })
    .trim()
    .min(2, 'Medicine name must be at least 2 characters')
    .max(200, 'Medicine name must not exceed 200 characters'),
  generic_name: z
    .string({ message: 'Active pharmaceutical ingredient / generic name is required' })
    .trim()
    .min(2, 'Generic name must be at least 2 characters')
    .max(200, 'Generic name must not exceed 200 characters'),
  dosage_form: z
    .string({ message: 'Dosage form is required' })
    .trim()
    .min(2, 'Please select or specify a valid dosage form'),
  strength: z
    .string({ message: 'Medicine strength is required (e.g. 500mg, 1g, 250mg/5ml)' })
    .trim()
    .min(1, 'Strength is required')
    .max(50, 'Strength must not exceed 50 characters'),
  unit_of_measure: z
    .string({ message: 'Unit of measure is required' })
    .trim()
    .min(2, 'Unit of measure is required'),
  category: z
    .string({ message: 'Therapeutic category is required' })
    .trim()
    .min(2, 'Please select a therapeutic category'),
  min_threshold: z
    .number({ message: 'Minimum stock alert threshold must be a number' })
    .int('Threshold must be an integer')
    .min(0, 'Minimum threshold cannot be negative')
    .default(20),
  is_active: z.boolean().default(true),
});

export const updateMedicineSchema = createMedicineSchema.partial();

export const medicineFilterSchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  dosage_form: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  stock_status: z
    .enum(['all', 'in_stock', 'low_stock', 'out_of_stock', 'expired'])
    .optional()
    .default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
