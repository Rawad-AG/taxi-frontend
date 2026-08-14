import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import type { UserRole } from '../types';

export function ProtectedRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === 'driver' ? '/driver' : '/customer'} replace />;
  }

  return <>{children}</>;
}
