import type { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import type { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import type { ReactNode } from "react";
import type { AutocompleteAttributeValue } from "react-design-system";

export type FormFieldAttributesForContent = {
  label: string;
  hintText?: ReactNode;
  placeholder?: string;
  id: string;
  required?: boolean;
  autoComplete?: AutocompleteAttributeValue;
  options?: SelectProps.Option<AlertProps.Severity>[];
};

export type FormFieldAttributes = FormFieldAttributesForContent & {
  name: string;
};
