import { ambient, GlassCard, PHASE_STYLE } from '@omahi/ui';

const PHASES: Array<{
  phase: keyof typeof PHASE_STYLE;
  name: string;
  motto: string;
  copy: string;
}> = [
  {
    phase: 'menstruation',
    name: 'Menstruation',
    motto: 'Rest & reflect',
    copy: 'Lighter schedule, warmer meals, gentle movement. Omahi keeps the day soft.',
  },
  {
    phase: 'follicular',
    name: 'Follicular',
    motto: 'Build & begin',
    copy: 'Energy climbing. A good week to start projects and push a little harder.',
  },
  {
    phase: 'ovulation',
    name: 'Ovulation',
    motto: 'Shine & connect',
    copy: 'Peak energy. Take the big meeting, the pitch, the hard conversation.',
  },
  {
    phase: 'luteal',
    name: 'Luteal',
    motto: 'Settle & sort',
    copy: 'Wind down. Clear the small stuff so next cycle starts clean.',
  },
];

export function PhaseCards() {
  return (
    <section
      id="how"
      className="relative scroll-mt-16 overflow-hidden px-[clamp(18px,5vw,60px)] py-[clamp(52px,8vw,92px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30px] left-1/2 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(227,169,74,0.16)] blur-[100px]"
      />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mb-11 text-center">
          <div className="mb-3 text-[12.5px] font-bold tracking-[0.2em] text-[#c15b7a] uppercase">
            Four phases, one companion
          </div>
          <h2 className="m-0 text-[clamp(28px,4.5vw,44px)] leading-[1.1] font-extrabold tracking-[-0.02em]">
            Your body has a rhythm. Omahi plans with it.
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          {PHASES.map(({ phase, name, motto, copy }) => {
            const style = PHASE_STYLE[phase];
            return (
              <div key={phase} className="relative overflow-hidden rounded-[22px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 blur-[44px]"
                  style={{ background: ambient(style.color, 45) }}
                />
                <GlassCard className="relative flex h-full flex-col gap-[11px] px-6 py-[26px]">
                  <div
                    className="size-[38px] rounded-xl"
                    style={{
                      background: style.color,
                      boxShadow: `0 6px 16px ${ambient(style.color, 40)}`,
                    }}
                  />
                  <div className="text-xl font-semibold tracking-[-0.01em]">{name}</div>
                  <div
                    className="text-[11.5px] font-extrabold tracking-[0.1em] uppercase"
                    style={{ color: style.deep }}
                  >
                    {motto}
                  </div>
                  <div className="text-sm leading-[1.6] text-ink/60">{copy}</div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
