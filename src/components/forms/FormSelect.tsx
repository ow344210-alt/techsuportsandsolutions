import { forwardRef } from "react";
import ResponsiveSelect from "../ui/ResponsiveSelect";

interface FormSelectProps {
  label?: string;
  name: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  className?: string;
}

const FormSelect = forwardRef<HTMLDivElement, FormSelectProps>(
  (
    {
      label,
      name,
      required,
      error,
      helperText,
      disabled,
      options,
      placeholder,
      value,
      onChange,
      id,
      className,
    },
    ref
  ) => {
    const selectId = id || name;

    return (
      <div ref={ref} className="w-full">
        {label ? (
          <label
            htmlFor={selectId}
            className="mb-2 block text-sm font-semibold uppercase text-slate-200"
          >
            {label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
        ) : null}

        <ResponsiveSelect
          id={selectId}
          value={value ?? ""}
          onChange={onChange ?? (() => {})}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          error={error}
          ariaLabel={label}
          className={className}
        />

        {error ? (
          <p id={`${name}-error`} className="mt-1.5 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {helperText && !error ? (
          <p id={`${name}-helper`} className="mt-1.5 text-xs text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";

export default FormSelect;