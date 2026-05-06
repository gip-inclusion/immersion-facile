import type { ReactElement } from "react";
import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import {
  ConnectedPrivateRoutePage,
  type FrontDashboardRoute,
} from "src/app/pages/auth/ConnectedPrivateRoutePage";

type DashboardPrivateRoutePageProps = {
  route: FrontDashboardRoute;
  children: ReactElement;
};

export const DashboardPrivateRoutePage = ({
  route,
  children,
}: DashboardPrivateRoutePageProps) => (
  <ConnectedPrivateRoutePage
    route={route}
    oAuthConnectionPageHeader={
      <PageHeader
        title="Retrouvez vos conventions en tant que prescripteur"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    {children}
  </ConnectedPrivateRoutePage>
);
