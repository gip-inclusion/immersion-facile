import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUsers } from "src/app/components/agency/AgencyUsers";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import "src/assets/admin.css";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { EditAgencyForm } from "../forms/agency/EditAgencyForm";
import { AgencyAdminAutocomplete } from "./AgencyAdminAutocomplete";

export const EditAgency = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w", "fr-mt-4w")}>
        Editer une agence
      </h5>
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <AgencyAdminAutocomplete
          title="Je sélectionne une agence (nom ou SIRET)"
          placeholder={"Ex : Agence de Berry"}
        />
      </div>
      {agency && (
        <>
          <AgencyTag
            refersToAgencyName={agency.refersToAgencyName}
            className={fr.cx("fr-my-4w")}
          />
          <AgencyStatusBadge status={agency.status} />
          <EditAgencyForm agency={agency} />
        </>
      )}
      {agency && <AgencyUsers agency={agency} />}
    </>
  );
};
