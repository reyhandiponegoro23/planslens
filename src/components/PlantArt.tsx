/** Decorative potted-plant illustration for the home hero. */
export default function PlantArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 170" aria-hidden>
      <g fill="#4f9a5c">
        <path d="M70 110C40 95 22 70 26 40c22 10 40 35 44 70Z" opacity="0.85" />
        <path d="M72 110c4-40 22-70 52-82 4 32-14 62-52 82Z" />
        <path d="M70 112C55 80 52 45 70 15c16 30 14 64 0 97Z" fill="#3c8048" />
        <path d="M68 114C45 110 22 98 10 78c26-6 46 8 58 36Z" opacity="0.7" />
        <path d="M74 114c20-10 42-12 60-4-12 18-36 22-60 4Z" opacity="0.75" />
      </g>
      <g stroke="#2e6b3f" strokeWidth="1.5" fill="none" opacity="0.6">
        <path d="M70 110 32 46M72 110l46-76M70 112V24" />
      </g>
      <path d="M44 112h54l-8 52H52Z" fill="#c98b5e" />
      <path d="M40 106h62v10H40Z" fill="#b5784d" />
    </svg>
  );
}
