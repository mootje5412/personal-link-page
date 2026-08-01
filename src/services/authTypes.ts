export type AuthUser = {
  id: number
  username: string
  email: string | null
  keyPrefix?: string
  createdAt?: string
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

export type RegisterResponse = AuthResponse & {
  apiKey: string
  message?: string
}
