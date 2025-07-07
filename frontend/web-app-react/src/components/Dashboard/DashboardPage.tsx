import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Typography, Container, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          HSEE Dashboard
        </Typography>
        {user && (
          <Typography variant="h6">
            Welcome, {user.username} (Role: {user.role || 'N/A'})!
          </Typography>
        )}
        <Typography paragraph sx={{ mt: 2 }}>
          This is the main dashboard for the Health, Safety, Security & Environment (HSEE) system
          for Sherkat Kesht o Sanat Neyshekar Dehkhoda.
        </Typography>
        <Typography paragraph>
          From here, you will be able to access various modules such as Incident Management,
          Risk Assessment, Document Control, and more.
        </Typography>
        <Box sx={{ mt: 3 }}>
            <Button component={RouterLink} to="/documents" variant="contained" color="primary" sx={{ mr: 2 }}>
                View Documents
            </Button>
            {/* Add more navigation buttons as modules are developed */}
            {/* Example:
            <Button component={RouterLink} to="/incidents" variant="contained" color="secondary" sx={{ mr: 2 }}>
                Manage Incidents
            </Button>
             <Button component={RouterLink} to="/risks" variant="contained" color="warning">
                Assess Risks
            </Button>
            */}
        </Box>
        <Box sx={{ mt: 4 }}>
            <Button variant="outlined" onClick={logout}>
                Logout
            </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;
