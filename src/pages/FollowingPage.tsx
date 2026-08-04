import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import VideoFeed from '../components/VideoFeed'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { Video } from '../types'
import './FollowingPage.css'

export default function FollowingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFeed = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setError('')
      const { videos: feed } = await api.getFollowingFeed()
      setVideos(feed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleLike = async (videoId: number) => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const { liked } = await api.toggleLike(videoId)
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, isLiked: liked, likesCount: v.likesCount + (liked ? 1 : -1) }
            : v
        )
      )
    } catch {
      // ignore
    }
  }

  const handleFollow = async (username: string) => {
    if (!user) return
    try {
      await api.toggleFollow(username)
    } catch {
      // ignore
    }
  }

  if (!user) {
    return (
      <AppShell>
        <div className="following-empty">
          <div className="following-empty-icon">👋</div>
          <h2>See videos from friends</h2>
          <p>Log in to watch videos from people you follow and your own posts.</p>
          <Link to="/login" className="following-cta">Log in</Link>
          <Link to="/discover" className="following-link">Browse videos</Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell header={<header className="following-header"><h1>Friends</h1></header>}>
      {loading && (
        <div className="following-state">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="following-state">
          <p>{error}</p>
          <button type="button" onClick={loadFeed}>Try again</button>
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="following-empty in-feed">
          <div className="following-empty-icon">🎬</div>
          <h2>No videos yet</h2>
          <p>Follow creators on Discover or post your first video!</p>
          <Link to="/create" className="following-cta">Create video</Link>
          <Link to="/discover" className="following-link">Find friends</Link>
        </div>
      )}

      {!loading && !error && videos.length > 0 && (
        <VideoFeed
          videos={videos}
          onLike={handleLike}
          onFollow={handleFollow}
          isAuthenticated={!!user}
        />
      )}
    </AppShell>
  )
}
