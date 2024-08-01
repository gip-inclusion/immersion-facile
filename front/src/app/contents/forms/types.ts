import { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { AutocompleteAttributeValue } from "react-design-system";

export type FormFieldAttributesForContent = {
  label: string;
  hintText?: React.ReactNode;
  placeholder?: string;
  id: string;
  required?: boolean;
  autoComplete?: AutocompleteAttributeValue;
  options?: SelectProps.Option<AlertProps.Severity>[];
};

export type FormFieldAttributes = FormFieldAttributesForContent & {
  name: string;
};
