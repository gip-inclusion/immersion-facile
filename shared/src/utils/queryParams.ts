import { pipeWithValue } from "../pipeWithValue";
import { join, keys, reduce } from "ramda";

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
