import {
  InfrastructureError,
  ConnectionRefusedError,
  isConnectionRefusedError,
  isConnectionResetError,
  ConnectionResetError,
} from "./errors/InfrastructureError.error";
import { UnhandledError } from "./errors/UnhandledError";
import { ErrorMapper } from "./httpClient";

export const toMappedErrorMaker =
  <T extends string>(target: T, errorMapper: ErrorMapper<T> = {}) =>
  (error: Error): Error => {
    const errorByConstructorName = errorMapper[target];
    if (!errorByConstructorName) return error;

    const newErrorMaker = errorByConstructorName[error.constructor.name];

    if (!newErrorMaker) return error;

    return newErrorMaker(error);
  };

export const toInfrastructureError = (
  error: Error,
): InfrastructureError | undefined => {
  if (isConnectionRefusedError(error))
    return new ConnectionRefusedError(
      `Could not connect to server : ${toRawErrorString(error)}`,
      error,
    );

  if (isConnectionResetError(error))
    return new ConnectionResetError(
      `The other side of the TCP conversation abruptly closed its end of the connection: ${toRawErrorString(
        error,
      )}`,
      error,
    );
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

const toRawErrorString = (error: any): string =>
  JSON.stringify(
    {
      code: error.code,
      address: error.address,
      port: error.port,
      config: {
        headers: error.config?.headers,
        method: error.config?.method,
        url: error.config?.url,
        baseUrl: error.config?.baseUrl,
        data: error.config?.data,
      },
    },
    null,
    2,
  );
