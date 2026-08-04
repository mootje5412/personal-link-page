import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import { AuthProvider } from './context/AuthContext'
import CreatePage from './pages/CreatePage'
import DiscoverPage from './pages/DiscoverPage'
import EditProfilePage from './pages/EditProfilePage'
import FollowingPage from './pages/FollowingPage'
import InboxPage from './pages/InboxPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import WatchPage from './pages/WatchPage'

function AppLayout() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FollowingPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
