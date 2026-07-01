// Irish Grid wordmark (§13): simple, modern, understated grid/energy motif.
export function Wordmark({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 40"
      role="img"
      aria-label="Irish Grid"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* grid/energy motif: a small pylon-like grid of connected nodes */}
      <g stroke="#4db8e8" strokeWidth="2" fill="none">
        <path d="M6 30 L18 10 L30 30" />
        <path d="M10 22 L26 22" />
        <path d="M14 30 L18 20 L22 30" />
      </g>
      <circle cx="18" cy="10" r="2.5" fill="#4db8e8" />
      <text
        x="42"
        y="27"
        fontFamily="var(--font-inter), Inter, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="currentColor"
      >
        Irish
        <tspan fill="#4db8e8"> Grid</tspan>
      </text>
    </svg>
  );
}
