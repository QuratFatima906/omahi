import { describe, expect, it } from 'vitest';
import { substackSubscribeUrl, validateEmail } from '../src/lib/waitlist';

describe('validateEmail', () => {
  it.each(['', '   ', '\t'])('rejects blank input %j with the empty-field message', (raw) => {
    expect(validateEmail(raw)).toEqual({ ok: false, message: 'Pop your email in first.' });
  });

  it.each([
    'plainaddress',
    'missing-at.com',
    'no-domain@',
    '@no-local.com',
    'spaces in@local.com',
    'two@@ats.com',
    'no-tld@domain',
  ])('rejects malformed email %j with the check-again message', (raw) => {
    expect(validateEmail(raw)).toEqual({
      ok: false,
      message: "That doesn't look like an email — mind checking?",
    });
  });

  it.each(['you@email.com', 'first.last+tag@sub.domain.co', 'UPPER@CASE.ORG'])(
    'accepts %j',
    (raw) => {
      expect(validateEmail(raw)).toEqual({ ok: true, email: raw });
    },
  );

  it('trims surrounding whitespace and returns the trimmed email', () => {
    expect(validateEmail('  you@email.com  ')).toEqual({ ok: true, email: 'you@email.com' });
  });
});

describe('substackSubscribeUrl', () => {
  it('builds the prefilled subscribe URL', () => {
    expect(substackSubscribeUrl('you@email.com')).toBe(
      'https://herhustlestack.substack.com/subscribe?email=you%40email.com',
    );
  });

  it('URL-encodes characters that are meaningful in query strings', () => {
    expect(substackSubscribeUrl('a+b&c=d@email.com')).toBe(
      'https://herhustlestack.substack.com/subscribe?email=a%2Bb%26c%3Dd%40email.com',
    );
  });

  it('trims whitespace before encoding', () => {
    expect(substackSubscribeUrl(' you@email.com ')).toBe(
      'https://herhustlestack.substack.com/subscribe?email=you%40email.com',
    );
  });
});
