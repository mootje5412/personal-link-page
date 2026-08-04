import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { User, Video } from '../types'
import { formatCount } from '../utils/format'
import './ProfilePage.css'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<User | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    if (!username) return
    setLoading(true)
    api.getUser(username).then(({ user, videos: vids }) => {
      setProfile(user)
      setVideos(vids)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [username])

  const handleFollow = async () => {
    if (!username || !currentUser) return
    setFollowLoading(true)
    try {
      const { following } = await api.toggleFollow(username)
      setProfile((p) => p ? { ...p, isFollowing: following, followers: p.followers + (following ? 1 : -1) } : p)
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell dark={false}>
        <div className="profile-loading">Loading profile...</div>
      </AppShell>
    )
  }

  if (!profile) {
    return (
      <AppShell dark={false}>
        <div className="profile-loading">User not found</div>
      </AppShell>
    )
  }

  return (
    <AppShell dark={false}>
      <div className="profile-page">
        <header className="profile-top">
          {isOwnProfile ? (
            <button type="button" className="profile-action-btn" onClick={() => navigate('/edit-profile')}>
              Edit profile
            </button>
          ) : currentUser ? (
            <button
              type="button"
              className={`profile-action-btn ${profile.isFollowing ? 'following' : 'primary'}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {profile.isFollowing ? 'Following' : 'Follow'}
            </button>
          ) : (
            <Link to="/login" className="profile-action-btn primary">Follow</Link>
          )}
        </header>

        <div className="profile-header">
          <img src={profile.avatarUrl} alt="" className="profile-avatar" />
          <h1 className="profile-display-name">{profile.displayName}</h1>
          <p className="profile-username">@{profile.username}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>

        <div className="profile-stats">
          <div className="stat">
            <strong>{formatCount(profile.following)}</strong>
            <span>Following</span>
          </div>
          <div className="stat">
            <strong>{formatCount(profile.followers)}</strong>
            <span>Followers</span>
          </div>
          <div className="stat">
            <strong>{formatCount(profile.totalLikes)}</strong>
            <span>Likes</span>
          </div>
        </div>

        {isOwnProfile && (
          <button type="button" className="profile-logout" onClick={() => { logout(); navigate('/login') }}>
            Log out
          </button>
        )}

        <div className="profile-tabs">
          <button type="button" className="profile-tab active">Videos</button>
        </div>

        <div className="profile-grid">
          {videos.length === 0 ? (
            <p className="profile-empty">No videos yet</p>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="profile-video-thumb">
                <video src={video.videoUrl} muted playsInline preload="metadata" />
                <span>{formatCount(video.likesCount)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
