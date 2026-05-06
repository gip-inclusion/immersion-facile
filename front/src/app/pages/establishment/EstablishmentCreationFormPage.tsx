import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { ConnectedPrivateRoutePage } from "src/app/pages/auth/ConnectedPrivateRoutePage";
import type { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

type EstablishmentCreationFormPage = {
  route: Route<typeof routes.formEstablishment>;
};

export const EstablishmentCreationFormPage = ({
  route,
}: EstablishmentCreationFormPage) => (
  <ConnectedPrivateRoutePage
    route={route}
    oAuthConnectionPageHeader={
      <PageHeader
        title="Proposer une immersion"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    <EstablishmentForm mode="create" />
  </ConnectedPrivateRoutePage>
);
