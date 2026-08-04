import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './EditProfilePage.css'

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await updateProfile({ displayName, bio })
      navigate(`/profile/${user.username}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="edit-profile-page">
      <header className="edit-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="Back">←</button>
        <h1>Edit profile</h1>
        <span />
      </header>

      <div className="edit-avatar-section">
        <img src={user.avatarUrl} alt="" />
        <p>@{user.username}</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        {error && <div className="edit-error">{error}</div>}

        <label>
          <span>Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            required
          />
        </label>

        <label>
          <span>Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            placeholder="Tell people about yourself..."
          />
          <small>{bio.length}/160</small>
        </label>

        <button type="submit" className="edit-save" disabled={loading}>
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
