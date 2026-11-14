import type { UserRole, UserSession } from '../../schemas/authSchemas';

export interface AuthResult {
  ok: boolean;
  session?: UserSession;
  errorCode?:
    | 'invalid-credentials'
    | 'popup-blocked'
    | 'firebase-unconfigured'
    | 'network-error'
    | 'email-in-use'
    | 'unknown';
  errorMessage?: string;
}

export interface AuthService {
  isFirebaseConfigured: () => boolean;
  getSession: () => UserSession | null;
  loginWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<AuthResult>;
  signupWithEmail: (
    fullName: string,
    role: UserRole,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  loginWithGoogle: (rememberMe: boolean) => Promise<AuthResult>;
  loginAsGuest: () => Promise<AuthResult>;
  loginAsDemoStudent: () => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
}
