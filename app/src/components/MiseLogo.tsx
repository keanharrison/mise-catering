// Mise mark (concept 41, "Forward"): three slanted bars. Inherits color via currentColor.
export function MiseMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="m8 55 18-38h12L20 55Z" />
      <path d="m27 55 18-38h12L39 55Z" />
      <path d="m46 55 13-28h12L58 55Z" />
    </svg>
  )
}

// "Mise" followed by the mark. Sizes with the surrounding font-size.
export function MiseWordmark({ className }: { className?: string }) {
  return (
    <span className={`mise-wordmark${className ? ` ${className}` : ''}`}>
      <span>Mise</span>
      <MiseMark className="mise-wordmark-mark" />
    </span>
  )
}
