import { type AbsoluteUrl, absoluteUrlSchema } from "./AbsoluteUrl";
export type ProcessEnv = { [key: string]: string | undefined };

type ThrowIfNotInArrayParams<T> = {
  authorizedValues: T[];
  variableName: string;
  defaultValue?: T;
};

export const makeThrowIfNotInArray =
  (processEnv: ProcessEnv) =>
  <T extends string | undefined>({
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

export const makeThrowIfNotDefinedOrDefault =
  (processEnv: ProcessEnv) => (variableName: string, defaultValue?: string) => {
    const value = processEnv[variableName] || defaultValue;
    if (value === undefined)
      throw new Error(`Expected ${variableName} to be Defined`);
    return value;
  };

export const makeThrowIfNotAbsoluteUrl =
  (processEnv: ProcessEnv) =>
  <T extends string>(
    variableName: T,
    defaultValue?: AbsoluteUrl,
  ): AbsoluteUrl => {
    const value = processEnv[variableName] || defaultValue;
    if (!value) throw new Error(`Expected ${variableName} to be Defined`);

    const parseResult = absoluteUrlSchema.safeParse(value);
    if (!parseResult.success)
      throw new Error(
        `Provided value ${value} for ${variableName} is not an absolute url. ${parseResult.error}`,
      );

    return parseResult.data;
  };

export type OpenCageGeoSearchKey = `oc_gs_${string}`;

export const makeThrowIfNotOpenCageGeosearchKey =
  (processEnv: ProcessEnv) =>
  (variableName: string): OpenCageGeoSearchKey => {
    const value = processEnv[variableName];
    if (!value) throw new Error(`Expected ${variableName} to be Defined`);
    if (value.indexOf("oc_gs_") === 0) {
      return value as OpenCageGeoSearchKey;
    }

    throw new Error(
      `Provided value ${value} for ${variableName} is not an OpenCage Data Geosearch key.`,
    );
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
