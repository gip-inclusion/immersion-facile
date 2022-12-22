export type FormField<OptionValue = void> = {
  label: string;
  description?: string;
  placeholder?: string;
  options?: { label: string; value: OptionValue }[];
  required?: boolean;
};
