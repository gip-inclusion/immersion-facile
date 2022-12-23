import { AutocompleteAttributeValue } from "react-design-system";

export type FormField<OptionValue = void> = {
  label: string;
  description?: string;
  placeholder?: string;
  id: string;
  name: string;
  options?: { label: string; value: OptionValue }[];
  required?: boolean;
  autocomplete?: AutocompleteAttributeValue;
};
