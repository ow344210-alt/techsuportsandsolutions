import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  name: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      name,
      required,
      error,
      helperText,
      disabled,
      "aria-describedby": ariaDescribedby,
      options,
      placeholder,
      id,
      className,
      ...selectProps
    },
    ref
  ) => {
    const selectId = id || name;
    const errorId = `${name}-error`;
    const helperId = `${name}-helper`;
    const describedBy = [errorId, helperId, ariaDescribedby]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={selectId}
            className="mb-2 block text-sm font-semibold uppercase text-slate-200"
          >
            {label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
        ) : null}

        <select
          ref={ref}
          id={selectId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={[
            "w-full h-14 rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition",
            "focus:ring-2 focus:ring-violet-500/40 focus:border-transparent",
            disabled ? "opacity-60 cursor-not-allowed" : "",
            error ? "border-red-500/80 focus:border-red-500/80 focus:ring-red-500/30" : "",
            className || "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...selectProps}
        >
          {placeholder ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {helperText && !error ? (
          <p id={helperId} className="mt-1.5 text-xs text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
