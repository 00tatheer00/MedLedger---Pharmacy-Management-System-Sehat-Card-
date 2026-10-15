import { z } from 'zod';

export const createAdmissionSchema = z
  .object({
    patient_id: z.string().trim().min(1, 'Patient selection is required.'),
    admission_number: z
      .string()
      .trim()
      .min(3, 'Admission number must be at least 3 characters.')
      .max(50, 'Admission number cannot exceed 50 characters.')
      .regex(
        /^[A-Za-z0-9\-_/]+$/,
        'Admission number may only contain letters, numbers, hyphens, and slashes.',
      ),
    ssp_visit_no: z
      .string()
      .trim()
      .max(50, 'SSP Visit number cannot exceed 50 characters.')
      .optional()
      .nullable()
      .or(z.literal('')),
    admission_date: z.string().refine((val) => {
      const parsed = new Date(val);
      return !isNaN(parsed.getTime());
    }, 'Valid admission date and time is required.'),
    ward: z
      .string()
      .trim()
      .min(2, 'Ward or department is required.')
      .max(100, 'Ward cannot exceed 100 characters.'),
    bed_number: z
      .string()
      .trim()
      .max(30, 'Bed number cannot exceed 30 characters.')
      .optional()
      .nullable()
      .or(z.literal('')),
    attending_doctor: z
      .string()
      .trim()
      .max(150, 'Attending doctor name cannot exceed 150 characters.')
      .optional()
      .nullable()
      .or(z.literal('')),
    status: z.enum(['admitted', 'discharged', 'transferred', 'cancelled']).default('admitted'),
    discharge_date: z.string().optional().nullable().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.discharge_date || data.discharge_date === '') return true;
      const adm = new Date(data.admission_date);
      const dis = new Date(data.discharge_date);
      return dis >= adm;
    },
    {
      message: 'Discharge date cannot be earlier than admission date.',
      path: ['discharge_date'],
    },
  );

export const dischargeAdmissionSchema = z.object({
  discharge_date: z.string().refine((val) => {
    const parsed = new Date(val);
    return !isNaN(parsed.getTime());
  }, 'Valid discharge date and time is required.'),
  status: z.enum(['discharged', 'transferred']).default('discharged'),
});

export type CreateAdmissionSchema = z.infer<typeof createAdmissionSchema>;
export type DischargeAdmissionSchema = z.infer<typeof dischargeAdmissionSchema>;
