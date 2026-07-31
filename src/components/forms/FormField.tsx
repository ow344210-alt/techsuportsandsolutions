import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      required,
      error,
      helperText,
      disabled,
      "aria-describedby": ariaDescribedby,
      id,
      className,
      ...inputProps
    },
    ref
  ) => {
    const inputId = id || name;
    const errorId = `${name}-error`;
    const helperId = `${name}-helper`;
    const describedBy = [errorId, helperId, ariaDescribedby]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold uppercase text-slate-200"
          >
            {label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={[
            "w-full h-14 rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition",
            "focus:ring-2 focus:ring-violet-500/40 focus:border-transparent",
            "placeholder:text-gray-500",
            disabled ? "opacity-60 cursor-not-allowed" : "",
            error ? "border-red-500/80 focus:border-red-500/80 focus:ring-red-500/30" : "",
            className || "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...inputProps}
        />

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

FormField.displayName = "FormField";

export default FormField;
