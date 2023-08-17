import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import classNames, { ArgumentArray } from "classnames";

export type FileProperties = {
  accept?: string;
  className?: ArgumentArray;
  errorMessage?: string;
  hint?: React.ReactNode;
  id: string;
  label: string;
  multiple?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | undefined;
};

/**
 *
 * @visibleName File
 */
export const File = ({
  accept,
  className,
  errorMessage,
  hint,
  id,
  label,
  multiple,
  onChange,
}: FileProperties) => {
  const _className = classNames("fr-upload-group", className, {
    [`ds-fr--${label}`]: label,
  });
  return (
    <div className={_className}>
      <label className={fr.cx("fr-label")} htmlFor={id}>
        {label}
        {hint && <p className={fr.cx("fr-hint-text")}>{hint}</p>}
      </label>
      <input
        onChange={onChange}
        className={fr.cx("fr-upload")}
        type="file"
        id={id}
        aria-label={label}
        multiple={multiple}
        accept={accept}
      />
      {errorMessage && (
        <p
          id="file-upload-with-error-desc-error"
          className={fr.cx("fr-error-text")}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
};

File.defaultProps = {
  className: [""],
  hint: "",
  errorMessage: "",
  multiple: false,
};
