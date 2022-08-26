import React from "react";
import classNames from "classnames";

export type FileProperties = {
  className?: string | object | [];
  label: string;
  multiple?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | undefined;
  errorMessage?: string;
  hint?: string;
};

/**
 *
 * @visibleName File
 */
export const File = ({
  className,
  label,
  errorMessage,
  hint,
  onChange,
  multiple,
}: FileProperties) => {
  const _className = classNames("fr-upload-group", className, {
    [`ds-fr--${label}`]: label,
  });
  return (
    <div className={_className}>
      <label className="fr-label" htmlFor="file-upload">
        {label}
        {hint && <p className="fr-hint-text">{hint}</p>}
      </label>
      <input
        onChange={onChange}
        className="fr-upload"
        type="file"
        aria-describedby={hint || undefined}
        multiple={multiple}
      />
      {errorMessage && (
        <p id="file-upload-with-error-desc-error" className="fr-error-text">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

File.defaultProps = {
  className: "",
  hint: "",
  errorMessage: "",
  multiple: false,
};
