import { fr } from "@codegouvfr/react-dsfr";

import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUsers } from "src/app/components/agency/AgencyUsers";
import { CopyAgencyId } from "src/app/components/agency/CopyAgencyId";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import "src/assets/admin.css";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { connectedUsersAdminSelectors } from "src/core-logic/domain/admin/connectedUsersAdmin/connectedUsersAdmin.selectors";
import { EditAgencyForm } from "../forms/agency/EditAgencyForm";
import { BackofficeDashboardTabContent } from "../layout/BackofficeDashboardTabContent";
import { AgencyAdminAutocomplete } from "./AgencyAdminAutocomplete";

export const EditAgency = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);
  const agencyUsersById = useAppSelector(
    connectedUsersAdminSelectors.agencyUsers,
  );
  return (
    <BackofficeDashboardTabContent title="Editer une agence">
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <AgencyAdminAutocomplete
          locator="agencyAdminAutocomplete"
          label="Je sélectionne une agence (nom ou SIRET)"
          selectProps={{
            inputId: "agency-autocomplete",
            placeholder: "Ex : Agence de Berry",
          }}
          onAgencySelected={() => {}}
          onAgencyClear={() => {}}
        />
      </div>
      {/* //Todo remove this from agency tab to redirect on agency detail admin page when select an agency in autocomplete */}
      {agency && (
        <>
          <CopyAgencyId agencyId={agency.id} />
          <AgencyTag
            refersToAgencyName={agency.refersToAgencyName}
            className={fr.cx("fr-my-4w")}
          />
          <AgencyStatusBadge status={agency.status} />
          <EditAgencyForm agency={agency} routeName="adminAgencies" />
        </>
      )}
      {agency && (
        <AgencyUsers
          agency={agency}
          agencyUsersById={agencyUsersById}
          routeName="adminAgencies"
        />
      )}
    </BackofficeDashboardTabContent>
  );
};
