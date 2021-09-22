export type ProcessEnv = { [key: string]: string | undefined };

type ThrowIfNotInArrayParams<T> = {
  processEnv: ProcessEnv;
  authorizedValues: T[];
  variableName: string;
};

export const throwIfNotInArray = <T extends string | undefined>({
  processEnv,
  authorizedValues,
  variableName,
}: ThrowIfNotInArrayParams<T>): T => {
  if (!authorizedValues.includes(processEnv[variableName] as T))
    throw new Error(
      `Expected ${variableName} to be one of : ` +
        `${authorizedValues.join(" | ")},` +
        `got : ${processEnv[variableName]}`,
    );
  return processEnv[variableName] as T;
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
