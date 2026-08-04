import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { api } from '../services/api'
import type { Video } from '../types'
import { formatCount } from '../utils/format'
import './DiscoverPage.css'

export default function DiscoverPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFeed(30).then(({ videos: feed }) => {
      setVideos(feed)
      setLoading(false)
    })
  }, [])

  return (
    <AppShell dark={false}>
      <div className="discover-page">
        <header className="discover-header">
          <h1>Discover</h1>
          <p>Trending videos on Loop</p>
        </header>

        {loading ? (
          <div className="discover-loading">Loading...</div>
        ) : (
          <div className="discover-grid">
            {videos.map((video) => (
              <article key={video.id} className="discover-card">
                <div className="discover-thumb">
                  <video src={video.videoUrl} muted playsInline preload="metadata" />
                  <div className="discover-overlay">
                    <span>▶ {formatCount(video.likesCount)}</span>
                  </div>
                </div>
                <p className="discover-caption">{video.caption}</p>
                <p className="discover-author">@{video.author.username}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
