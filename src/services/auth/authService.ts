import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  SessionSchema,
  sanitizeInput,
  type UserRole,
  type UserSession,
} from '../../schemas/authSchemas';
import { useAppStore } from '../../store/useAppStore';
import { getFirebaseAuthHandle } from './firebaseConfig';
import type { AuthResult, AuthService } from './types';

const SESSION_KEY = 'skillpilot_session_v1';

interface LocalPreviewUser {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

const localPreviewAccounts = new Map<string, LocalPreviewUser>([
  [
    'student@skillpilot.edu',
    {
      email: 'student@skillpilot.edu',
      password: 'SkillPilot1!',
      displayName: 'Alex Rivera',
      role: 'Student',
    },
  ],
]);

function saveMinimalSession(session: UserSession, rememberMe: boolean): void {
  const safeSession: UserSession = {
    uid: session.uid,
    displayName: sanitizeInput(session.displayName, 80) || 'Learner',
    role: session.role,
    isDemo: session.isDemo,
    isGuest: session.isGuest,
  };
  useAppStore.getState().setSession(safeSession);
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(safeSession);
    if (rememberMe) {
      window.localStorage.setItem(SESSION_KEY, serialized);
      window.sessionStorage.removeItem(SESSION_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_KEY, serialized);
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

function clearStoredSession(): void {
  useAppStore.getState().clearSession();
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
}

function readStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.sessionStorage.getItem(SESSION_KEY) ??
      window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = SessionSchema.safeParse(parsed);
    if (!result.success) {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

function extractFirebaseCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return '';
}

/**
 * Unified AuthService abstracting Firebase Auth, Guest mode, and Demo Student login.
 */
export const authService: AuthService = {
  isFirebaseConfigured: () => getFirebaseAuthHandle().configured,

  getSession: () => {
    const inStore = useAppStore.getState().session;
    if (inStore) return inStore;
    const stored = readStoredSession();
    if (stored) {
      useAppStore.getState().setSession(stored);
      if (stored.isDemo) {
        useAppStore.getState().loadDemoStudent();
      }
    }
    return stored;
  },

  loginWithEmail: async (email, password, rememberMe): Promise<AuthResult> => {
    const cleanEmail = sanitizeInput(email, 120).toLowerCase();
    const { configured, auth } = getFirebaseAuthHandle();

    if (!configured || !auth) {
      const match = localPreviewAccounts.get(cleanEmail);
      if (!match || match.password !== password) {
        return {
          ok: false,
          errorCode: 'invalid-credentials',
          errorMessage: 'Email or password is incorrect',
        };
      }
      const session: UserSession = {
        uid: `local-${cleanEmail}`,
        displayName: match.displayName,
        role: match.role,
        isDemo: false,
        isGuest: false,
      };
      saveMinimalSession(session, rememberMe);
      return { ok: true, session };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const session: UserSession = {
        uid: cred.user.uid,
        displayName: cred.user.displayName || cleanEmail.split('@')[0] || 'Learner',
        role: 'Student',
        isDemo: false,
        isGuest: false,
      };
      saveMinimalSession(session, rememberMe);
      return { ok: true, session };
    } catch (err) {
      const code = extractFirebaseCode(err);
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-email'
      ) {
        return {
          ok: false,
          errorCode: 'invalid-credentials',
          errorMessage: 'Email or password is incorrect',
        };
      }
      return {
        ok: false,
        errorCode: 'network-error',
        errorMessage: 'Unable to sign in right now. Please check your connection or try Demo Student.',
      };
    }
  },

  signupWithEmail: async (fullName, role, email, password): Promise<AuthResult> => {
    const cleanName = sanitizeInput(fullName, 80);
    const cleanEmail = sanitizeInput(email, 120).toLowerCase();
    const { configured, auth } = getFirebaseAuthHandle();

    if (!configured || !auth) {
      localPreviewAccounts.set(cleanEmail, {
        email: cleanEmail,
        password,
        displayName: cleanName,
        role,
      });
      const session: UserSession = {
        uid: `local-${Date.now()}`,
        displayName: cleanName,
        role,
        isDemo: false,
        isGuest: false,
      };
      saveMinimalSession(session, false);
      return { ok: true, session };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanName });
      const session: UserSession = {
        uid: cred.user.uid,
        displayName: cleanName,
        role,
        isDemo: false,
        isGuest: false,
      };
      saveMinimalSession(session, false);
      return { ok: true, session };
    } catch (err) {
      const code = extractFirebaseCode(err);
      if (code === 'auth/email-already-in-use') {
        return {
          ok: false,
          errorCode: 'email-in-use',
          errorMessage: 'An account with this email already exists.',
        };
      }
      return {
        ok: false,
        errorCode: 'unknown',
        errorMessage: 'Could not complete registration. Please try again.',
      };
    }
  },

