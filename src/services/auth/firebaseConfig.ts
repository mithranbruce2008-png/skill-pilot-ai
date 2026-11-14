import { getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

export interface FirebaseAuthHandle {
  configured: boolean;
  auth: Auth | null;
  notice: string | null;
}

let cachedHandle: FirebaseAuthHandle | null = null;

/**
 * Safely initializes Firebase Auth if VITE_FIREBASE_* env variables are present.
 * Never throws or crashes when Firebase keys are absent.
 */
export function getFirebaseAuthHandle(): FirebaseAuthHandle {
  if (cachedHandle) return cachedHandle;

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId) {
    cachedHandle = {
      configured: false,
      auth: null,
      notice:
        'Firebase credentials are not configured in this environment. Demo Student and Guest mode remain fully functional.',
    };
    return cachedHandle;
  }

  try {
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({ apiKey, authDomain, projectId, appId });
    const auth = getAuth(app);
    cachedHandle = { configured: true, auth, notice: null };
    return cachedHandle;
  } catch {
    cachedHandle = {
      configured: false,
      auth: null,
      notice:
        'Unable to initialize Firebase Auth. Demo Student and Guest mode remain available.',
    };
    return cachedHandle;
  }
}
