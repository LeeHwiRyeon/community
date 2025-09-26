import { startDraftMetricListener, stopDraftMetricListener } from './analytics/drafts-metric-listener'
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import BoardPage from './pages/BoardPage'
import { BroadcastPage } from './pages/BroadcastPage'
import PostPage from './pages/PostPage'
import CreatePostPage from './pages/CreatePostPage'
import EditPostPage from './pages/EditPostPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import CosplayShopPage from './pages/CosplayShopPage'

function App() {
  useEffect(() => {
    startDraftMetricListener()
    return () => stopDraftMetricListener()
  }, [])
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/news" element={<BoardPage boardId="news" />} />
                <Route path="/broadcast" element={<BroadcastPage />} />
                <Route path="/cosplay" element={<CosplayShopPage />} />
                <Route path="/community" element={<BoardPage boardId="community" />} />
                <Route path="/board/:boardId" element={<BoardPage />} />
                <Route path="/board/:boardId/create" element={<CreatePostPage />} />
                <Route path="/board/:boardId/post/:postId" element={<PostPage />} />
                <Route path="/board/:boardId/post/:postId/edit" element={<EditPostPage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App

