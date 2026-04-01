export const API_BASE_URL = 'https://api-device.usestarshield.com/api/v1'

export const STORAGE_KEYS = {
  TOKEN: 'devicehub_token',
  USER: 'devicehub_user',
  THEME: 'devicehub_theme',
  SESSION_EXPIRY: 'devicehub_session_expiry'
} as const;

export const SESSION_DURATION_MS = 6 * 60 * 60 * 1000; // 6 horas

export const DEVICE_CONDITIONS = [
  { value: 'excellent', label: 'Excelente', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: 'Boa', color: 'bg-blue-100 text-blue-800' },
  { value: 'fair', label: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'poor', label: 'Ruim', color: 'bg-orange-100 text-orange-800' },
  { value: 'damaged', label: 'Danificado', color: 'bg-red-100 text-red-800' }
] as const;

export const SALE_MODES = [
  { value: 'sale', label: 'Venda', description: 'Processo de venda do dispositivo' },
  { value: 'exchange', label: 'Troca', description: 'Troca por outro dispositivo' }
] as const;

export const SUBMISSION_STATUSES = [
  { value: 'pending', label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
  { value: 'under_evaluation', label: 'Em Avaliação', color: 'bg-blue-100 text-blue-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejeitado', color: 'bg-red-100 text-red-800' }
] as const;

export const SALE_PRICING_OPTIONS = [
  { days: 7, discount: 250, label: '7 dias (desconto R$ 250)' },
  { days: 10, discount: 100, label: '10 dias (desconto R$ 100)' },
  { days: 30, discount: 0, label: '30 dias (valor integral)' }
] as const;

export const ROUTES = {
  HOME: '/',
  CATALOG: '/catalog',
  DEVICE_DETAIL: '/device',
  TRACK: '/track',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MY_SUBMISSIONS: '/my-submissions',
  SUBMIT_DEVICE: '/submit-device',
  ADMIN: '/admin',
  ADMIN_DEVICES: '/admin/devices',
  ADMIN_EVALUATIONS: '/admin/evaluations',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings'
} as const;

export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  ADMIN_LIMIT: 20
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  EMAIL_INVALID: 'Email inválido',
  PASSWORD_MIN: 'Senha deve ter pelo menos 6 caracteres',
  PASSWORD_MATCH: 'Senhas não coincidem',
  PHONE_INVALID: 'Telefone inválido',
  PRICE_MIN: 'Preço deve ser maior que zero'
} as const;
