/** The brand mark: a line-drawn jar with glowing dots (Tech Spec §9.7). */
export function JarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <rect x="15" y="5" width="18" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M17 10v3c-4 2-7 5-7 10v14a6 6 0 0 0 6 6h16a6 6 0 0 0 6-6V23c0-5-3-8-7-10v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="33" r="2.5" fill="var(--light)" />
      <circle cx="28" cy="28" r="2" fill="var(--light)" />
      <circle cx="26" cy="37" r="1.5" fill="var(--light)" />
      <circle cx="19" cy="25" r="1.2" fill="var(--light)" />
    </svg>
  );
}
