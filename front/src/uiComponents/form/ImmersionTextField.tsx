import React from "react";

interface ImmersionTextFieldProps {
  name: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyPress?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  error?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
  type?: string;
}

export const ImmersionTextField = ({
  value,
  type,
  onBlur,
  onChange,
  onKeyPress,
  error,
  className,
  placeholder,
  description,
  label,
  multiline,
  disabled,
  name,
}: ImmersionTextFieldProps) => (
  <>
    <div
      className={`fr-input-group${error ? " fr-input-group--error" : ""} ${
        className ?? ""
      }`}
    >
      <label className="fr-label" htmlFor={name}>
        {label}
      </label>
      {description && (
        <span className="fr-hint-text" id="select-hint-desc-hint">
          {description}
        </span>
      )}
      {multiline ? (
        <textarea
          id={name}
          value={value}
          name={name}
          onKeyPress={onKeyPress}
          onChange={onChange}
          onBlur={onBlur}
          className={`fr-input${error ? " fr-input--error" : ""}`}
          placeholder={placeholder || ""}
          aria-describedby="text-input-error-desc-error"
          disabled={disabled}
          rows={4}
        />
      ) : (
        <input
          id={name}
          value={value}
          type={type}
          name={name}
          onKeyPress={onKeyPress}
          onChange={onChange}
          onBlur={onBlur}
          className={`fr-input${error ? " fr-input--error" : ""}`}
          placeholder={placeholder || ""}
          aria-describedby="text-input-error-desc-error"
          disabled={disabled}
        />
      )}
      {error && (
        <p id="text-input-email-error-desc-error" className="fr-error-text">
          {error}
        </p>
      )}
    </div>
  </>
);
