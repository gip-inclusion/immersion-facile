import { useEffect, useRef } from "react";

export const useScrollTo = (
  valueToWatch: boolean | number | null,
  elementId?: string,
) => {
  const previousValueToWatch = useRef(valueToWatch);

  useEffect(() => {
    const hasValueChanged = valueToWatch !== previousValueToWatch.current;
    previousValueToWatch.current = valueToWatch;

    if (!valueToWatch || !hasValueChanged) return;

    const elementToScollToTop = elementId
      ? document.getElementById(elementId)
      : document.body;

    elementToScollToTop?.scrollIntoView({
      behavior: "smooth",
    });
  }, [valueToWatch, elementId]);
};
