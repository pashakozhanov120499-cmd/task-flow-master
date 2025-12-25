import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { checkAuth, setUser, logout } from './store/slices/authSlice'
import { setTheme } from './store/slices/themeSlice'
import { authAPI } from './services/api'
import LoginPage from './pages/LoginPage'
import WelcomePage from './pages/WelcomePage'
import Layout from './components/layout/Layout'
import BoardsPage from './pages/BoardsPage'
import BoardPage from './pages/BoardPage'
import ProfilePage from './pages/ProfilePage'
import TasksPage from './pages/TasksPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const dispatch = useAppDispatch()
  const { theme } = useAppSelector((state) => state.theme)
  const { isAuthenticated, token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(checkAuth())
    
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      dispatch(setTheme(savedTheme))
    } else {
      dispatch(setTheme('dark'))
    }
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated && token) {
      authAPI.getCurrentUser()
        .then(user => {
          dispatch(setUser({
            id: user.id,
            username: user.username,
            email: user.email,
          }))
        })
        .catch(() => {
          dispatch(logout())
        })
    }
  }, [isAuthenticated, token, dispatch])

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/boards" replace />} />
          <Route path="boards" element={<BoardsPage />} />
          <Route path="boards/:id" element={<BoardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
