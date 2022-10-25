// mostly from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/ef87ee53bc501c0f0e79797add156fd8fa904ede/types/express-serve-static-core/index.d.ts#L98-L121
type Http = "http://" | "https://";
export type Url = `${Http}${string}`;
export type AnyObj = Record<string, unknown>;
export type EmptyObj = Record<string, never>;

interface ParamsDictionary {
  [key: string]: string;
}

type RemoveDomain<S extends string> =
  S extends `${Http}${string}${"/"}${infer P}` ? `/${P}` : "/";

// prettier-ignore
type RemoveTail<S extends string, Tail extends string> = S extends `${infer P}${Tail}` ? P : S;

type GetRouteParameter<S extends string> = RemoveTail<
  RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>,
  `.${string}`
>;

// prettier-ignore
export type UtilityTypes<Route extends string> = string extends Route
  ? ParamsDictionary
  : RemoveDomain<Route> extends `${string}:${infer Rest}`
    ? (
    GetRouteParameter<Rest> extends never
      ? ParamsDictionary
      : GetRouteParameter<Rest> extends `${infer ParamName}?`
        ? { [P in ParamName]?: string }
        : { [P in GetRouteParameter<Rest>]: string }
    ) &
    (Rest extends `${GetRouteParameter<Rest>}${infer Next}`
      ? UtilityTypes<Next> : unknown)
    // eslint-disable-next-line @typescript-eslint/ban-types
    : {};
