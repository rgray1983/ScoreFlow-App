import { useEffect, useId, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
};

export default function SelectField({
  name,
  value,
  defaultValue,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  ariaLabel,
  className = ''
}: SelectFieldProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '');
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function choose(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div className={`sf-select ${open ? 'is-open' : ''} ${className}`.trim()} ref={rootRef}>
      {name ? <input name={name} type="hidden" value={selectedValue} /> : null}
      <button
        aria-controls={`${id}-menu`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="sf-select-trigger"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selected?.label ?? placeholder}</span>
        <svg aria-hidden="true" viewBox="0 0 12 8"><path d="M1 1.5 6 6.5l5-5" /></svg>
      </button>
      {open ? (
        <div className="sf-popover sf-select-menu" id={`${id}-menu`} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === selectedValue}
              className={option.value === selectedValue ? 'is-selected' : ''}
              key={option.value}
              onClick={() => choose(option.value)}
              role="option"
              type="button"
            >
              <span>{option.label}</span>
              {option.value === selectedValue ? <b aria-hidden="true">✓</b> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
