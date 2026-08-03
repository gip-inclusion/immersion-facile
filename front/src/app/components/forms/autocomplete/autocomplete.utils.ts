import type { OptionType } from "react-design-system";
import type { PropsValue } from "react-select";

export const isSingleOption = <T>(
  option: PropsValue<OptionType<T>>,
): option is OptionType<T> => option !== null && !Array.isArray(option);

export const getAutocompleteValue = <T>(
  getLabel: (value: T) => string,
  value: T | null | undefined,
  defaultValue: PropsValue<OptionType<T>> | undefined,
  searchTerm: string | undefined,
): OptionType<T> | null => {
  if (value)
    return {
      label: getLabel(value),
      value,
    };
  if (searchTerm === "" && defaultValue === undefined) return null;
  if (defaultValue && isSingleOption(defaultValue)) return defaultValue;
  return null;
};
