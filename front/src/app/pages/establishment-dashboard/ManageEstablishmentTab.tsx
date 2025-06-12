import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Select from "@codegouvfr/react-dsfr/SelectNext";

import { HeadingSection } from "react-design-system";
import { type WithEstablishmentData, domElementIds } from "shared";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { routes, useRoute } from "src/app/routes/routes";
import { getUrlParameters } from "src/app/utils/url.utils";
import type { Route } from "type-route";

type ManageEstablishmentTabProps = {
  establishments: WithEstablishmentData[];
};

export const ManageEstablishmentsTab = ({
  establishments,
}: ManageEstablishmentTabProps) => {
  const route = useRoute() as Route<
    typeof routes.establishmentDashboardFicheEntreprise
  >;
  const { siret } = route.params;
  const initialUrlParams = getUrlParameters(window.location);
  if (establishments.length === 1) {
    routes
      .establishmentDashboardFicheEntreprise({
        siret: establishments[0].siret,
        shouldUpdateAvailability: initialUrlParams.shouldUpdateAvailability,
      })
      .push();
  }
  return (
    <HeadingSection
      title="Piloter votre établissement"
      titleAs="h2"
      className={fr.cx("fr-mt-0")}
      titleAction={
        <Button
          iconId="fr-icon-add-circle-line"
          type="button"
          onClick={() => {
            routes.formEstablishment().push();
          }}
          id={
            domElementIds.establishmentDashboard.manageEstablishments
              .createEstablishment
          }
        >
          Créer un nouvel établissement
        </Button>
      }
    >
      <div className={fr.cx("fr-mb-4w")}>
        {establishments.length > 1 && (
          <Select
            label={"Sélectionner un établissement"}
            options={[
              ...establishments.map((establishment) => ({
                value: establishment.siret,
                label: `${establishment.businessName}`,
              })),
            ]}
            placeholder="Sélectionner un établissement"
            nativeSelectProps={{
              defaultValue: "",
              value: siret,
              id: domElementIds.establishmentDashboard.manageEstablishments
                .selectEstablishmentInput,
              onChange: (event) => {
                routes
                  .establishmentDashboardFicheEntreprise({
                    siret: event.currentTarget.value,
                  })
                  .push();
              },
            }}
          />
        )}
        {route.params.siret && <EstablishmentForm mode="edit" />}
      </div>
    </HeadingSection>
  );
};
