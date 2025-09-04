import type { ReactElement } from "react";
import { PageHeader } from "react-design-system";
import {
  ConnectedPrivateRoute,
  type FrontAdminRoute,
} from "src/app/pages/auth/ConnectedPrivateRoute";

type AdminPrivateRouteProps = {
  route: FrontAdminRoute;
  children: ReactElement | ReactElement[];
};

export const AdminPrivateRoute = ({
  route,
  children,
}: AdminPrivateRouteProps) => (
  <ConnectedPrivateRoute
    allowAdminOnly={true}
    route={route}
    oAuthConnectionPageHeader={
      <PageHeader title="Bienvenue cher administrateur de la super team Immersion Facilitée ! 🚀" />
    }
  >
    {children}
  </ConnectedPrivateRoute>
);
