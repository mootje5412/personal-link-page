type LogoProps = {
  size?: number
  className?: string
}

const Logo = ({ size = 32, className }: LogoProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 6h5.5L21 42h-5L5 6z"
      fill="currentColor"
    />
    <path
      d="M23.5 6H28v15.5c0-2.4 1.8-6.5 10-6.5 7.5 0 11 4.8 11 10.8 0 6.8-4.5 11.7-12.5 11.7-6.5 0-10-3.5-10.5-7V42h-4.5V6h1.5z"
      fill="currentColor"
    />
  </svg>
)

export default Logo
