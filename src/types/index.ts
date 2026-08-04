export interface User {
  id: number
  username: string
  displayName: string
  email: string | null
  bio: string
  avatarUrl: string
  createdAt: string
  followers: number
  following: number
  videoCount: number
  totalLikes: number
  isFollowing?: boolean
}

export interface Video {
  id: number
  caption: string
  videoUrl: string
  thumbnailUrl: string
  soundName: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  createdAt: string
  isLiked: boolean
  author: {
    id: number
    username: string
    displayName: string
    avatarUrl: string
  }
}

export interface AuthResponse {
  user: User
  token: string
}
