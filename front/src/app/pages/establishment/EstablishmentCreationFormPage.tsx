import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { ConnectedPrivateRoute } from "src/app/pages/auth/ConnectedPrivateRoute";
import type { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

type EstablishmentCreationFormPage = {
  route: Route<typeof routes.formEstablishment>;
};

export const EstablishmentCreationFormPage = ({
  route,
}: EstablishmentCreationFormPage) => (
  <ConnectedPrivateRoute
    route={route}
    oAuthConnectionPageHeader={
      <PageHeader
        title="Proposer une immersion"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    <EstablishmentForm mode="create" />
  </ConnectedPrivateRoute>
);
