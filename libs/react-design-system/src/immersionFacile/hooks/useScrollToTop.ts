import { useEffect } from "react";

export const useScrollToTop = (
  valueToWatch: boolean | number | null,
  elementId?: string,
) => {
  useEffect(() => {
    if (!valueToWatch) return;

    const elementToScollToTop = elementId
      ? document.getElementById(elementId)
      : document.body;

    elementToScollToTop?.scrollIntoView({
      behavior: "smooth",
    });
  }, [valueToWatch, elementId]);
};
