import { useEffect } from "react";

export const useScrollToTop = (valueToWatch: boolean | number | null) => {
  useEffect(() => {
    if (!valueToWatch) return;
    document.body.scrollIntoView({
      behavior: "smooth",
    });
  }, [valueToWatch]);
};
