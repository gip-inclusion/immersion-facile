import { useCallback, useEffect, useRef } from "react";

const convertToIntOrFallback = (n: string | null, fallback: number): number => {
  try {
    const parsed = n ? parseInt(n) : null;
    if (n && typeof n === "number" && !isNaN(n) && `${parsed}` === `${n}`) {
      return parsed as number;
    }

    return fallback;
  } catch {
    return fallback;
  }
};

const focusableElementsSelector =
  "a[href], area[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";
const TAB_KEY = 9;

// @TODO: should be replaced by react-modal
export const useFocusTrap = () => {
  const trapRef = useRef(null);

  const selectNextFocusableElem = useCallback(
    (
      sortedFocusableElems,
      currentIndex,
      shiftKeyPressed = false,
      skipCount = 0,
    ) => {
      if (skipCount > sortedFocusableElems.length) {
        return false;
      }

      const backwards = !!shiftKeyPressed;
      const maxIndex = sortedFocusableElems.length - 1;

      if (!currentIndex) {
        currentIndex =
          sortedFocusableElems.indexOf(document.activeElement) ?? 0;
      }

      let nextIndex = backwards ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex > maxIndex) {
        nextIndex = 0;
      }

      if (nextIndex < 0) {
        nextIndex = maxIndex;
      }

      const newFocusElem = sortedFocusableElems[nextIndex];

      newFocusElem.focus();

      if (document.activeElement !== newFocusElem) {
        // run another round
        selectNextFocusableElem(
          sortedFocusableElems,
          nextIndex,
          shiftKeyPressed,
          skipCount + 1,
        );
      }
    },
    [],
  );

  const trapper = useCallback((evt) => {
    const trapRefElem = trapRef.current;
    if (trapRefElem !== null) {
      if (evt.which === TAB_KEY || evt.key === "Tab") {
        evt.preventDefault();
        const shiftKeyPressed = !!evt.shiftKey;
        const focusableElems = Array.from(
          (trapRefElem as HTMLElement).querySelectorAll(
            focusableElementsSelector,
          ),
        );
        focusableElems.sort((a: unknown, b: unknown) => {
          const tabIndexA = convertToIntOrFallback(
            (a as HTMLElement).getAttribute("tabindex"),
            0,
          );
          const tabIndexB = convertToIntOrFallback(
            (b as HTMLElement)?.getAttribute("tabindex"),
            0,
          );

          return tabIndexA - tabIndexB;
        });

        selectNextFocusableElem(focusableElems, undefined, shiftKeyPressed);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", trapper);
    return () => {
      window.removeEventListener("keydown", trapper);
    };
  }, []);

  return [trapRef];
};
