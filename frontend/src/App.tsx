import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import BoardPage from './pages/BoardPage'
import PostPage from './pages/PostPage'
import SearchPage from './pages/SearchPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/board/:boardId" element={<BoardPage />} />
              <Route path="/board/:boardId/post/:postId" element={<PostPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
