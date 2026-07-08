import type { ButtonHTMLAttributes } from 'react';

const base =
  'cursor-pointer rounded-[13px] py-[13px] text-center font-display text-[15px] font-bold ' +
  'disabled:cursor-default disabled:opacity-60';

export function PrimaryButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`${base} bg-rose text-white ${className}`} />;
}

/** Frosted secondary action — glass pane beside the solid rose primary. */
export function SecondaryButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`${base} border border-glass-border bg-glass-soft text-ink-soft backdrop-blur-[12px] ${className}`}
    />
  );
}
