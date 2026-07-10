/**
 * Waitlist plumbing — pure functions only, so they stay trivially testable.
 * The waitlist lives on Substack: we validate locally, then send the visitor
 * to the subscribe page with their email prefilled (no API, no CORS, no key).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SUBSTACK_SUBSCRIBE_BASE = 'https://herhustlestack.substack.com/subscribe';

export type EmailValidation = { ok: true; email: string } | { ok: false; message: string };

export function validateEmail(raw: string): EmailValidation {
  const email = raw.trim();
  if (!email) {
    return { ok: false, message: 'Pop your email in first.' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, message: "That doesn't look like an email — mind checking?" };
  }
  return { ok: true, email };
}

export function substackSubscribeUrl(email: string): string {
  return `${SUBSTACK_SUBSCRIBE_BASE}?email=${encodeURIComponent(email.trim())}`;
}
