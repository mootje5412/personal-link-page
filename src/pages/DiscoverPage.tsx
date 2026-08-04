import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { api } from '../services/api'
import type { Video } from '../types'
import { formatCount } from '../utils/format'
import './DiscoverPage.css'

export default function DiscoverPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFeed(50).then(({ videos: feed }) => {
      setVideos(feed)
      setLoading(false)
    })
  }, [])

  return (
    <AppShell dark={false}>
      <div className="discover-page">
        <header className="discover-header">
          <h1>Discover</h1>
          <p>Real videos from the community</p>
        </header>

        {loading ? (
          <div className="discover-loading"><div className="discover-spinner" /></div>
        ) : videos.length === 0 ? (
          <div className="discover-empty">
            <span>🎥</span>
            <h2>No videos yet</h2>
            <p>Be the first to post!</p>
            <Link to="/create" className="discover-cta">Create a video</Link>
          </div>
        ) : (
          <div className="discover-grid">
            {videos.map((video) => (
              <Link key={video.id} to={`/watch/${video.id}`} className="discover-card">
                <div className="discover-thumb">
                  <video src={video.videoUrl} muted playsInline preload="metadata" />
                  <div className="discover-overlay">
                    <span>▶ {formatCount(video.likesCount)}</span>
                  </div>
                </div>
                <p className="discover-caption">{video.caption || 'Untitled'}</p>
                <p className="discover-author">@{video.author.username}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
