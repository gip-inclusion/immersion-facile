import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import { useStyles } from "tss-react/dsfr";
import "./AutocompleteInput.css";

export type AutocompleteInputProps = {
  disabled: boolean | undefined;
  headerClassName: string | undefined;
  id: string | undefined;
  inputStyle: React.CSSProperties | undefined;
  label: string;
  params: AutocompleteRenderInputParams;
  placeholder: string | undefined;
};

export const AutocompleteInput = ({
  disabled,
  headerClassName,
  id,
  inputStyle,
  label,
  params,
  placeholder,
}: AutocompleteInputProps) => {
  const { cx } = useStyles();
  return (
    <div ref={params.InputProps.ref} className={cx("if-autocomplete-input")}>
      <div className={cx("if-autocomplete-input__wrapper")}>
        <label className={cx(fr.cx("fr-label"), headerClassName)} htmlFor={id}>
          {label}
        </label>

        <input
          {...params.inputProps}
          id={id}
          style={inputStyle}
          disabled={disabled}
          className={fr.cx("fr-input")}
          placeholder={placeholder}
          type="text"
        />
      </div>
    </div>
  );
};
