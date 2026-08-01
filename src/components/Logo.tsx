type LogoProps = {
  size?: number
  className?: string
  variant?: 'dark' | 'light'
}

const Logo = ({ size = 32, className, variant = 'dark' }: LogoProps) => {
  const fill = variant === 'light' ? '#ffffff' : '#000000'

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8 9h5.2L22.5 39H17.3L8 9z" fill={fill} />
      <path
        d="M25.2 9H30v14.8c0-2.6 2-7 9.8-7 7.2 0 10.5 4.6 10.5 10.2 0 6.4-4.4 11-12.3 11-6.4 0-9.8-3.6-10-7V39h-4.8V9h1.8z"
        fill={fill}
      />
    </svg>
  )
}

export default Logo
