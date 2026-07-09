import { GlassCard } from '@omahi/ui';
import { useRef, useState, type FormEvent } from 'react';
import { config } from '../config';
import { substackSubscribeUrl, validateEmail } from '../lib/waitlist';

const proofLine = config.showSocialProof
  ? `Join ${config.waitlistCount.toLocaleString()}+ already on the list · no spam, ever`
  : "No spam, ever — one warm hello when it's ready.";

/**
 * Email capture card. Valid submit opens the Substack subscribe page (email
 * prefilled) in a new tab and flips to an "Almost done" state that keeps a
 * visible link for the popup-blocked case.
 */
export function WaitlistForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateEmail(emailRef.current?.value ?? '');
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.open(substackSubscribeUrl(result.email), '_blank', 'noopener');
    setError('');
    setSavedEmail(result.email);
  }

  if (savedEmail) {
    return (
      <GlassCard className="max-w-[480px] bg-glass-soft p-[22px] shadow-[0_18px_48px_rgba(46,34,38,0.1)]">
        <div className="flex items-start gap-3.5">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(160deg,#ff8264_0%,#c94e86_100%)] text-[21px] font-bold text-white">
            ✓
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[19px] font-semibold tracking-[-0.01em]">Almost done</div>
            <div className="text-[14.5px] leading-[1.55] text-ink/60">
              Finish subscribing in the Substack tab we just opened — we'll email{' '}
              <b className="font-bold text-ink">{savedEmail}</b> when your phase is ready.
            </div>
            <a
              href={substackSubscribeUrl(savedEmail)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-[14px] font-bold text-rose"
            >
              Tab didn't open? Join the waitlist here
            </a>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-[480px] bg-glass-soft p-[22px] shadow-[0_18px_48px_rgba(46,34,38,0.1)]">
      <div className="flex flex-col gap-3">
        <div className="text-[17px] font-semibold tracking-[-0.01em]">Join the waitlist</div>
        <form noValidate onSubmit={onSubmit} className="flex flex-wrap gap-2.5">
          <input
            ref={emailRef}
            onInput={() => setError('')}
            type="email"
            placeholder="you@email.com"
            aria-label="Email address"
            className={`min-w-0 flex-[1_1_200px] rounded-[14px] border-[1.5px] bg-white/60 px-4 py-3.5 text-base text-ink outline-none focus:border-rose ${
              error ? 'border-[#e0a7a0]' : 'border-white/80'
            }`}
          />
          <button
            type="submit"
            className="cursor-pointer rounded-[14px] border-none bg-rose px-6 py-3.5 text-[15px] font-bold whitespace-nowrap text-white shadow-[0_8px_20px_rgba(214,69,112,0.32)] hover:brightness-105"
          >
            Get early access
          </button>
        </form>
        {error && <div className="text-[13.5px] font-semibold text-danger">{error}</div>}
        <div className="text-[13px] text-ink/45">{proofLine}</div>
      </div>
    </GlassCard>
  );
}
