import { getTestBreadcrumbs } from "src/app/utils/breadcrumbs.unit.test";

getTestBreadcrumbs({
  // @ts-expect-error
  currentRouteKey: "not-known-route-name",
});

getTestBreadcrumbs({
  // root at level 1
  currentRouteKey: "homeCandidates",
});

getTestBreadcrumbs({
  // deep level
  currentRouteKey: "searchDiagoriente",
});
