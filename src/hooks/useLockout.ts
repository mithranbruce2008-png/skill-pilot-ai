import { useCallback, useEffect, useState } from 'react';

export const MAX_FAILED_ATTEMPTS = 5;
export const BASE_LOCKOUT_SECONDS = 30;

/**
 * Computes exponential backoff duration in seconds for repeated lockouts.
 */
export function computeLockoutDuration(lockoutCount: number): number {
  const safeCount = Math.max(1, lockoutCount);
  return BASE_LOCKOUT_SECONDS * Math.pow(2, safeCount - 1);
}

/**
 * Manages failed login attempt counting, 30s+ exponential lockout, and 10s screen-reader announcements.
 */
export function useLockout() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutCount, setLockoutCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const isLocked = remainingSeconds > 0;

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setAnnouncement('Account unlock complete. You may try signing in again.');
          return 0;
        }
        if (next % 10 === 0) {
          setAnnouncement(`Too many failed attempts. Try again in ${next} seconds.`);
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds > 0]);

  const recordFailure = useCallback((): { lockedNow: boolean; duration: number } => {
    const nextAttempts = failedAttempts + 1;
    if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
      const nextLockoutCount = lockoutCount + 1;
      const duration = computeLockoutDuration(nextLockoutCount);
      setFailedAttempts(0);
      setLockoutCount(nextLockoutCount);
      setRemainingSeconds(duration);
      setAnnouncement(
        `Too many failed attempts. Login locked for ${duration} seconds.`,
      );
      return { lockedNow: true, duration };
    }
    setFailedAttempts(nextAttempts);
    return { lockedNow: false, duration: 0 };
  }, [failedAttempts, lockoutCount]);

  const resetLockout = useCallback(() => {
    setFailedAttempts(0);
    setLockoutCount(0);
    setRemainingSeconds(0);
    setAnnouncement('');
  }, []);

  return {
    failedAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
    lockoutCount,
    remainingSeconds,
    isLocked,
    announcement,
    recordFailure,
    resetLockout,
  };
}
