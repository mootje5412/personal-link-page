type LogoProps = {
  size?: number
  className?: string
  variant?: 'dark' | 'light'
}

const Logo = ({ size = 32, className, variant = 'dark' }: LogoProps) => {
  const fill = variant === 'light' ? '#FFFFFF' : '#000000'

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M18 22h14L58 98H44L18 22z" fill={fill} />
      <path
        d="M62 22h14v38c0-6 5-16 26-16 19 0 28 12 28 27s-11 28-31 28c-16 0-25-9-26-17V98H62V22z"
        fill={fill}
      />
    </svg>
  )
}

export default Logo
