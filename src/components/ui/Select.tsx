import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
  children?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, children, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[hsl(var(--foreground))]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))]
            px-3 py-2 text-sm text-[hsl(var(--foreground))]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-[hsl(var(--destructive))]' : ''}
            ${className}
          `}
          {...props}
        >
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
