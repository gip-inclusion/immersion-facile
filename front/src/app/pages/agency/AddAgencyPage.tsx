import { PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { AddAgencyForm } from "src/app/components/forms/agency/AddAgencyForm";
import { ConnectedPrivateRoutePage } from "src/app/pages/auth/ConnectedPrivateRoutePage";
import type { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

export const AddAgencyPage = ({
  route,
}: {
  route: Route<typeof routes.addAgency>;
}) => (
  <ConnectedPrivateRoutePage
    route={route}
    oAuthConnectionPageHeader={
      <PageHeader
        title="Ajout d'organisme encadrant les PMSMP"
        breadcrumbs={<Breadcrumbs />}
      />
    }
  >
    <Breadcrumbs />
    <AddAgencyForm />
  </ConnectedPrivateRoutePage>
);
