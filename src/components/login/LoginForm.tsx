import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, AlertCircle, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
import { useLockout } from '../../hooks/useLockout';
import {
  ForgotPasswordSchema,
  LoginFormSchema,
  SignupFormSchema,
  evaluatePasswordStrength,
  type UserRole,
} from '../../schemas/authSchemas';
import { authService } from '../../services/auth/authService';
import { getFirebaseAuthHandle } from '../../services/auth/firebaseConfig';
import { useThemeStore } from '../../theme/useThemeStore';

interface LoginFormProps {
  onEmailFocusChange: (focused: boolean) => void;
  onPasswordFocusChange: (focused: boolean) => void;
  onInvalidAttempt: () => void;
  onAuthSuccess: () => void;
}

type AuthTab = 'login' | 'signup';

/**
 * Accessible Log in / Sign up glass card with Zod validation, strength meter, lockout backoff, and demo/guest actions.
 */
export function LoginForm({
  onEmailFocusChange,
  onPasswordFocusChange,
  onInvalidAttempt,
  onAuthSuccess,
}: LoginFormProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const {
    isLocked,
    remainingSeconds,
    announcement,
    recordFailure,
    resetLockout,
  } = useLockout();

  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);

  const firebaseNotice = getFirebaseAuthHandle().notice;
  const strength = evaluatePasswordStrength(password);

  const triggerInvalidFeedback = (message: string) => {
    setFormError(message);
    setShakeKey((k) => k + 1);
    onInvalidAttempt();
  };

  const handleTabSwitch = (nextTab: AuthTab) => {
    setTab(nextTab);
    setFieldErrors({});
    setFormError(null);
    setPopupBlocked(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLocked) return;

    setFieldErrors({});
    setFormError(null);
    setPopupBlocked(false);

    const parsed = LoginFormSchema.safeParse({ email, password, rememberMe });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'form');
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      triggerInvalidFeedback('Please fix the highlighted fields before signing in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.loginWithEmail(
        parsed.data.email,
        parsed.data.password,
        parsed.data.rememberMe,
      );
      if (res.ok) {
        resetLockout();
        onAuthSuccess();
      } else {
        const lockState = recordFailure();
        if (lockState.lockedNow) {
          triggerInvalidFeedback(
            `Too many failed attempts. Form locked for ${lockState.duration} seconds.`,
          );
        } else {
          triggerInvalidFeedback(res.errorMessage ?? 'Email or password is incorrect');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldErrors({});
    setFormError(null);

    const parsed = SignupFormSchema.safeParse({
      fullName,
      role,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'form');
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      triggerInvalidFeedback('Please correct the highlighted registration fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.signupWithEmail(
        parsed.data.fullName,
        parsed.data.role,
        parsed.data.email,
        parsed.data.password,
      );
      if (res.ok) {
        onAuthSuccess();
      } else {
        triggerInvalidFeedback(res.errorMessage ?? 'Unable to create account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setFormError(null);
    setPopupBlocked(false);
    setIsSubmitting(true);
    try {
      const res = await authService.loginWithGoogle(rememberMe);
      if (res.ok) {
        onAuthSuccess();
      } else {
        if (res.errorCode === 'popup-blocked') {
          setPopupBlocked(true);
        }
        setFormError(res.errorMessage ?? 'Google sign-in could not complete.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await authService.loginAsGuest();
      if (res.ok) onAuthSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoStudent = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await authService.loginAsDemoStudent();
      if (res.ok) onAuthSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ForgotPasswordSchema.safeParse({ email: resetEmail });
    if (!parsed.success) {
      setResetMessage(parsed.error.issues[0]?.message ?? 'Enter a valid email');
      return;
    }
    const res = await authService.sendPasswordReset(parsed.data.email);
    setResetMessage(res.message);
  };

  const errorList = Object.entries(fieldErrors);

  return (
    <div
      id="login-form-card"
      key={shakeKey}
      className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${shakeKey > 0 && !reducedMotion ? 'sp-shake' : ''}`}
      style={{
        backgroundColor: 'var(--sp-surface-glass)',
        borderColor: 'var(--sp-border)',
        color: 'var(--sp-text)',
      }}
    >
      <div role="tablist" aria-label="Authentication mode" className="grid grid-cols-2 gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--sp-border)', backgroundColor: 'var(--sp-bg-secondary)' }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'login'}
          onClick={() => handleTabSwitch('login')}
          className="min-h-[44px] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: tab === 'login' ? 'var(--sp-accent)' : 'transparent',
            color: tab === 'login' ? 'var(--sp-accent-text)' : 'var(--sp-text)',
          }}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'signup'}
          onClick={() => handleTabSwitch('signup')}
          className="min-h-[44px] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: tab === 'signup' ? 'var(--sp-accent)' : 'transparent',
            color: tab === 'signup' ? 'var(--sp-accent-text)' : 'var(--sp-text)',
          }}
        >
          Sign up
        </button>
      </div>

      {firebaseNotice && (
        <div
          role="note"
          className="mt-4 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed"
          style={{
            backgroundColor: 'var(--sp-bg-secondary)',
            borderColor: 'var(--sp-border)',
            color: 'var(--sp-text-muted)',
          }}
        >
          {firebaseNotice}
        </div>
      )}

      {(formError || errorList.length > 0) && (
        <div
          role="alert"
          className="mt-4 rounded-xl border px-3.5 py-3 text-xs"
          style={{
            backgroundColor: 'var(--sp-bg-secondary)',
            borderColor: 'var(--sp-danger)',
            color: 'var(--sp-text)',
          }}
        >
          <div className="flex items-start gap-2 font-semibold" style={{ color: 'var(--sp-danger)' }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError ?? 'Please review the errors below.'}</span>
          </div>
          {errorList.length > 0 && (
            <ul className="mt-1.5 list-disc pl-6 space-y-0.5" style={{ color: 'var(--sp-text-muted)' }}>
              {errorList.map(([field, msg]) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          )}
          {popupBlocked && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-2 min-h-[36px] rounded-lg border px-3 py-1 text-xs font-semibold cursor-pointer"
              style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text)' }}
            >
              Retry Google Sign-In
            </button>
          )}
        </div>
      )}

      {isLocked && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold sp-tabular"
          style={{
            backgroundColor: 'var(--sp-bg-secondary)',
            borderColor: 'var(--sp-warning)',
            color: 'var(--sp-warning)',
          }}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Login temporarily locked. Retry in {remainingSeconds}s.</span>
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {tab === 'login' ? (
        <form onSubmit={handleLoginSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => onEmailFocusChange(true)}
              onBlur={() => onEmailFocusChange(false)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-err' : undefined}
              placeholder="student@skillpilot.edu"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--sp-bg-secondary)',
                borderColor: fieldErrors.email ? 'var(--sp-danger)' : 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            />
            {fieldErrors.email && (
              <p id="login-email-err" className="mt-1 text-xs font-medium" style={{ color: 'var(--sp-danger)' }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => onPasswordFocusChange(true)}
                onBlur={() => onPasswordFocusChange(false)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-err' : undefined}
                placeholder="Enter your password"
                className="min-h-[44px] w-full rounded-xl border px-3.5 py-2 pr-12 text-sm"
                style={{
                  backgroundColor: 'var(--sp-bg-secondary)',
                  borderColor: fieldErrors.password ? 'var(--sp-danger)' : 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg cursor-pointer"
                style={{ color: 'var(--sp-text-muted)' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="login-password-err" className="mt-1 text-xs font-medium" style={{ color: 'var(--sp-danger)' }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="inline-flex min-h-[44px] items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setResetMessage(null);
                setShowResetPanel((v) => !v);
              }}
              className="min-h-[44px] px-2 font-semibold underline-offset-4 hover:underline cursor-pointer"
              style={{ color: 'var(--sp-focus)' }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLocked}
            aria-busy={isSubmitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--sp-accent)',
              color: 'var(--sp-accent-text)',
            }}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
            <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignupSubmit} noValidate className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="signup-name" className="block text-xs font-semibold">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'signup-name-err' : undefined}
              placeholder="Alex Rivera"
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--sp-bg-secondary)',
                borderColor: fieldErrors.fullName ? 'var(--sp-danger)' : 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            />
            {fieldErrors.fullName && (
              <p id="signup-name-err" className="mt-1 text-xs" style={{ color: 'var(--sp-danger)' }}>
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-role" className="block text-xs font-semibold">
              Role
            </label>
            <select
              id="signup-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--sp-bg-secondary)',
                borderColor: 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            >
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-semibold">
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => onEmailFocusChange(true)}
              onBlur={() => onEmailFocusChange(false)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'signup-email-err' : undefined}
              placeholder="alex@university.edu"
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--sp-bg-secondary)',
                borderColor: fieldErrors.email ? 'var(--sp-danger)' : 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            />
            {fieldErrors.email && (
              <p id="signup-email-err" className="mt-1 text-xs" style={{ color: 'var(--sp-danger)' }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-semibold">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => onPasswordFocusChange(true)}
                onBlur={() => onPasswordFocusChange(false)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby="signup-strength-text"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="min-h-[44px] w-full rounded-xl border px-3.5 py-2 pr-12 text-sm"
                style={{
                  backgroundColor: 'var(--sp-bg-secondary)',
                  borderColor: fieldErrors.password ? 'var(--sp-danger)' : 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg cursor-pointer"
                style={{ color: 'var(--sp-text-muted)' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span id="signup-strength-text" className="font-semibold">
                  Password strength: {strength.label}
                </span>
                <span className="sp-tabular" style={{ color: 'var(--sp-text-muted)' }}>
                  {strength.score}/4
                </span>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className="h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        strength.score >= step
                          ? strength.score >= 3
                            ? 'var(--sp-success)'
                            : 'var(--sp-warning)'
                          : 'var(--sp-border)',
                    }}
                  />
                ))}
              </div>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs" style={{ color: 'var(--sp-danger)' }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-confirm" className="block text-xs font-semibold">
              Confirm password
            </label>
            <input
              id="signup-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? 'signup-confirm-err' : undefined}
              placeholder="Re-enter password"
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--sp-bg-secondary)',
                borderColor: fieldErrors.confirmPassword ? 'var(--sp-danger)' : 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            />
            {fieldErrors.confirmPassword && (
              <p id="signup-confirm-err" className="mt-1 text-xs" style={{ color: 'var(--sp-danger)' }}>
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--sp-accent)',
              color: 'var(--sp-accent-text)',
            }}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            <span>{isSubmitting ? 'Creating account...' : 'Create account'}</span>
          </button>
        </form>
      )}

      {showResetPanel && (
        <form
          onSubmit={handlePasswordReset}
          className="mt-4 rounded-xl border p-3.5 space-y-2.5"
          style={{ borderColor: 'var(--sp-border)', backgroundColor: 'var(--sp-bg-secondary)' }}
        >
          <label htmlFor="reset-email" className="block text-xs font-semibold">
            Reset password email
          </label>
          <div className="flex gap-2">
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@university.edu"
              className="min-h-[44px] flex-1 rounded-lg border px-3 text-xs"
              style={{
                backgroundColor: 'var(--sp-surface)',
                borderColor: 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            />
            <button
              type="submit"
              className="min-h-[44px] rounded-lg px-3 text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--sp-accent)', color: 'var(--sp-accent-text)' }}
            >
              Send link
            </button>
          </div>
          {resetMessage && (
            <p role="status" className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>
              {resetMessage}
            </p>
          )}
        </form>
      )}

      <div className="my-4 flex items-center gap-3 text-xs" style={{ color: 'var(--sp-text-muted)' }}>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--sp-border)' }} />
        <span>or continue with</span>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--sp-border)' }} />
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: 'var(--sp-bg-secondary)',
            borderColor: 'var(--sp-border)',
            color: 'var(--sp-text)',
          }}
        >
          <span>Continue with Google</span>
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleGuest}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--sp-bg-secondary)',
              borderColor: 'var(--sp-border)',
              color: 'var(--sp-text)',
            }}
          >
            Continue as guest
          </button>

          <button
            type="button"
            onClick={handleDemoStudent}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--sp-bg-secondary)',
              borderColor: 'var(--sp-focus)',
              color: 'var(--sp-text)',
            }}
          >
            <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Try demo student</span>
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs" style={{ color: 'var(--sp-text-muted)' }}>
        <button
          type="button"
          onClick={() => setShowPrivacyNote((v) => !v)}
          className="min-h-[44px] underline underline-offset-4 cursor-pointer"
        >
          Privacy note
        </button>
        <span>Local preview: student@skillpilot.edu / SkillPilot1!</span>
      </div>

      {showPrivacyNote && (
        <p
          role="region"
          aria-label="Privacy notice"
          className="mt-2 rounded-xl border p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: 'var(--sp-bg-secondary)',
            borderColor: 'var(--sp-border)',
            color: 'var(--sp-text-muted)',
          }}
        >
          SkillPilot AI stores only your session identifier, display name, and role locally. Passwords are never saved in browser storage.
        </p>
      )}
    </div>
  );
}
