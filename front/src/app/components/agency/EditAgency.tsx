import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { EditAgencyForm } from "../forms/agency/EditAgencyForm";
import { AgencyAdminAutocomplete } from "./AgencyAdminAutocomplete";
import "src/assets/admin.css";

export const EditAgency = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w", "fr-mt-4w")}>
        Editer une agence
      </h5>
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <AgencyAdminAutocomplete
          title="Je sélectionne une agence"
          placeholder={"Ex : Agence de Berry"}
        />
      </div>
      {agency && <EditAgencyForm agency={agency} />}
    </>
  );
};
