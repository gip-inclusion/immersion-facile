import { AutocompleteAttributeValue } from "react-design-system";

export type FormFieldAttributes = {
  label: string;
  description?: string;
  placeholder?: string;
  id: string;
  name: string;
  required?: boolean;
  autoComplete?: AutocompleteAttributeValue;
};
