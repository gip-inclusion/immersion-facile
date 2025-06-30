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

export const equals = (x: unknown, y: unknown): boolean => {
  const ok = Object.keys;
  const tx = typeof x;
  const ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) =>
          equals(x[key as keyof typeof x], y[key as keyof typeof y]),
        )
    : x === y;
};
