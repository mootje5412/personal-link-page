type IconProps = {
  className?: string
}

export const IconId = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <path d="M7 10h6M7 14h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="16.5" cy="12" r="2" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

export const IconUser = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
    <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)

export const IconLocation = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

export const IconPhone = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <path d="M10 18h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)

export const IconFamily = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.75" />
    <path d="M4 19c0-2.5 2.24-4.5 5-4.5M14 19c0-1.8 1.34-3.2 3-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="6.5" cy="12" r="1.75" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

export const IconGlobe = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
    <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9M12 3c-2.5 2.7-4 6-4 9s1.5 6.3 4 9" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

export const IconZap = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
  </svg>
)

export const IconShield = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 4 6v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconRefresh = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12a8 8 0 0 1 13.7-5.7M20 12a8 8 0 0 1-13.7 5.7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M16 4h4v4M8 20H4v-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconArrow = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export type SearchIconId = 'tc' | 'isim' | 'adres' | 'telefon' | 'aile' | 'ip'

const iconMap = {
  tc: IconId,
  isim: IconUser,
  adres: IconLocation,
  telefon: IconPhone,
  aile: IconFamily,
  ip: IconGlobe,
} as const

export function SearchTypeIcon({ id, className }: { id: SearchIconId; className?: string }) {
  const Icon = iconMap[id]
  return <Icon className={className} />
}
