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
import ModernMainPage from './pages/ModernMainPage';
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
import AccessibilityPanel from './components/AccessibilityPanel';
import CommunityAnalyticsDashboard from './components/CommunityAnalyticsDashboard';
import PerformanceMetricsDashboard from './components/PerformanceMetricsDashboard';
import SpamPreventionSystem from './components/SpamPreventionSystem';
import ReportManagementSystem from './components/ReportManagementSystem';
// import AutoModerationSystem from './components/AutoModerationSystem';
import InternationalizationSystem from './components/InternationalizationSystem';
import PerformanceDashboard from './components/Performance/PerformanceDashboard';
import NewsManager from './components/News/NewsManager';
import CommunityManager from './components/Community/CommunityManager';
import ChatBasedCommunity from './components/ChatBasedCommunity';
import StreamerManagerSystem from './components/StreamerManagerSystem';
import CosplayerItemCreatorSystem from './components/CosplayerItemCreatorSystem';
import RPGProfileSystem from './components/RPGProfileSystem';
import RichTextEditor from './components/RichTextEditor';
import FollowSystem from './components/FollowSystem';
import AdminDashboard from './components/AdminDashboard';
import { AuthProvider } from './components/Auth/AuthProvider';
import LoginForm from './components/Auth/LoginForm';
import UserProfile from './components/Auth/UserProfile';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatSystem from './components/ChatSystem';
import BreadcrumbNavigation from './components/BreadcrumbNavigation';

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
            <AuthProvider>
                <Router>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        <Navbar />
                        <BreadcrumbNavigation />
                        <Box component="main" sx={{ flexGrow: 1 }}>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<ModernMainPage />} />
                                <Route path="/classic" element={<MainPage />} />
                                <Route path="/home" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />

                                {/* Tree Structure Routes */}
                                <Route path="/communities" element={<CommunityHub />} />
                                <Route path="/communities/:communityId" element={<CommunityHome />} />
                                <Route path="/communities/:communityId/:boardId" element={<BoardDetail />} />
                                <Route path="/posts/:postId" element={<PostDetail />} />

                                {/* Legacy Routes (for backward compatibility) */}
                                <Route path="/community/:communityId" element={<CommunityHome />} />
                                <Route path="/boards/:boardId" element={<BoardDetail />} />
                                <Route path="/simple-board" element={<SimpleBoard />} />
                                <Route path="/quick-content" element={<QuickContent />} />

                                {/* Protected Routes */}
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/games" element={<GameCenter />} />
                                <Route path="/vip" element={<VIPDashboard />} />
                                <Route path="/vip-requirements" element={<VIPRequirementsDashboard />} />
                                <Route path="/vip-personalized" element={<VIPPersonalizedService />} />
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
                                <Route path="/analytics" element={<CommunityAnalyticsDashboard />} />
                                <Route path="/metrics" element={<PerformanceMetricsDashboard />} />
                                <Route path="/spam-prevention" element={<SpamPreventionSystem />} />
                                <Route path="/report-management" element={<ReportManagementSystem />} />
                                {/* <Route path="/auto-moderation" element={<AutoModerationSystem />} /> */}
                                <Route path="/internationalization" element={<InternationalizationSystem />} />
                                <Route path="/performance-dashboard" element={<PerformanceDashboard />} />
                                <Route path="/news-manager" element={<NewsManager />} />
                                <Route path="/community-manager" element={<CommunityManager />} />
                                <Route path="/chat-community" element={<ChatBasedCommunity />} />
                                <Route path="/streamer-manager" element={<StreamerManagerSystem />} />
                                <Route path="/cosplayer-manager" element={<CosplayerItemCreatorSystem />} />
                                <Route path="/rpg-profile" element={<RPGProfileSystem />} />
                                <Route path="/rich-editor" element={<RichTextEditor />} />
                                <Route path="/follow-system" element={<FollowSystem currentUserId="1" />} />
                                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                                <Route path="/login" element={<LoginForm />} />
                                <Route path="/profile" element={<UserProfile />} />

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
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
