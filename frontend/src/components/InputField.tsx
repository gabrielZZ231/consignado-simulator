import { AlertCircle } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  prefixText?: string;
  icon?: ReactNode;
  mono?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  {
    id,
    label,
    hint,
    error,
    required = false,
    prefixText,
    icon,
    mono = false,
    className = '',
    disabled,
    ...rest
  },
  ref
) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  const describedBy = [hint ? hintId : null, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ');

  const hasLeftAdornment = Boolean(prefixText || icon);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold tracking-wide text-[#102A43]"
      >
        {label}
        {required && (
          <span className="ml-1 text-rose-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {hasLeftAdornment && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-slate-500"
          >
            {prefixText ? <span>{prefixText}</span> : icon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          className={[
            'block min-h-[44px] w-full rounded-xl border bg-white py-2.5 text-sm text-[#102A43] shadow-2xs transition',
            'placeholder:text-slate-400',
            'focus:outline-none focus-visible:ring-2',
            'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
            hasLeftAdornment ? 'pl-10 pr-3.5' : 'px-3.5',
            mono ? 'font-mono' : 'font-sans',
            hasError
              ? 'border-rose-400 bg-rose-50/20 focus-visible:border-rose-500 focus-visible:ring-rose-500/25'
              : 'border-slate-300 hover:border-slate-400 focus-visible:border-[#00B8DC] focus-visible:ring-[#00B8DC]/30'
          ].join(' ')}
          {...rest}
        />
      </div>

      {hint && (
        <p id={hintId} className="mt-1.5 text-[11px] leading-snug text-slate-500">
          {hint}
        </p>
      )}

      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-700"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
