import { GlassPanel } from '@omahi/ui';
import { WaitlistForm } from './waitlist-form';

const PHASE_DOTS = ['#c74b6b', '#e8875b', '#e3a94a', '#96588c'];

/** Static glass rendering of the extension popup — illustration, not the real component. */
function ProductMockup() {
  return (
    <div className="relative w-full max-w-[400px]">
      {/* ambient behind the glass */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[10px] -left-[30px] h-[220px] w-[260px] rounded-full bg-[rgba(232,135,91,0.5)] blur-[60px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[30px] bottom-[20px] h-[220px] w-[240px] rounded-full bg-[rgba(214,69,112,0.42)] blur-[60px]"
      />

      {/* glass popup card */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/40 shadow-[0_30px_70px_rgba(46,34,38,0.2)] backdrop-blur-[30px] backdrop-saturate-[1.8]">
        <div className="flex flex-col gap-3.5 p-5 pb-6">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-ink/50">
              omahi
            </span>
            <span aria-hidden="true" className="text-sm text-ink/30">
              ⚙
            </span>
          </div>

          {/* phase card */}
          <div className="rounded-[20px] border border-white/70 bg-white/55 px-5 py-[18px] backdrop-blur-[20px] backdrop-saturate-[1.6]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-[0.14em] text-[#d96f3f] uppercase">
                  Follicular · day 9
                </div>
                <div className="mt-[5px] text-[22px] leading-[1.25] font-bold tracking-[-0.01em]">
                  Big-idea energy
                </div>
              </div>
              <svg width="50" height="50" viewBox="0 0 52 52" aria-hidden="true">
                <circle
                  cx="26"
                  cy="26"
                  r="21.5"
                  fill="none"
                  stroke="rgba(46,34,38,0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="26"
                  cy="26"
                  r="21.5"
                  fill="none"
                  stroke="#e8875b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="43 135"
                  transform="rotate(-90 26 26)"
                />
              </svg>
            </div>
            <div className="mt-3.5 flex gap-[5px]">
              <div className="h-[7px] flex-[5] rounded-full bg-[rgba(199,75,107,0.3)]" />
              <div className="relative h-[7px] flex-[7] rounded-full bg-[rgba(232,135,91,0.3)]">
                <div className="absolute inset-y-0 left-0 w-[55%] rounded-full bg-[#e8875b]" />
              </div>
              <div className="h-[7px] flex-[3] rounded-full bg-[rgba(227,169,74,0.3)]" />
              <div className="h-[7px] flex-[13] rounded-full bg-[rgba(150,88,140,0.25)]" />
            </div>
            <div className="mt-2.5 text-xs text-ink/55">Ovulation window opens in 6 days</div>
          </div>

          {/* suggestion rows */}
          <div className="flex flex-col gap-2">
            <GlassPanel className="flex items-start gap-[11px] bg-white/48 px-[15px] py-[11px]">
              <div className="mt-[5px] size-[9px] shrink-0 rounded-full bg-[#e8875b]" />
              <div className="text-[13px] leading-normal">
                <b className="font-bold">Work</b> — start the project you've been circling
              </div>
            </GlassPanel>
            <GlassPanel className="flex items-start gap-[11px] bg-white/48 px-[15px] py-[11px]">
              <div className="mt-[5px] size-[9px] shrink-0 rounded-full bg-[#e8875b]" />
              <div className="text-[13px] leading-normal">
                <b className="font-bold">Move</b> — mid-range intensity; energy is climbing
              </div>
            </GlassPanel>
          </div>

          {/* nudge */}
          <div className="rounded-[14px] border border-[rgba(232,135,91,0.28)] bg-[rgba(232,135,91,0.16)] px-[15px] py-3 text-[12.5px] leading-[1.55]">
            <b className="font-bold text-[#c25e2f]">Today's nudge</b> · That idea from yesterday?
            Today's the day to open the doc.
          </div>
        </div>
      </div>

      {/* floating glass pills */}
      <div className="animate-float absolute top-[30px] -right-[18px] flex items-center gap-[9px] rounded-[14px] border border-white/75 bg-white/55 px-[13px] py-[9px] shadow-[0_14px_30px_rgba(46,34,38,0.14)] backdrop-blur-[20px] backdrop-saturate-[1.7]">
        <div className="size-2.5 rounded-full bg-[#e3a94a]" />
        <span className="text-[12.5px] font-bold">Ovulation in 6 days</span>
      </div>
      <div
        className="animate-float-sm absolute -bottom-[10px] -left-[20px] flex items-center gap-[9px] rounded-[14px] border border-white/75 bg-white/55 px-[13px] py-[9px] shadow-[0_14px_30px_rgba(46,34,38,0.14)] backdrop-blur-[20px] backdrop-saturate-[1.7]"
        style={{ animationDelay: '0.6s' }}
      >
        <div className="size-2.5 rounded-full bg-[#c74b6b]" />
        <span className="text-[12.5px] font-bold">Rest counts as progress</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <header className="relative overflow-hidden px-[clamp(18px,5vw,60px)] pt-[clamp(44px,7vw,92px)] pb-[clamp(52px,8vw,104px)]">
      {/* ambient light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[120px] -right-[80px] h-[440px] w-[520px] rounded-full bg-[rgba(255,130,100,0.5)] blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[120px] right-[200px] h-[340px] w-[380px] rounded-full bg-[rgba(227,169,74,0.32)] blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[160px] -left-[100px] h-[460px] w-[520px] rounded-full bg-[rgba(150,88,140,0.34)] blur-[95px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[40px] left-[260px] h-[320px] w-[360px] rounded-full bg-[rgba(214,69,112,0.28)] blur-[90px]"
      />

      <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-[clamp(36px,6vw,76px)]">
        {/* Left: pitch + form */}
        <div id="join" className="flex min-w-[300px] flex-[1_1_380px] scroll-mt-24 flex-col gap-6">
          <div className="inline-flex items-center gap-2.5 self-start rounded-full border border-white/70 bg-white/50 py-[7px] pr-4 pl-[9px] backdrop-blur-[18px] backdrop-saturate-[1.6]">
            <span className="inline-flex gap-1">
              {PHASE_DOTS.map((color) => (
                <span key={color} className="size-2 rounded-full" style={{ background: color }} />
              ))}
            </span>
            <span className="text-[12.5px] font-bold tracking-[0.02em] text-ink/60">
              Early access · opening in waves
            </span>
          </div>

          <h1 className="m-0 text-[clamp(40px,6vw,66px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
            Plan your days around <span className="text-[#d14c72]">your cycle</span>, not against
            it.
          </h1>

          <p className="m-0 max-w-[470px] text-[clamp(16px,2vw,19px)] leading-relaxed text-ink/60">
            Omahi shapes your work, food, movement and rest around the four phases of your cycle —
            one gentle suggestion at a time. Warm, calm, never clinical.
          </p>

          <WaitlistForm />
        </div>

        {/* Right: product mockup */}
        <div className="flex min-w-[300px] flex-[1_1_360px] justify-center">
          <ProductMockup />
        </div>
      </div>
    </header>
  );
}
