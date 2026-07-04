import { PrimaryButton } from './buttons';

interface WelcomeScreenProps {
  onBegin(): void;
}

export function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-brand-gradient flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-display text-[52px] font-bold tracking-tight text-white">omahi</h1>
        <p className="font-display text-[19px] font-semibold text-[#ffe3d6]">Love every phase.</p>
      </div>
      <div className="flex flex-col gap-4 px-7 pt-7 pb-6">
        <h2 className="font-display text-[21px] font-bold">Hi, I&apos;m Omahi</h2>
        <p className="text-[14.5px] leading-[1.65] text-ink-soft">
          I plan your work, meals, movement, and rest around the four phases of your cycle. Three
          quick questions and we&apos;re set.
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          Omahi offers lifestyle suggestions, not medical advice. Everything stays on your device —
          no account, no server.
        </p>
        <PrimaryButton onClick={onBegin} className="py-3.5 text-base">
          Let&apos;s begin
        </PrimaryButton>
      </div>
    </div>
  );
}
