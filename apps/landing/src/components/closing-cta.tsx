/** Brand-gradient closing panel: wordmark, "Love every phase.", CTA back to the form. */
export function ClosingCta() {
  return (
    <section className="px-[clamp(18px,5vw,60px)] pt-[clamp(18px,5vw,44px)] pb-[clamp(48px,7vw,88px)]">
      <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#ff8264_0%,#e45a7e_55%,#c94e86_100%)] px-[clamp(24px,5vw,64px)] py-[clamp(44px,7vw,82px)] shadow-[0_30px_70px_rgba(201,78,134,0.34)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[30px] -left-[40px] h-[260px] w-[320px] rounded-full bg-[rgba(255,190,150,0.5)] blur-[70px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[50px] bottom-[20px] h-[260px] w-[320px] rounded-full bg-[rgba(180,70,140,0.5)] blur-[75px]"
        />
        <div className="relative flex flex-col items-center gap-[22px] text-center">
          <span className="font-display text-[clamp(48px,7vw,78px)] leading-none font-bold tracking-[-0.02em] text-white">
            omahi
          </span>
          <h2 className="m-0 text-[clamp(26px,4vw,42px)] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance text-white">
            Love every phase.
          </h2>
          <p className="m-0 max-w-[440px] text-[clamp(15px,2vw,18px)] leading-[1.55] text-white/85">
            Join the waitlist and be among the first to plan with your cycle, not against it.
          </p>
          <a
            href="#join"
            className="mt-1 rounded-full border border-white/60 bg-white/92 px-8 py-[15px] text-base font-bold text-[#c94e86] shadow-[0_12px_30px_rgba(46,34,38,0.2)] backdrop-blur-[10px] hover:brightness-[0.97]"
          >
            Get early access
          </a>
        </div>
      </div>
    </section>
  );
}
