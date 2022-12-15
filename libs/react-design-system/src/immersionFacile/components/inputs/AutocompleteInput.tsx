import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import React from "react";
import "./AutocompleteInput.css";

export const AutocompleteInput =
  (
    headerClassName: string | undefined,
    label: string | undefined,
    inputStyle: React.CSSProperties | undefined,
    disabled: boolean | undefined,
    placeholder: string | undefined,
    id: string | undefined,
  ) =>
  (params: AutocompleteRenderInputParams): JSX.Element =>
    (
      <div ref={params.InputProps.ref} className="if-autocomplete-input">
        <div className="if-autocomplete-input__wrapper">
          {label && (
            <label className={`fr-label ${headerClassName ?? ""}`} htmlFor={id}>
              {label}
            </label>
          )}

          <input
            {...params.inputProps}
            id={id}
            style={inputStyle}
            disabled={disabled}
            className={"fr-input"}
            placeholder={placeholder}
            type="text"
          />
        </div>
      </div>
    );