  loginWithGoogle: async (rememberMe): Promise<AuthResult> => {
    const { configured, auth } = getFirebaseAuthHandle();
    if (!configured || !auth) {
      return {
        ok: false,
        errorCode: 'firebase-unconfigured',
        errorMessage:
          'Google Sign-In requires Firebase configuration (VITE_FIREBASE_*). Use Demo Student or Continue as guest instead.',
      };
    }

    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const session: UserSession = {
        uid: cred.user.uid,
        displayName: cred.user.displayName || 'Google Learner',
        role: 'Student',
        isDemo: false,
        isGuest: false,
      };
      saveMinimalSession(session, rememberMe);
      return { ok: true, session };
    } catch (err) {
      const code = extractFirebaseCode(err);
      if (code === 'auth/popup-blocked') {
        return {
          ok: false,
          errorCode: 'popup-blocked',
          errorMessage:
            'Sign-in popup was blocked by your browser. Allow popups for this site and click Retry.',
        };
      }
      return {
        ok: false,
        errorCode: 'unknown',
        errorMessage: 'Google sign-in did not complete. Please retry or continue as guest.',
      };
    }
  },

  loginAsGuest: async (): Promise<AuthResult> => {
    const { configured, auth } = getFirebaseAuthHandle();
    if (configured && auth) {
      try {
        const cred = await signInAnonymously(auth);
        const session: UserSession = {
          uid: cred.user.uid,
          displayName: 'Guest Explorer',
          role: 'Student',
          isDemo: false,
          isGuest: true,
        };
        saveMinimalSession(session, false);
        return { ok: true, session };
      } catch {
        // Fall through to offline guest session
      }
    }
    const session: UserSession = {
      uid: `guest-${Date.now()}`,
      displayName: 'Guest Explorer',
      role: 'Student',
      isDemo: false,
      isGuest: true,
    };
    saveMinimalSession(session, false);
    return { ok: true, session };
  },

  loginAsDemoStudent: async (): Promise<AuthResult> => {
    useAppStore.getState().loadDemoStudent();
    const session: UserSession = {
      uid: 'demo-alex-rivera',
      displayName: 'Alex Rivera (Demo)',
      role: 'Student',
      isDemo: true,
      isGuest: false,
    };
    saveMinimalSession(session, false);
    return { ok: true, session };
  },

  sendPasswordReset: async (email) => {
    const cleanEmail = sanitizeInput(email, 120).toLowerCase();
    const { configured, auth } = getFirebaseAuthHandle();
    if (!configured || !auth) {
      return {
        ok: true,
        message:
          'Password reset simulated in offline mode. In production with Firebase configured, a reset email is sent to ' +
          cleanEmail +
          '.',
      };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        ok: true,
        message: `If an account exists for ${cleanEmail}, a password reset link has been sent.`,
      };
    } catch {
      return {
        ok: true,
        message: `If an account exists for ${cleanEmail}, a password reset link has been sent.`,
      };
    }
  },

  logout: async () => {
    const { configured, auth } = getFirebaseAuthHandle();
    if (configured && auth) {
      try {
        await signOut(auth);
      } catch {
        // Proceed with local session clear
      }
    }
    clearStoredSession();
  },
};
