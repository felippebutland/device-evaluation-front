import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

export const anonymousSubmissionSchema = z.object({
  deviceId: z
    .string()
    .min(1, 'Dispositivo é obrigatório'),
  contactName: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  contactEmail: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  contactPhone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(?([0-9]{2})\)?[-\s]?([0-9]{4,5})[-\s]?([0-9]{4})$/, 'Telefone inválido'),
  deviceSerialNumber: z
    .string()
    .min(1, 'Número de série é obrigatório'),
  reportedCondition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged'], {
    required_error: 'Condição é obrigatória'
  }),
  preferredSaleMode: z.enum(['sale', 'exchange'], {
    required_error: 'Modalidade é obrigatória'
  }),
  applicableDamageTypes: z.array(z.string()).default([]),
  userNotes: z.string().optional(),
  batteryPercentage: z
    .union([z.string(), z.number()])
    .transform((val) => val ? Number(val) : 0)
    .refine((val) => val >= 0 && val <= 100, {
      message: 'Porcentagem da bateria deve estar entre 0% e 100%'
    })
    .optional()
});

export const authenticatedSubmissionSchema = z.object({
  deviceId: z
    .string()
    .min(1, 'Dispositivo é obrigatório'),
  deviceSerialNumber: z
    .string()
    .min(1, 'Número de série é obrigatório'),
  reportedCondition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged'], {
    required_error: 'Condição é obrigatória'
  }),
  preferredSaleMode: z.enum(['sale', 'exchange'], {
    required_error: 'Modalidade é obrigatória'
  }),
  applicableDamageTypes: z.array(z.string()).default([]),
  userNotes: z.string().optional(),
  batteryPercentage: z
    .union([z.string(), z.number()])
    .transform((val) => val ? Number(val) : 0)
    .refine((val) => val >= 0 && val <= 100, {
      message: 'Porcentagem da bateria deve estar entre 0% e 100%'
    })
    .optional()
});

export const deviceSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  brand: z
    .string()
    .min(1, 'Marca é obrigatória'),
  model: z
    .string()
    .min(1, 'Modelo é obrigatório'),
  basePrice: z
    .number()
    .min(0.01, 'Preço deve ser maior que zero'),
  specifications: z
    .record(z.string())
    .default({}),
  active: z.boolean().default(true)
});

export const damageTypeSchema = z.object({
  deviceId: z
    .string()
    .min(1, 'Dispositivo é obrigatório'),
  name: z
    .string()
    .min(1, 'Nome é obrigatório'),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória'),
  discountType: z.enum(['percentage', 'fixed'], {
    required_error: 'Tipo de desconto é obrigatório'
  }),
  discountValue: z
    .number()
    .min(0.01, 'Valor do desconto deve ser maior que zero'),
  active: z.boolean().default(true)
});

export const pricingPolicySchema = z.object({
  deviceId: z.string().optional(),
  saleMode: z.enum(['sale', 'exchange'], {
    required_error: 'Modalidade é obrigatória'
  }),
  paymentDays: z
    .number()
    .min(1, 'Dias de pagamento deve ser maior que zero'),
  discountAmount: z
    .number()
    .min(0, 'Desconto não pode ser negativo'),
  isGlobal: z.boolean().default(false),
  active: z.boolean().default(true)
});

export const evaluationSchema = z.object({
  submissionId: z
    .string()
    .min(1, 'Submissão é obrigatória'),
  actualCondition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged'], {
    required_error: 'Condição real é obrigatória'
  }),
  identifiedDamages: z.array(z.string()).default([]),
  finalPrice: z
    .number()
    .min(0, 'Preço final não pode ser negativo'),
  adminNotes: z.string().optional(),
  status: z.enum(['approved', 'rejected'], {
    required_error: 'Status é obrigatório'
  })
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type AnonymousSubmissionForm = z.infer<typeof anonymousSubmissionSchema>;
export type AuthenticatedSubmissionForm = z.infer<typeof authenticatedSubmissionSchema>;
export type DeviceForm = z.infer<typeof deviceSchema>;
export type DamageTypeForm = z.infer<typeof damageTypeSchema>;
export type PricingPolicyForm = z.infer<typeof pricingPolicySchema>;
export type EvaluationForm = z.infer<typeof evaluationSchema>;
