import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import React from "react";
import "./AutocompleteInput.css";

export const AutocompleteInput =
  (
    headerClassName: string | undefined,
    label: string,
    inputStyle: React.CSSProperties | undefined,
    disabled: boolean | undefined,
    placeholder: string | undefined,
  ) =>
  (params: AutocompleteRenderInputParams): JSX.Element =>
    (
      <div ref={params.InputProps.ref} className="if-autocomplete-input">
        <div className="if-autocomplete-input__wrapper">
          <label
            className={`fr-label ${headerClassName ?? ""}`}
            htmlFor={"search"}
          >
            {label}
          </label>

          <input
            {...params.inputProps}
            style={inputStyle}
            disabled={disabled}
            className={"fr-input"}
            placeholder={placeholder}
          />
        </div>
      </div>
    );
