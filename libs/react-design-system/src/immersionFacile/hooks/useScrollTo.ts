import { useEffect, useRef } from "react";

export const useScrollTo = (
  valueToWatch: boolean | number | null,
  elementId?: string,
) => {
  const previousValueToWatch = useRef(valueToWatch);

  useEffect(() => {
    if (!valueToWatch || valueToWatch === previousValueToWatch.current) return;

    const elementToScollToTop = elementId
      ? document.getElementById(elementId)
      : document.body;

    elementToScollToTop?.scrollIntoView({
      behavior: "smooth",
    });

    previousValueToWatch.current = valueToWatch;
  }, [valueToWatch, elementId]);
};
