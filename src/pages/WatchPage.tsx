import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import VideoFeed from '../components/VideoFeed'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { Video } from '../types'

export default function WatchPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const videoId = parseInt(id ?? '', 10)
    if (!videoId) return

    Promise.all([
      api.getVideo(videoId),
      api.getFeed(30),
    ]).then(([{ video }, { videos: feed }]) => {
      const rest = feed.filter((v) => v.id !== video.id)
      setVideos([video, ...rest])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

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

  if (loading) {
    return (
      <AppShell>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </AppShell>
    )
  }

  if (videos.length === 0) {
    return (
      <AppShell>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          Video not found
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <VideoFeed
        videos={videos}
        onLike={handleLike}
        isAuthenticated={!!user}
      />
    </AppShell>
  )
}
