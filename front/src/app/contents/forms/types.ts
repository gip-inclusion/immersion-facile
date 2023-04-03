import { AutocompleteAttributeValue } from "react-design-system";

export type FormFieldAttributesForContent = {
  label: string;
  hintText?: string;
  placeholder?: string;
  id: string;
  required?: boolean;
  autoComplete?: AutocompleteAttributeValue;
};

export type FormFieldAttributes = FormFieldAttributesForContent & {
  name: string;
};
