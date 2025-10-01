import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Home from './pages/Home';
import CommunityHub from './pages/CommunityHub';
import CommunityHome from './pages/CommunityHome';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import GameCenter from './pages/GameCenter';
import VIPDashboard from './pages/VIPDashboard'; // Added for VIP_SYSTEM_001
import VIPRequirementsDashboard from './pages/VIPRequirementsDashboard'; // Added for VIP_ENHANCEMENT_001
import VIPPersonalizedService from './pages/VIPPersonalizedService'; // Added for VIP_ENHANCEMENT_002
import CommunityHub from './pages/CommunityHub'; // Added for COMMUNITY_RELEASE_001
import MainPage from './pages/MainPage'; // Added for MAIN_MENU_STRUCTURE
import UserTestingDashboard from './pages/UserTestingDashboard'; // Added for RELEASE_PREP_008
import MonitoringDashboard from './pages/MonitoringDashboard'; // Added for RELEASE_PREP_009
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#64748b',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<MainPage />} /> {/* Main page with user type selection */}
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Community Routes */}
                <Route path="/communities" element={<CommunityHub />} />
                <Route path="/community/:communityId" element={<CommunityHome />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/games" element={<GameCenter />} />
                <Route path="/vip" element={<VIPDashboard />} /> {/* Added for VIP_SYSTEM_001 */}
                <Route path="/vip-requirements" element={<VIPRequirementsDashboard />} /> {/* Added for VIP_ENHANCEMENT_001 */}
                <Route path="/vip-personalized" element={<VIPPersonalizedService />} /> {/* Added for VIP_ENHANCEMENT_002 */}
                <Route path="/community-hub" element={<CommunityHub />} /> {/* Added for COMMUNITY_RELEASE_001 */}
                <Route path="/user-testing" element={<UserTestingDashboard />} /> {/* Added for RELEASE_PREP_008 */}
                <Route path="/monitoring" element={<MonitoringDashboard />} /> {/* Added for RELEASE_PREP_009 */}

                {/* 404 */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;