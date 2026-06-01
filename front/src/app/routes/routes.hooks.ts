import { routes, useRoute } from "shared";
import { frontErrors } from "src/app/pages/error/front-errors";
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

type ConventionRouteName =
  | (typeof routes.conventionImmersion)["name"]
  | (typeof routes.conventionMiniStage)["name"]
  | (typeof routes.conventionImmersionForExternals)["name"]
  | (typeof routes.conventionTemplate)["name"];

const conventionRouteNames = [
  routes.conventionImmersion.name,
  routes.conventionMiniStage.name,
  routes.conventionImmersionForExternals.name,
  routes.conventionTemplate.name,
] as const;

const useConventionTypedRoute = makeUseTypedRoute<ConventionRouteName>();

export const useConventionRoute = () =>
  useConventionTypedRoute(conventionRouteNames);

export type RouteByMode = {
  create: Route<typeof routes.formEstablishment>;
  edit: Route<typeof routes.establishmentDashboardFormEstablishment>;
  admin: Route<typeof routes.adminEstablishments>;
};

export type Mode = keyof RouteByMode;

type EstablishmentRouteName = RouteByMode[Mode]["name"];

const establishmentRouteNames = [
  routes.formEstablishment.name,
  routes.establishmentDashboardFormEstablishment.name,
  routes.adminEstablishments.name,
] as const;

const useEstablishmentTypedRoute = makeUseTypedRoute<EstablishmentRouteName>();

export const useEstablishmentRoute = () =>
  useEstablishmentTypedRoute(establishmentRouteNames);

export const useSearchResultRoute =
  makeUseTypedRoute<
    (
      | typeof routes.searchResult
      | typeof routes.searchResultForStudent
      | typeof routes.searchResultExternal
    )["name"]
  >();

type CreateDiscussionRouteName = (
  | typeof routes.searchResult
  | typeof routes.searchResultForStudent
)["name"];

const createDiscussionRouteNames = [
  routes.searchResult.name,
  routes.searchResultForStudent.name,
] as const;

const useCreateDiscussionTypedRoute =
  makeUseTypedRoute<CreateDiscussionRouteName>();

export const useCreateDiscussionRoute = () =>
  useCreateDiscussionTypedRoute(createDiscussionRouteNames);
