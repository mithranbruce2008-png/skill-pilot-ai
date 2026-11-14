import { z } from 'zod';

export const UserRoleSchema = z.enum(['Student', 'Employee', 'Admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Strips HTML-unsafe characters and trims overly long inputs.
 */
export function sanitizeInput(value: string, maxLength = 120): string {
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

/**
 * Sanitizes labels rendered in 3D DOM overlays.
 */
export function sanitizeLabel(label: string): string {
  return label.replace(/[<>&"']/g, '').slice(0, 64);
}

export const LoginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(120, 'Email must be 120 characters or fewer')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be 128 characters or fewer'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const SignupFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(80, 'Full name must be 80 characters or fewer'),
    role: UserRoleSchema,
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .max(120, 'Email must be 120 characters or fewer')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof SignupFormSchema>;

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

export const SessionSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().min(1),
  role: UserRoleSchema,
  isDemo: z.boolean(),
  isGuest: z.boolean(),
});

export type UserSession = z.infer<typeof SessionSchema>;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  hasMinLength: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

/**
 * Evaluates password strength with both a numeric score and accessible text criteria.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const checks = [hasMinLength, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  const score = (password.length === 0 ? 0 : Math.max(1, Math.min(4, checks))) as 0 | 1 | 2 | 3 | 4;
  const labels: Record<0 | 1 | 2 | 3 | 4, PasswordStrength['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };

  return {
    score,
    label: labels[score],
    hasMinLength,
    hasUpper,
    hasNumber,
    hasSymbol,
  };
}
