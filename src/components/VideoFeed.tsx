import { useEffect, useRef, useState } from 'react'
import type { Video } from '../types'
import { formatCount } from '../utils/format'
import './VideoFeed.css'

interface VideoFeedProps {
  videos: Video[]
  onLike: (videoId: number) => void
  onFollow?: (username: string) => void
  isAuthenticated: boolean
}

export default function VideoFeed({ videos, onLike, onFollow, isAuthenticated }: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'))
            if (!Number.isNaN(idx)) setActiveIndex(idx)
          }
        })
      },
      { root: container, threshold: 0.65 }
    )

    container.querySelectorAll('.video-slide').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [videos])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.querySelectorAll('video').forEach((video, i) => {
      if (i === activeIndex) {
        video.play().catch(() => {})
      } else {
        video.pause()
        video.currentTime = 0
      }
    })
  }, [activeIndex, videos])

  return (
    <div className="video-feed" ref={containerRef}>
      {videos.map((video, index) => (
        <article key={video.id} className="video-slide" data-index={index}>
          <video
            className="video-player"
            src={video.videoUrl}
            loop
            muted
            playsInline
            preload={index <= 1 ? 'auto' : 'metadata'}
            poster={video.thumbnailUrl || undefined}
          />

          <div className="video-gradient" />

          <div className="video-sidebar">
            <button type="button" className="sidebar-avatar" aria-label={`@${video.author.username}`}>
              <img src={video.author.avatarUrl} alt="" />
              {isAuthenticated && onFollow && (
                <span
                  className="follow-badge"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFollow(video.author.username)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={() => {}}
                >
                  +
                </span>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-action ${video.isLiked ? 'liked' : ''}`}
              onClick={() => onLike(video.id)}
              aria-label="Like"
            >
              <HeartIcon filled={video.isLiked} />
              <span>{formatCount(video.likesCount)}</span>
            </button>

            <button type="button" className="sidebar-action" aria-label="Comments">
              <CommentIcon />
              <span>{formatCount(video.commentsCount)}</span>
            </button>

            <button type="button" className="sidebar-action" aria-label="Share">
              <ShareIcon />
              <span>{formatCount(video.sharesCount)}</span>
            </button>
          </div>

          <div className="video-info">
            <p className="video-author">@{video.author.username}</p>
            <p className="video-caption">{video.caption}</p>
            <p className="video-sound">
              <MusicIcon />
              {video.soundName}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function MusicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}
