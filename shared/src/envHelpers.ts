export type ProcessEnv = { [key: string]: string | undefined };

type ThrowIfNotInArrayParams<T> = {
  processEnv: ProcessEnv;
  authorizedValues: T[];
  variableName: string;
  defaultValue?: T;
};

export const throwIfNotInArray = <T extends string | undefined>({
  processEnv,
  authorizedValues,
  variableName,
  defaultValue,
}: ThrowIfNotInArrayParams<T>): T => {
  const envValue = processEnv[variableName]?.trim();

  const value = (envValue || defaultValue) as T;
  if (!authorizedValues.includes(value))
    throw new Error(
      `Expected ${variableName} to be one of : ` +
        `${authorizedValues.join(" | ")}, ` +
        `got : '${envValue}'`,
    );
  return value;
};

export const makeThrowIfNotDefined =
  (processEnv: ProcessEnv) => (variableName: string) => {
    const value = processEnv[variableName];
    if (!value) throw new Error(`Expected ${variableName} to be Defined`);
    return value;
  };

/*
 * Value should can only be a string,
 * so any string containing "TRUE" or "True" (case insensitive) will be considered true,
 * anything else will be considered false
 *
 * processEnv => string => boolean
 */
export const makeGetBooleanVariable =
  (processEnv: ProcessEnv) =>
  (variableName: string): boolean => {
    const variableValue = processEnv[variableName];
    return variableValue?.toLowerCase() === "true";
  };
