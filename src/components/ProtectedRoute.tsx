import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
