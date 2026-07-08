interface WelcomeScreenProps {
  onBegin(): void;
}

export function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <div className="bg-welcome-gradient relative flex h-full flex-col overflow-hidden">
      {/* Warm accents floating in the brand field; fixed alphas read on both
          the light and dark welcome gradients. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[7%] -left-[8%] h-[34%] w-[60%] rounded-full bg-[rgba(255,180,140,0.45)] blur-[60px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] bottom-[10%] h-[34%] w-[60%] rounded-full bg-[rgba(190,75,145,0.45)] blur-[65px]"
      />
      <div className="relative mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto px-7 pt-10 pb-6">
        <div className="flex min-h-[150px] flex-1 flex-col items-center justify-center gap-2.5 text-center">
          <h1 className="font-display text-[54px] font-bold tracking-tight text-white">omahi</h1>
          <p className="font-display text-[18px] font-semibold text-white/85">Love every phase.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3.5 rounded-[22px] border border-white/30 bg-white/20 p-6 backdrop-blur-[18px] backdrop-saturate-150 dark:border-white/20 dark:bg-white/10">
          <h2 className="font-display text-[20px] font-bold text-white">Hi, I&apos;m Omahi</h2>
          <p className="text-[14.5px] leading-[1.6] text-white/90">
            I plan your work, meals, movement, and rest around the four phases of your cycle. Three
            quick questions and we&apos;re set.
          </p>
          <p className="text-xs leading-relaxed text-white/70">
            Omahi offers lifestyle suggestions, not medical advice. Everything stays on your device
            — no account, no server.
          </p>
          <button
            type="button"
            onClick={onBegin}
            className="mt-1 cursor-pointer rounded-[14px] bg-white py-3.5 text-center font-display text-base font-bold text-rose"
          >
            Let&apos;s begin
          </button>
        </div>
      </div>
    </div>
  );
}
