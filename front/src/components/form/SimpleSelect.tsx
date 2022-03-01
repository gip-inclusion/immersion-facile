import { FormControl, InputBase, MenuItem, Select } from "@mui/material";
import { useField } from "formik";
import * as React from "react";

type SimpleSelectProps = {
  label: string;
  id: string;
  name: string;
  options: Array<{ value: string; label: string }>;
};

export const SimpleSelect = ({
  id,
  label,
  name,
  options,
}: SimpleSelectProps) => {
  const [field, meta] = useField<string>({ name });
  const hasError = meta.touched && !!meta.error;

  return (
    <FormControl fullWidth error={hasError}>
      <div
        className={`fr-input-group ${hasError ? " fr-input-group--error" : ""}`}
      >
        <label className="fr-label" htmlFor={id}>
          {label}
        </label>
        <Select
          id={id}
          label={label}
          {...field}
          input={
            <InputBase
              {...field}
              className={`fr-input ${hasError ? "fr-input--error" : ""}`}
              placeholder="Rouen"
            />
          }
        >
          {options.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
        {meta.error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>
        )}
      </div>
    </FormControl>
  );
};
