import React from "react";
import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import {
  FrontAgencyDashboardRoute,
  InclusionConnectedPrivateRoute,
} from "src/app/routes/InclusionConnectedPrivateRoute";

type AgencyDashboardPrivateRouteProps = {
  route: FrontAgencyDashboardRoute;
  children: React.ReactElement;
};

export const AgencyDashboardPrivateRoute = ({
  route,
  children,
}: AgencyDashboardPrivateRouteProps) => (
  <InclusionConnectedPrivateRoute
    route={route}
    inclusionConnectConnexionPageHeader={
      <PageHeader
        title="Retrouvez vos conventions en tant que prescripteur"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    {children}
  </InclusionConnectedPrivateRoute>
);
