import { makeStyles } from "tss-react/dsfr";

// Utility global styles, overriding DSFR styles
// should be used sparingly, and only declare utility classes, not components
export const useStyleUtils = makeStyles()((_theme) => ({
  "text-centered": {
    textAlign: "center",
  },
}));

export const keys = <T extends string | number | symbol>(
  obj: Partial<Record<T, unknown>>,
): T[] => Object.keys(obj) as T[];
