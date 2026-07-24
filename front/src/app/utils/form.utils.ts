const setValueAs =
  <T extends null | undefined>(emptyValue: T) =>
  (value: unknown): unknown | T =>
    value === "" ? emptyValue : value;

export const setValueAsUndefined = setValueAs(undefined);
export const setValueAsNull = setValueAs(null);
