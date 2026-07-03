import type { ButtonHTMLAttributes } from 'react';

const base =
  'cursor-pointer rounded-xl py-[13px] text-center font-display text-[15px] font-bold ' +
  'disabled:cursor-default disabled:opacity-60';

export function PrimaryButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`${base} bg-brand-gradient text-white ${className}`}
    />
  );
}

export function SecondaryButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`${base} border-[1.5px] border-line text-ink-muted ${className}`}
    />
  );
}
