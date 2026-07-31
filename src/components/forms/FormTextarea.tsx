import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  name: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
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
      rows = 4,
      ...textareaProps
    },
    ref
  ) => {
    const textareaId = id || name;
    const errorId = `${name}-error`;
    const helperId = `${name}-helper`;
    const describedBy = [errorId, helperId, ariaDescribedby]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={textareaId}
            className="mb-2 block text-sm font-semibold uppercase text-slate-200"
          >
            {label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
        ) : null}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          disabled={disabled}
          required={required}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={[
            "w-full min-h-[80px] sm:min-h-[100px] rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none transition",
            "focus:ring-2 focus:ring-violet-500/40 focus:border-transparent",
            "placeholder:text-gray-500",
            disabled ? "opacity-60 cursor-not-allowed" : "",
            error ? "border-red-500/80 focus:border-red-500/80 focus:ring-red-500/30" : "",
            className || "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...textareaProps}
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

FormTextarea.displayName = "FormTextarea";

export default FormTextarea;
