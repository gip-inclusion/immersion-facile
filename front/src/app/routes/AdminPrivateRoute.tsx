import type { ReactElement } from "react";
import { PageHeader } from "react-design-system";
import {
  ConnectedPrivateRoute,
  type FrontAdminRoute,
} from "src/app/routes/ConnectedPrivateRoute";

type AdminPrivateRouteProps = {
  route: FrontAdminRoute;
  children: ReactElement;
};

export const AdminPrivateRoute = ({
  route,
  children,
}: AdminPrivateRouteProps) => (
  <ConnectedPrivateRoute
    allowAdminOnly={true}
    route={route}
    inclusionConnectConnexionPageHeader={
      <PageHeader title="Bienvenue cher administrateur de la super team Immersion Facilitée ! 🚀" />
    }
  >
    {children}
  </ConnectedPrivateRoute>
);
