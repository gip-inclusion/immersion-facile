import { frontErrors } from "src/app/pages/error/front-errors";
import { type routes, useRoute } from "src/app/routes/routes";
import type { Route } from "type-route";

type CurrentRoute = ReturnType<typeof useRoute>;
type CurrentRouteName = Exclude<CurrentRoute["name"], false>;
type RouteByName<TRouteName extends CurrentRouteName> = Extract<
  CurrentRoute,
  { name: TRouteName }
>;
type EnsureRouteNamesMatchUnion<
  TRouteName extends CurrentRouteName,
  TRouteNames extends readonly TRouteName[],
> = Exclude<TRouteName, TRouteNames[number]> extends never
  ? TRouteNames
  : never;

const isRouteAmong = <TRouteName extends CurrentRouteName>(
  route: CurrentRoute,
  routeNames: readonly TRouteName[],
): route is RouteByName<TRouteName> =>
  routeNames.some((routeName) => routeName === route.name);

const useTypedRoute = <
  TRouteName extends CurrentRouteName,
  const TRouteNames extends readonly TRouteName[],
>(
  routeNames: EnsureRouteNamesMatchUnion<TRouteName, TRouteNames>,
): RouteByName<TRouteName> => {
  const route = useRoute();
  if (isRouteAmong(route, routeNames)) return route;
  throw frontErrors.generic.wrongRoute({
    supportedRoutes: routeNames.map((routeName) => routeName.toString()),
    originalRoute: route.name.toString(),
  });
};

export const makeUseTypedRoute =
  <TRouteName extends CurrentRouteName>() =>
  <const TRouteNames extends readonly TRouteName[]>(
    routeNames: EnsureRouteNamesMatchUnion<TRouteName, TRouteNames>,
  ) =>
    useTypedRoute<TRouteName, TRouteNames>(routeNames);

export const useConventionRoute =
  makeUseTypedRoute<(typeof routes.conventionImmersion)["name"]>();

export type RouteByMode = {
  create: Route<typeof routes.formEstablishment>;
  edit: Route<typeof routes.establishmentDashboardFormEstablishment>;
  admin: Route<typeof routes.adminEstablishments>;
};

export type Mode = keyof RouteByMode;

export const useEstablishmentRoute =
  makeUseTypedRoute<RouteByMode[Mode]["name"]>();

export const useSearchResultRoute =
  makeUseTypedRoute<
    (
      | typeof routes.searchResult
      | typeof routes.searchResultForStudent
      | typeof routes.searchResultExternal
    )["name"]
  >();

export const useCreateDiscussionRoute =
  makeUseTypedRoute<
    (typeof routes.searchResult | typeof routes.searchResultForStudent)["name"]
  >();
