import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './GoogleButton.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Props = {
  label?: 'signin_with' | 'signup_with' | 'continue_with';
};

export default function GoogleButton({ label = 'continue_with' }: Props) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const onSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    setNotice('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/dashboard');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) {
    return (
      <div className="google-btn-wrap">
        <button
          type="button"
          className="google-btn"
          onClick={() => setNotice('Google sign-in needs setup. Please use email below for now.')}
        >
          <GoogleIcon />
          Continue with Google
        </button>
        {notice && <p className="google-notice">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="google-btn-wrap">
      {loading ? (
        <button type="button" className="google-btn" disabled>
          <GoogleIcon />
          Signing in with Google…
        </button>
      ) : (
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() => setNotice('Google sign-in failed. Try again or use email.')}
          theme="filled_black"
          size="large"
          text={label}
          shape="rectangular"
          width="400"
        />
      )}
      {notice && <p className="google-notice">{notice}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c3.42-3.15 5.592-7.796 5.592-13.18z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}
