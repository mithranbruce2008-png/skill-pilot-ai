import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_FAILED_ATTEMPTS, computeLockoutDuration, useLockout } from '../hooks/useLockout';
import {
  LoginFormSchema,
  SignupFormSchema,
  evaluatePasswordStrength,
} from '../schemas/authSchemas';

describe('Auth form Zod validation and password strength', () => {
  it('validates login credentials properly', () => {
    expect(
      LoginFormSchema.safeParse({
        email: 'student@skillpilot.edu',
        password: 'Password1!',
        rememberMe: true,
      }).success,
    ).toBe(true);

    const invalid = LoginFormSchema.safeParse({
      email: 'not-an-email',
      password: '',
      rememberMe: false,
    });
    expect(invalid.success).toBe(false);
  });

  it('validates signup matching passwords and strength requirements', () => {
    const mismatch = SignupFormSchema.safeParse({
      fullName: 'Alex Rivera',
      role: 'Student',
      email: 'alex@uni.edu',
      password: 'Password1',
      confirmPassword: 'Password2',
    });
    expect(mismatch.success).toBe(false);

    const valid = SignupFormSchema.safeParse({
      fullName: 'Alex Rivera',
      role: 'Student',
      email: 'alex@uni.edu',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    });
    expect(valid.success).toBe(true);

    expect(evaluatePasswordStrength('').score).toBe(0);
    expect(evaluatePasswordStrength('abc').label).toBe('Weak');
    expect(evaluatePasswordStrength('StrongPass1!').score).toBe(4);
  });
});

describe('Login lockout countdown and exponential backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes exponential backoff durations', () => {
    expect(computeLockoutDuration(1)).toBe(30);
    expect(computeLockoutDuration(2)).toBe(60);
    expect(computeLockoutDuration(3)).toBe(120);
  });

  it('locks after 5 failed attempts, counts down, announces every 10s, and backs off on repeat lockouts', () => {
    const { result } = renderHook(() => useLockout());

    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i += 1) {
      act(() => {
        const res = result.current.recordFailure();
        expect(res.lockedNow).toBe(false);
      });
    }
    expect(result.current.isLocked).toBe(false);

    act(() => {
      const lockRes = result.current.recordFailure();
      expect(lockRes.lockedNow).toBe(true);
      expect(lockRes.duration).toBe(30);
    });
    expect(result.current.isLocked).toBe(true);
    expect(result.current.remainingSeconds).toBe(30);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.remainingSeconds).toBe(20);
    expect(result.current.announcement).toContain('20 seconds');

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(result.current.isLocked).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);

    // Second lockout should double to 60s
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      act(() => {
        result.current.recordFailure();
      });
    }
    expect(result.current.remainingSeconds).toBe(60);
  });
});
