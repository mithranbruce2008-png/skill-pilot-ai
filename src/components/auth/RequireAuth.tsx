import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth/authService';
import { useAppStore } from '../../store/useAppStore';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Route guard redirecting unauthenticated visitors to /login while preserving intended destination.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const storeSession = useAppStore((s) => s.session);
  const location = useLocation();
  const activeSession = storeSession ?? authService.getSession();

  if (!activeSession) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <>{children}</>;
}
