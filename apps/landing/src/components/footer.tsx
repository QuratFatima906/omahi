/** Wordmark + the project's hard-rule disclaimer line. */
export function Footer() {
  return (
    <footer className="border-t border-white/50 px-[clamp(18px,5vw,60px)] pt-[34px] pb-[46px]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3.5">
        <span className="font-display text-[21px] font-bold tracking-[-0.02em] text-[#c94e86]">
          omahi
        </span>
        <span className="text-[13.5px] text-ink/40">
          Lifestyle guidance, not medical advice. © 2026 Omahi.
        </span>
      </div>
    </footer>
  );
}
