import Input, { type InputProps } from "@codegouvfr/react-dsfr/Input";
import type { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import type { CSSProperties, ReactNode } from "react";

import "./AutocompleteInput.css";

export type AutocompleteInputProps = {
  disabled: boolean | undefined;
  headerClassName: string | undefined;
  id: string | undefined;
  inputStyle: CSSProperties | undefined;
  label: ReactNode;
  params: AutocompleteRenderInputParams;
  placeholder: string | undefined;
  state?: InputProps["state"];
  stateRelatedMessage?: InputProps["stateRelatedMessage"];
  hintText?: ReactNode;
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
  hintText,
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
    hintText={hintText}
    disabled={disabled}
    state={state}
    stateRelatedMessage={stateRelatedMessage}
  />
);
