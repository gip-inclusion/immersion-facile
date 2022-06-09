import React from "react";
import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";

export const AutocompleteInput =
  (
    headerClassName: string | undefined,
    label: string,
    inputStyle: React.CSSProperties | undefined,
    disabled: boolean | undefined,
  ) =>
  (params: AutocompleteRenderInputParams): JSX.Element =>
    (
      <div ref={params.InputProps.ref}>
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
          placeholder="Rouen"
        />
      </div>
    );
