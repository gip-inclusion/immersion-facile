import { fr } from "@codegouvfr/react-dsfr";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import React from "react";
import { WithEstablismentsSiretAndName } from "shared";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
type ManageEstablishmentTabProps = {
  establishments: WithEstablismentsSiretAndName[];
  route: Route<typeof routes.establishmentDashboard>;
};
export const ManageEstablishmentsTab = ({
  establishments,
  route,
}: ManageEstablishmentTabProps) => {
  const establishmentOptions = establishments.map((establishment) => ({
    value: establishment.siret,
    label: `${establishment.businessName}`,
  }));
  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w")}>
        Piloter votre établissement
      </h5>
      <div className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w", "fr-mb-4w")}>
        <Select
          label={"Sélectionner un établissement"}
          options={establishmentOptions}
          placeholder="Sélectionner un établissement"
          nativeSelectProps={{
            defaultValue: "",
            value: route.params.siret,
            onChange: (event) => {
              routes
                .establishmentDashboard({
                  tab: "fiche-entreprise",
                  siret: event.currentTarget.value,
                })
                .push();
            },
          }}
        />
        {route.params.siret && <EstablishmentForm mode="edit" />}
      </div>
    </>
  );
};
