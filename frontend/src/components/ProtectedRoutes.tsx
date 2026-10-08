import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scale } from 'lucide-react';

// ── Loading Spinner ───────────────────────────────────────────────────────────

const AuthLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center mx-auto animate-pulse">
        <Scale className="w-7 h-7 text-amber-300" />
      </div>
      <p className="text-slate-400 text-sm">Verifying session…</p>
    </div>
  </div>
);

// ── PrivateRoute — requires ANY authenticated user ────────────────────────────

interface PrivateRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoader />;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// ── CitizenRoute — only CITIZEN users ────────────────────────────────────────

interface CitizenRouteProps {
  children: React.ReactNode;
}

export const CitizenRoute: React.FC<CitizenRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'CITIZEN' && user?.role !== 'ADMIN') {
    // Lawyer trying to access citizen-only page → show unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// ── LawyerRoute — only LAWYER users ──────────────────────────────────────────

interface LawyerRouteProps {
  children: React.ReactNode;
}

export const LawyerRoute: React.FC<LawyerRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/lawyer/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'LAWYER' && user?.role !== 'ADMIN') {
    // Citizen trying to access lawyer-only page → show unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
