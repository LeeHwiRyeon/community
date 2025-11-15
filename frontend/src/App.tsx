import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/theme.css';

// Eagerly loaded components (필수 컴포넌트)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatSystem from './components/ChatSystem';
import BreadcrumbNavigation from './components/BreadcrumbNavigation';
import ErrorBoundary from './components/UI/ErrorBoundary';
import PageTransition from './components/UI/PageTransition';
import { AuthProvider } from './components/Auth/AuthProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { DraftProvider } from './contexts/DraftContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LoginForm from './components/Auth/LoginForm';

// Lazy loaded pages (페이지 레벨 코드 스플리팅)
const Home = lazy(() => import('./pages/Home'));
const CommunityHub = lazy(() => import('./pages/CommunityHub'));
const CommunityHome = lazy(() => import('./pages/CommunityHome'));
const SimpleBoard = lazy(() => import('./pages/SimpleBoard'));
const QuickContent = lazy(() => import('./pages/QuickContent'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GameCenter = lazy(() => import('./pages/GameCenter'));
const VIPDashboard = lazy(() => import('./pages/VIPDashboard'));
const VIPRequirementsDashboard = lazy(() => import('./pages/VIPRequirementsDashboard'));
const VIPPersonalizedService = lazy(() => import('./pages/VIPPersonalizedService'));
const MainPage = lazy(() => import('./pages/MainPage'));
const ModernMainPage = lazy(() => import('./pages/ModernMainPage'));
const MonitoringDashboard = lazy(() => import('./pages/MonitoringDashboard'));
const TodoManagement = lazy(() => import('./pages/TodoManagement'));
const VotingManagement = lazy(() => import('./pages/VotingManagement'));
const BoardDetail = lazy(() => import('./pages/BoardDetail'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const CosplayShop = lazy(() => import('./pages/CosplayShop'));
const StreamingStation = lazy(() => import('./pages/StreamingStation'));
const DirectMessages = lazy(() => import('./pages/DirectMessages'));
const GroupChats = lazy(() => import('./pages/GroupChats'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Phase 2 Pages
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const FollowFeedPage = lazy(() => import('./pages/FollowFeedPage'));
const ModeratorPage = lazy(() => import('./pages/ModeratorPage'));
const OnlineUsersPage = lazy(() => import('./pages/OnlineUsersPage'));

// Phase 3 Pages
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const ThemeSettingsPage = lazy(() => import('./pages/ThemeSettingsPage'));

// Phase 5 Components
const NotificationList = lazy(() => import('./components/NotificationList'));
const SimpleSearchPage = lazy(() => import('./pages/SimpleSearchPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

// Lazy loaded components (고급 컴포넌트)
const UIUXV2DesignSystem = lazy(() => import('./components/UIUXV2DesignSystem'));
const AdvancedInteractionSystem = lazy(() => import('./components/AdvancedInteractionSystem'));
const AccessibilityPanel = lazy(() => import('./components/AccessibilityPanel'));
const CommunityAnalyticsDashboard = lazy(() => import('./components/CommunityAnalyticsDashboard'));
const PerformanceMetricsDashboard = lazy(() => import('./components/PerformanceMetricsDashboard'));
const SpamPreventionSystem = lazy(() => import('./components/SpamPreventionSystem'));
const ReportManagementSystem = lazy(() => import('./components/ReportManagementSystem'));
const InternationalizationSystem = lazy(() => import('./components/InternationalizationSystem'));
const PerformanceDashboard = lazy(() => import('./components/Performance/PerformanceDashboard'));
const NewsManager = lazy(() => import('./components/News/NewsManager'));
const CommunityManager = lazy(() => import('./components/Community/CommunityManager'));
const ChatBasedCommunity = lazy(() => import('./components/ChatBasedCommunity'));
const StreamerManagerSystem = lazy(() => import('./components/StreamerManagerSystem'));
const CosplayerItemCreatorSystem = lazy(() => import('./components/CosplayerItemCreatorSystem'));
const RPGProfileSystem = lazy(() => import('./components/RPGProfileSystem'));
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));
const FollowSystem = lazy(() => import('./components/FollowSystem'));
const AdminDashboard = lazy(() => import('./components/Dashboard/AdminDashboard'));
const CoreModulesIntegration = lazy(() => import('./components/CoreModulesIntegration'));
const AdvancedManagementSystem = lazy(() => import('./components/AdvancedManagementSystem'));
const IntegratedDashboard = lazy(() => import('./components/IntegratedDashboard'));
const UserProfile = lazy(() => import('./components/Auth/UserProfile'));

// Phase 2 Components - Bookmark System
const BookmarkList = lazy(() => import('./components/BookmarkList'));
const BookmarkFolderManager = lazy(() => import('./components/BookmarkFolderManager'));

// Phase 2 Components - Follow System
const FollowFeed = lazy(() => import('./components/FollowFeed'));
const FollowersList = lazy(() => import('./components/FollowersList'));
const BoardFollowList = lazy(() => import('./components/BoardFollowList'));

// Phase 2 Components - Moderator Tools
const ModeratorDashboard = lazy(() => import('./components/ModeratorDashboard'));
const ContentReportList = lazy(() => import('./components/ContentReportList'));
const ModeratorActionLog = lazy(() => import('./components/ModeratorActionLog'));

// Phase 2 Components - Online Status
const OnlineUserList = lazy(() => import('./components/OnlineUserList'));

// Loading fallback component
const LoadingFallback = () => (
    <Container
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2
        }}
    >
        <CircularProgress size={60} thickness={4} />
        <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            로딩 중...
        </Box>
    </Container>
);

const App: React.FC = () => {
    const [chatOpen, setChatOpen] = React.useState(false);

    return (
        <ThemeProvider>
            <ErrorBoundary>
                <AuthProvider>
                    <NotificationProvider>
                        <SnackbarProvider>
                            <DraftProvider>
                                <Router>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                                        <Navbar />
                                        <BreadcrumbNavigation />
                                        <Box component="main" sx={{ flexGrow: 1 }}>
                                            <Suspense fallback={<LoadingFallback />}>
                                                <PageTransition>
                                                    <Routes>
                                                        {/* Public Routes */}
                                                        <Route path="/" element={<IntegratedDashboard />} />
                                                        <Route path="/classic" element={<MainPage />} />
                                                        <Route path="/modern" element={<ModernMainPage />} />
                                                        <Route path="/home" element={<Home />} />
                                                        <Route path="/login" element={<LoginForm />} />
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
                                                        <Route path="/messages" element={<DirectMessages />} />
                                                        <Route path="/group-chats" element={<GroupChats />} />
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
                                                        <Route path="/design-system" element={<UIUXV2DesignSystem />} />
                                                        <Route path="/uiux-v2" element={<Navigate to="/design-system" replace />} />
                                                        <Route path="/interactions" element={<AdvancedInteractionSystem />} />
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
                                                        <Route path="/core-modules" element={<CoreModulesIntegration />} />
                                                        <Route path="/advanced-management" element={<AdvancedManagementSystem />} />

                                                        {/* Phase 2 Routes - Bookmark System */}
                                                        <Route path="/bookmarks" element={<BookmarksPage />} />

                                                        {/* Phase 2 Routes - Follow System */}
                                                        <Route path="/follow/feed" element={<FollowFeedPage />} />
                                                        <Route path="/follow/followers" element={<FollowersList userId={1} />} />
                                                        <Route path="/follow/boards" element={<BoardFollowList />} />

                                                        {/* Phase 2 Routes - Moderator Tools */}
                                                        <Route path="/moderator" element={<ModeratorPage />} />
                                                        <Route path="/moderator/reports" element={<ContentReportList />} />
                                                        <Route path="/moderator/logs" element={<ModeratorActionLog />} />

                                                        {/* Phase 2 Routes - Online Status */}
                                                        <Route path="/online-users" element={<OnlineUsersPage />} />

                                                        {/* Phase 3 Routes - Notification System */}
                                                        <Route path="/notifications" element={<NotificationList />} />

                                                        {/* Phase 5 Routes - Search System */}
                                                        <Route path="/search" element={<SimpleSearchPage />} />

                                                        {/* Phase 5 Routes - User Profile */}
                                                        <Route path="/users/:userId" element={<UserProfilePage />} />

                                                        {/* Phase 5 Routes - Admin Dashboard */}
                                                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

                                                        {/* Phase 3 Routes - Profile System */}
                                                        <Route path="/profile/:userId" element={<ProfilePage />} />
                                                        <Route path="/profile/:userId/edit" element={<EditProfilePage />} />

                                                        {/* Phase 3 Routes - Theme System */}
                                                        <Route path="/theme-settings" element={<ThemeSettingsPage />} />

                                                        {/* 404 */}
                                                        <Route path="/404" element={<NotFound />} />
                                                        <Route path="*" element={<Navigate to="/404" replace />} />

                                                        <Route path="/news" element={<div>News Page</div>} />
                                                        <Route path="/games" element={<div>Games Page</div>} />
                                                    </Routes>
                                                </PageTransition>
                                            </Suspense>
                                        </Box>
                                        <Footer />

                                        {/* 전역 채팅 시스템 */}
                                        <ChatSystem
                                            isOpen={chatOpen}
                                            onClose={() => setChatOpen(!chatOpen)}
                                        />

                                        {/* PWA 설치 프롬프트 */}
                                        <PWAInstallPrompt />
                                    </Box>
                                </Router>
                            </DraftProvider>
                        </SnackbarProvider>
                    </NotificationProvider>
                </AuthProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
};

export default App;
