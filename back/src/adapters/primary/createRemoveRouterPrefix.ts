export type RelativeUrl = `/${string}`;

type RemovePrefix<
  U extends string,
  Prefix extends string,
> = U extends `${Prefix}/${infer V}` ? `/${V}` : never;

export const createRemoveRouterPrefix = <P extends RelativeUrl>(
  routerPrefix: P,
) => ({
  routerPrefix,
  removeRouterPrefix: <U extends RelativeUrl>(url: U): RemovePrefix<U, P> =>
    url.replace(routerPrefix, "") as RemovePrefix<U, P>,
});
