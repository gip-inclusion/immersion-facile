import type { OptionType } from "react-design-system";
import type { PropsValue } from "react-select";

export const isSingleOption = <T>(
  option: PropsValue<OptionType<T>>,
): option is OptionType<T> => option !== null && !Array.isArray(option);
