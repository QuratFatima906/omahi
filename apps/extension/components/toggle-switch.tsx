interface ToggleSwitchProps {
  checked: boolean;
  /** Accessible name; e2e asserts via role=switch + this label. */
  label: string;
  onToggle: () => void;
}

export function ToggleSwitch({ checked, label, onToggle }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-[27px] w-[46px] shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? 'bg-rose' : 'bg-ink/15'
      }`}
    >
      <span
        className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-[3px]'
        }`}
      />
    </button>
  );
}
