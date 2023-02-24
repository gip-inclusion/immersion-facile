import React from "react";
import "src/assets/admin.css";
import { fr } from "@codegouvfr/react-dsfr";
import { DsfrTitle } from "react-design-system";
import { EditAgencyForm } from "../forms/agency/EditAgencyForm";
import { AgencyAutocomplete } from "./AgencyAutocomplete";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";

export const EditAgency = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);

  return (
    <>
      <DsfrTitle
        level={5}
        text="Editer une agence"
        className={fr.cx("fr-mt-4w")}
      />
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <AgencyAutocomplete
          title="Je sélectionne une agence"
          placeholder={"Ex : Agence de Berry"}
        />
      </div>
      {agency && <EditAgencyForm agency={agency} />}
    </>
  );
};
