import { AutocompleteAttributeValue } from "react-design-system";

export type FormFieldAttributesForContent = {
  label: string;
  hintText?: React.ReactNode;
  placeholder?: string;
  id: string;
  required?: boolean;
  autoComplete?: AutocompleteAttributeValue;
};

export type FormFieldAttributes = FormFieldAttributesForContent & {
  name: string;
};
