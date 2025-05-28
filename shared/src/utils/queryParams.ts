import { join, keys, reduce } from "ramda";
import type { AbsoluteUrl } from "../AbsoluteUrl";
import { pipeWithValue } from "../pipeWithValue";

type RawQueryParams = { [key: string]: string | boolean | number };

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

export const decodeURIParams = (
  url: AbsoluteUrl,
): Record<string, string> | undefined =>
  url
    .split("?")[1]
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
    }, {});
