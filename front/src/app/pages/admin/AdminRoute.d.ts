import { routes } from "src/app/routing/routes";
import { Route } from "type-route";

export type AdminRoute =
  | Route<typeof routes.admin>
  | Route<typeof routes.agencyAdmin>;
