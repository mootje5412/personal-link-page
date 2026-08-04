import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import AuthDivider from '../components/auth/AuthDivider';
import GoogleButton from '../components/auth/GoogleButton';
import '../components/auth/AuthLayout.css';

export default function Login() {
  const { user, loading: authLoading, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your GeoLoca account"
      footer={
        <>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      <GoogleButton label="signin_with" />
      <AuthDivider />

      <form className="auth-form" onSubmit={onSubmit}>
        {error && <p className="auth-error">{error}</p>}

        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <div className="auth-row">
            <label htmlFor="login-password">Password</label>
            <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
