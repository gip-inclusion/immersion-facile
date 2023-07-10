export const includesTypeGuard =
  <T>(values: readonly T[]) =>
  (arg: unknown): arg is T =>
    values.includes(arg as T);
