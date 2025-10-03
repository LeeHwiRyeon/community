import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Pages
import Home from './pages/Home';
import CommunityHub from './pages/CommunityHub';
import CommunityHome from './pages/CommunityHome';
import SimpleBoard from './pages/SimpleBoard';
import QuickContent from './pages/QuickContent';
// import OptimizedCommunityHome from './pages/OptimizedCommunityHome';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import GameCenter from './pages/GameCenter';
import VIPDashboard from './pages/VIPDashboard';
import VIPRequirementsDashboard from './pages/VIPRequirementsDashboard';
import VIPPersonalizedService from './pages/VIPPersonalizedService';
import MainPage from './pages/MainPage';
import UserTestingDashboard from './pages/UserTestingDashboard';
import MonitoringDashboard from './pages/MonitoringDashboard';
import TodoManagement from './pages/TodoManagement';
import VotingManagement from './pages/VotingManagement';
import BoardDetail from './pages/BoardDetail';
import PostDetail from './pages/PostDetail';
import CosplayShop from './pages/CosplayShop';
import StreamingStation from './pages/StreamingStation';
import EnhancedDesignSystem from './components/EnhancedDesignSystem';
import AdvancedInteractionSystem from './components/AdvancedInteractionSystem';
import UIUXV2DesignSystem from './components/UIUXV2DesignSystem';
import PerformanceDashboard from './components/PerformanceDashboard';
import AccessibilityPanel from './components/AccessibilityPanel';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatSystem from './components/ChatSystem';

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
    const [chatOpen, setChatOpen] = React.useState(false);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1 }}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<MainPage />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Community Routes */}
                            <Route path="/communities" element={<CommunityHub />} />
                            <Route path="/community/:communityId" element={<CommunityHome />} />
                            <Route path="/boards/:boardId" element={<BoardDetail />} />
                            <Route path="/posts/:postId" element={<PostDetail />} />
                            <Route path="/simple-board" element={<SimpleBoard />} />
                            <Route path="/quick-content" element={<QuickContent />} />

                            {/* Protected Routes */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/games" element={<GameCenter />} />
                            <Route path="/vip" element={<VIPDashboard />} />
                            <Route path="/vip-requirements" element={<VIPRequirementsDashboard />} />
                            <Route path="/vip-personalized" element={<VIPPersonalizedService />} />
                            <Route path="/user-testing" element={<UserTestingDashboard />} />
                            <Route path="/monitoring" element={<MonitoringDashboard />} />
                            <Route path="/todos" element={<TodoManagement />} />
                            <Route path="/voting" element={<VotingManagement />} />

                            {/* Feature Routes */}
                            <Route path="/cosplay" element={<CosplayShop />} />
                            <Route path="/streaming" element={<StreamingStation />} />
                            <Route path="/design-system" element={<EnhancedDesignSystem />} />
                            <Route path="/interactions" element={<AdvancedInteractionSystem />} />
                            <Route path="/uiux-v2" element={<UIUXV2DesignSystem />} />
                            <Route path="/performance" element={<PerformanceDashboard />} />
                            <Route path="/accessibility" element={<AccessibilityPanel />} />

                            {/* 404 */}
                            <Route path="/404" element={<NotFound />} />
                            <Route path="*" element={<Navigate to="/404" replace />} />
                        </Routes>
                    </Box>
                    <Footer />

                    {/* 전역 채팅 시스템 */}
                    <ChatSystem
                        isOpen={chatOpen}
                        onClose={() => setChatOpen(!chatOpen)}
                    />
                </Box>
            </Router>
        </ThemeProvider>
    );
};

export default App;
