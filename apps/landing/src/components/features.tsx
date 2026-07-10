import { GlassCard } from '@omahi/ui';

const FEATURES = [
  {
    title: 'One glance every morning',
    copy: "Your new tab shows the phase you're in and the single thing worth focusing on today.",
  },
  {
    title: 'Work, food, movement, rest',
    copy: 'Suggestions across every part of your day, shaped by where you are in your cycle.',
  },
  {
    title: 'Warm, never clinical',
    copy: 'Guidance that reads like a friend who gets it — lifestyle, not medicine. You decide.',
  },
  {
    title: 'Private by design',
    copy: 'Your cycle is yours. Omahi keeps your data on your device — no selling, ever.',
  },
];

export function Features() {
  return (
    <section className="relative overflow-hidden px-[clamp(18px,5vw,60px)] py-[clamp(52px,8vw,92px)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[60px] bottom-0 h-[360px] w-[520px] rounded-full bg-[rgba(214,69,112,0.14)] blur-[100px]"
      />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mb-11 text-center">
          <div className="mb-3 text-[12.5px] font-bold tracking-[0.2em] text-[#c15b7a] uppercase">
            What you get
          </div>
          <h2 className="m-0 text-[clamp(28px,4.5vw,44px)] leading-[1.1] font-extrabold tracking-[-0.02em]">
            A calmer way to run your week.
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {FEATURES.map(({ title, copy }, index) => (
            <GlassCard
              key={title}
              className="flex flex-col gap-3 px-[26px] py-7 shadow-[0_12px_34px_rgba(46,34,38,0.06)]"
            >
              <div className="flex size-11 items-center justify-center rounded-[13px] bg-[linear-gradient(160deg,#ff8264_0%,#c94e86_100%)] text-xl font-bold text-white">
                {index + 1}
              </div>
              <div className="text-[19px] font-semibold tracking-[-0.01em]">{title}</div>
              <div className="text-sm leading-[1.6] text-ink/60">{copy}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
