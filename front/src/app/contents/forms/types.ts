import { AutocompleteAttributeValue } from "react-design-system";

export type FormFieldAttributesForContent = {
  label: string;
  description?: string;
  placeholder?: string;
  id: string;
  required?: boolean;
  autoComplete?: AutocompleteAttributeValue;
};

export type FormFieldAttributes = FormFieldAttributesForContent & {
  name: string;
};
