import { useEffect, useState } from "react";
import { equals } from "ramda";

const defaultDebounceTimeMs = 500;
// taken from : https://usehooks.com/useDebounce/

export const useDebounce = <T>(
  value: T,
  delay: number = defaultDebounceTimeMs,
) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        if (!equals(value, debouncedValue)) {
          setDebouncedValue(value);
        }
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay], // Only re-call effect if value or delay changes
  );

  return debouncedValue;
};
