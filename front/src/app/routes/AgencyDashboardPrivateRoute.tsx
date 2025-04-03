import type { ReactElement } from "react";
import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import {
  ConnectedPrivateRoute,
  type FrontAgencyDashboardRoute,
} from "src/app/routes/ConnectedPrivateRoute";

type AgencyDashboardPrivateRouteProps = {
  route: FrontAgencyDashboardRoute;
  children: ReactElement;
};

export const AgencyDashboardPrivateRoute = ({
  route,
  children,
}: AgencyDashboardPrivateRouteProps) => (
  <ConnectedPrivateRoute
    route={route}
    inclusionConnectConnexionPageHeader={
      <PageHeader
        title="Retrouvez vos conventions en tant que prescripteur"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    {children}
  </ConnectedPrivateRoute>
);
