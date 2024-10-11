import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import React from "react";
import "./AutocompleteInput.css";

export type AutocompleteInputProps = {
  disabled: boolean | undefined;
  headerClassName: string | undefined;
  id: string | undefined;
  inputStyle: React.CSSProperties | undefined;
  label: string;
  params: AutocompleteRenderInputParams;
  placeholder: string | undefined;
  state?: InputProps["state"];
  stateRelatedMessage?: InputProps["stateRelatedMessage"];
};

export const AutocompleteInput = ({
  disabled,
  id,
  inputStyle,
  label,
  params,
  placeholder,
  state,
  stateRelatedMessage,
}: AutocompleteInputProps) => (
  <Input
    ref={params.InputProps.ref}
    label={label}
    nativeInputProps={{
      ...params.inputProps,
      id,
      style: inputStyle,
      placeholder,
    }}
    disabled={disabled}
    state={state}
    stateRelatedMessage={stateRelatedMessage}
  />
);
