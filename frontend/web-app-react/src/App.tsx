import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import DashboardPage from './components/Dashboard/DashboardPage';
import DocumentListPage from './components/Documents/DocumentListPage';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';

// Basic MUI theme (can be customized further)
const theme = createTheme({
  palette: {
    primary: {
      main: '#00695c', // Example: Dehkhoda organizational color (adjust as needed)
    },
    secondary: {
      main: '#f57c00', // Example secondary color
    },
    background: {
      default: '#f4f6f8', // Light grey background
    },
  },
  typography: {
    fontFamily: 'Tahoma, Arial, sans-serif', // Using a common Persian-compatible font
  },
  direction: 'rtl', // For Right-to-Left language support (Persian)
});


const AppContent: React.FC = () => {
  const { isLoading } = useAuth(); // Use isLoading from useAuth

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentListPage />} />
        {/* Add other protected routes here as they are developed */}
        {/* e.g., <Route path="/incidents" element={<IncidentListPage />} /> */}
      </Route>

      {/* Default route: redirect to dashboard if authenticated, else to login */}
      <Route
        path="/"
        element={
          <Navigate to="/dashboard" replace />
        }
      />

      {/* Catch-all for undefined routes (optional) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* MUI's baseline CSS for consistency */}
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
