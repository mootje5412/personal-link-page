import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardHomePage from './pages/DashboardHomePage'
import QuerySearchPage from './pages/QuerySearchPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit" element={<RegisterPage />} />
          <Route
            path="/panel"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHomePage />} />
            <Route path="sorgu/telefon" element={<QuerySearchPage searchType="telefon" />} />
            <Route path="sorgu/tc" element={<QuerySearchPage searchType="tc" />} />
            <Route path="sorgu/ad" element={<QuerySearchPage searchType="ad" />} />
            <Route path="sorgu/soyad" element={<QuerySearchPage searchType="soyad" />} />
            <Route path="sorgu/*" element={<Navigate to="/panel/sorgu/telefon" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
