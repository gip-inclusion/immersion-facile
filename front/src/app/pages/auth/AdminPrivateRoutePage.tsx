import type { ReactNode } from "react";
import { PageHeader } from "react-design-system";
import {
  ConnectedPrivateRoutePage,
  type FrontAdminRoute,
} from "src/app/pages/auth/ConnectedPrivateRoutePage";

type AdminPrivateRoutePageProps = {
  route: FrontAdminRoute;
  children: ReactNode;
};

export const AdminPrivateRoutePage = ({
  route,
  children,
}: AdminPrivateRoutePageProps) => (
  <ConnectedPrivateRoutePage
    allowAdminOnly={true}
    route={route}
    oAuthConnectionPageHeader={
      <PageHeader title="Bienvenue cher administrateur de la super team Immersion Facilitée ! 🚀" />
    }
  >
    {children}
  </ConnectedPrivateRoutePage>
);
