/** Sticky glass nav: wordmark left, section anchors + join CTA right. */
export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/55 bg-[rgba(243,233,227,0.6)] px-[clamp(18px,5vw,60px)] py-3.5 backdrop-blur-[20px] backdrop-saturate-[1.6]">
      <a href="/" className="font-display text-[25px] font-bold tracking-[-0.02em] text-[#c94e86]">
        omahi
      </a>
      <div className="flex items-center gap-[clamp(14px,3vw,34px)]">
        <a href="#how" className="text-[14.5px] font-bold text-ink/75 hover:text-ink">
          How it works
        </a>
        <a href="#faq" className="text-[14.5px] font-bold text-ink/75 hover:text-ink">
          FAQ
        </a>
        <a
          href="#join"
          className="rounded-full bg-rose px-5 py-2.5 text-[14.5px] font-bold text-white shadow-[0_6px_18px_rgba(214,69,112,0.3)]"
        >
          Join waitlist
        </a>
      </div>
    </nav>
  );
}
