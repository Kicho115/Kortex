interface KortexIconProps {
  className?: string
}

export default function KortexIcon({ className }: KortexIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="6" cy="8" r="2" fill="currentColor" opacity="0.85" />
      <circle cx="18" cy="8" r="2" fill="currentColor" opacity="0.85" />
      <circle cx="5" cy="16" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="19" cy="16" r="2" fill="currentColor" opacity="0.7" />
      <path
        d="M12 9L8 9.5M12 9L16 9.5M12 15L7 15.5M12 15L17 15.5M9 10L7 8M15 10L17 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  )
}
