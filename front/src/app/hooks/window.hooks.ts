import { useEffect } from "react";

export const useScrollToTop = (valueToWatch: boolean) => {
  useEffect(() => {
    if (!valueToWatch) return;
    window.scrollTo(0, 0);
  }, [valueToWatch]);
};
