import type { ReactElement } from "react";
import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import {
  ConnectedPrivateRoute,
  type FrontDashboardRoute,
} from "src/app/pages/auth/ConnectedPrivateRoute";

type DashboardPrivateRouteProps = {
  route: FrontDashboardRoute;
  children: ReactElement;
};

export const DashboardPrivateRoute = ({
  route,
  children,
}: DashboardPrivateRouteProps) => (
  <ConnectedPrivateRoute
    route={route}
    oAuthConnexionPageHeader={
      <PageHeader
        title="Retrouvez vos conventions en tant que prescripteur"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    {children}
  </ConnectedPrivateRoute>
);
