import { useState } from 'react';
import { config } from '../config';

const FAQS = [
  {
    q: 'Is Omahi just a period tracker?',
    a: "It follows your cycle, but the point isn't logging days — it's turning where you are into gentle, practical suggestions for your work, food, movement and rest.",
  },
  {
    q: 'Is this medical advice?',
    a: 'No. Every suggestion is lifestyle, not medicine. Omahi suggests, never prescribes, and the disclaimer stays visible throughout the app.',
  },
  {
    q: 'When does it launch?',
    a: `We're opening to the waitlist in waves through ${config.launchWindow}. Earlier signups get in sooner.`,
  },
  {
    q: 'What will it cost?',
    a: 'Waitlist members get an extended free trial and founding-member pricing when we launch.',
  },
  {
    q: 'Where does Omahi run?',
    a: 'It starts as a Chrome new-tab companion, so your phase greets you every morning — with mobile following close behind.',
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section
      id="faq"
      className="relative scroll-mt-16 overflow-hidden px-[clamp(18px,5vw,60px)] py-[clamp(44px,6vw,76px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[20px] -left-[60px] h-[340px] w-[460px] rounded-full bg-[rgba(150,88,140,0.14)] blur-[100px]"
      />
      <div className="relative mx-auto max-w-[760px]">
        <div className="mb-[38px] text-center">
          <div className="mb-3 text-[12.5px] font-bold tracking-[0.2em] text-[#c15b7a] uppercase">
            Good questions
          </div>
          <h2 className="m-0 text-[clamp(26px,4vw,40px)] leading-[1.1] font-semibold tracking-[-0.02em]">
            Before you join
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }, index) => {
            const isOpen = open === index;
            return (
              <div
                key={q}
                className="overflow-hidden rounded-[18px] border border-white/68 bg-white/52 backdrop-blur-[22px] backdrop-saturate-[1.6]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-[22px] py-[19px] text-left font-sans text-[17px] font-semibold tracking-[-0.01em] text-ink"
                >
                  <span>{q}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-[22px] leading-none text-[#c94e86] transition-transform duration-200 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-[22px] pb-5 text-[15px] leading-[1.65] text-ink/60">{a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
