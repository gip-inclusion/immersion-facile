import { join, keys, reduce } from "ramda";
import type { AbsoluteUrl } from "../AbsoluteUrl";
import { pipeWithValue } from "../pipeWithValue";

export type RawQueryParams = { [key: string]: string | boolean | number };

export type QueryParams<T extends RawQueryParams> = {
  [K in keyof T]: T[K];
};

export const queryParamsAsString = <Q extends QueryParams<RawQueryParams>>(
  queryParams: Q,
): string =>
  pipeWithValue(
    queryParams,
    keys,
    reduce<keyof Q, string[]>(
      (acc: string[], param) => [
        ...acc,
        ...(typeof queryParams[param] !== "undefined"
          ? [`${param.toString()}=${encodeURI(queryParams[param].toString())}`]
          : []),
      ],
      [],
    ),
    join("&"),
  );

export const decodeURIWithParams = (
  uri: string,
): {
  uriWithoutParams: string;
  params?: Record<string, string>;
} => {
  const [urlWithoutParams, params] = uri.split("?");

  return {
    uriWithoutParams: urlWithoutParams as AbsoluteUrl,
    ...(params
      ? {
          params: params
            .split("&")
            .reduce<Record<string, string>>((agg, current) => {
              const [key, value] = current.split("=");
              return {
                ...agg,
                ...(key !== undefined && value !== undefined
                  ? {
                      [key]: value,
                    }
                  : {}),
              };
            }, {}),
        }
      : {}),
  };
};
