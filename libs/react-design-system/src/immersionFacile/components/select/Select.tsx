import React from "react";

export type SelectOption = {
  label: string;
  value: string | number | readonly string[] | undefined;
  selected?: boolean;
  disabled?: boolean;
  hidden?: boolean;
};

export type SelectProps = {
  options: SelectOption[];
  label: string;
  hideLabel?: boolean;
  id: string;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
};

export const Select = ({
  options,
  label,
  id,
  name,
  onChange,
  hideLabel,
  className,
}: SelectProps) => (
  <div className={`fr-select-group ${className ?? ""}`}>
    {!hideLabel && (
      <label className="fr-label" htmlFor={id}>
        {label}
      </label>
    )}

    <select className="fr-select" id={id} name={name} onChange={onChange}>
      {options.map((option) => {
        const { label, value, ...rest } = option;
        return (
          <option value={value} {...rest}>
            {label}
          </option>
        );
      })}
    </select>
  </div>
);
