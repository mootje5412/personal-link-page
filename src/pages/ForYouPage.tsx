import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell, { FeedHeader } from '../components/AppShell'
import VideoFeed from '../components/VideoFeed'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { Video } from '../types'
import './ForYouPage.css'

export default function ForYouPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFeed = useCallback(async () => {
    try {
      setError('')
      const { videos: feed } = await api.getFeed()
      setVideos(feed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

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
            ? {
                ...v,
                isLiked: liked,
                likesCount: v.likesCount + (liked ? 1 : -1),
              }
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

  return (
    <AppShell header={<FeedHeader />}>
      {loading && (
        <div className="feed-state">
          <div className="spinner" />
          <p>Loading your feed...</p>
        </div>
      )}

      {error && (
        <div className="feed-state">
          <p>{error}</p>
          <button type="button" onClick={loadFeed}>Try again</button>
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

      {!user && !loading && (
        <div className="guest-banner">
          <p>Sign in to like, follow, and post</p>
          <Link to="/login">Log in</Link>
        </div>
      )}
    </AppShell>
  )
}
