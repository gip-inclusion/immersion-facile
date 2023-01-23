import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

export type SelectOption = {
  label: string;
  value: string | number | readonly string[] | undefined;
  disabled?: boolean;
  hidden?: boolean;
};

export type SelectProps = {
  options: SelectOption[];
  value?: string | number;
  label: string;
  hideLabel?: boolean;
  id: string;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
  placeholder?: string;
};

export const Select = ({
  options,
  label,
  value,
  id,
  name,
  onChange,
  hideLabel,
  className,
  placeholder,
}: SelectProps) => {
  const { cx } = useStyles();

  return (
    <div className={cx(fr.cx("fr-select-group"), className)}>
      {!hideLabel && (
        <label className={fr.cx("fr-label")} htmlFor={id}>
          {label}
        </label>
      )}

      <select
        className={fr.cx("fr-select")}
        id={id}
        name={name}
        onChange={onChange}
        value={value}
      >
        {placeholder && (
          <option value="" disabled selected>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => {
          const { label, value, ...rest } = option;
          return (
            <option value={value} key={`option-${value}-${index}`} {...rest}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
};
