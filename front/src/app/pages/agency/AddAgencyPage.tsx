import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { AddAgencyForm } from "src/app/components/forms/agency/AddAgencyForm";
import { ConnectedPrivateRoute } from "src/app/pages/auth/ConnectedPrivateRoute";
import type { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

export const AddAgencyPage = ({
  route,
}: {
  route: Route<typeof routes.addAgency>;
}) => (
  <ConnectedPrivateRoute
    route={route}
    oAuthConnectionPageHeader={
      <PageHeader
        title="Ajout d'organisme encadrant les PMSMP"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    <AddAgencyForm siret={route.params.siret} />
  </ConnectedPrivateRoute>
);
