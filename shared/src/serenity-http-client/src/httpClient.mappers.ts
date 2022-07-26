import { UnhandledError } from "./errors";
import { ErrorMapper } from "./httpClient";

// TODO is there a way to handle abstract classe and inheritance ?
export const toMappedErrorMaker =
  <T extends string>(target: T, errorMapper: ErrorMapper<T> = {}) =>
  (error: Error): Error => {
    const errorByName = errorMapper[target];
    if (!errorByName) return error;

    const newErrorMaker = errorByName[error.name];

    if (!newErrorMaker) return error;

    return newErrorMaker(error);
  };

export const toUnhandledError = (details: string, error: Error): Error => {
  let rawString: string;
  try {
    rawString = JSON.stringify(error);
  } catch (stringifyError: any) {
    const keys: string[] = Object.keys(error);
    rawString = `Failed to JSON.stringify the error due to : ${
      stringifyError?.message
    }. 
    Raw object keys : ${
      keys.length > 0
        ? keys.join("\n")
        : "Object.keys(error) returned an empty array"
    }`;
  }
  return new UnhandledError(
    `${details} - JSON Stringify tentative result -> ${rawString}`,
    error,
  );
};
