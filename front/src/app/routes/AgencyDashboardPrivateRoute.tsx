import { Breadcrumbs } from "@mui/material";
import React from "react";
import { PageHeader } from "react-design-system";
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
    allowAdminOnly={true}
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
