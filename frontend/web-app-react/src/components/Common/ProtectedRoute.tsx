import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Optional: Specify roles that can access this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner while auth state is being determined
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles are specified, check if the user has one of the roles
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Redirect to an unauthorized page or dashboard if role not allowed
    // For simplicity, redirecting to dashboard. Consider a dedicated "Unauthorized" page.
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
    // Or: return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />; // Render child routes/components if authenticated (and authorized)
};

export default ProtectedRoute;
