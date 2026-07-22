import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDeniedPage from '../pages/AccessDeniedPage';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium animate-pulse">Loading WorkWise...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || 'jobseeker';
    if (!allowedRoles.includes(userRole)) {
      return <AccessDeniedPage requiredRole={allowedRoles.join(' or ')} />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
