import { Alert } from "@codegouvfr/react-dsfr/Alert";

import type { AgencyDto } from "shared";
import { ActivateAgency } from "src/app/components/agency/ActivateAgency";
import { EditAgency } from "src/app/components/agency/EditAgency";
import { RegisterUsersToAgencies } from "src/app/components/agency/RegisterUsersToAgencies";
import { Feedback } from "src/app/components/feedback/Feedback";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";
import { fetchAgencySelectors } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.selectors";

export const AgencyTab = () => {
  const agency = useAppSelector(fetchAgencySelectors.agency);
  const { url, error } = useAdminDashboard({ name: "adminAgencies" });
  return (
    <>
      <Feedback
        className="fr-mb-2w"
        topics={[
          "close-agency-and-transfer-conventions",
          "agency-admin",
          "agency-admin-needing-review",
        ]}
        closable
      />
      <EditAgency />

      {agency && <AgencyDashboard agency={agency} />}

      <RegisterUsersToAgencies />

      {error ? (
        <Alert severity="error" title="Erreur" description={error} />
      ) : (
        <MetabaseView title="Consulter les agences" url={url} />
      )}
      <ActivateAgency />
    </>
  );
};

export const AgencyDashboard = ({ agency }: { agency: AgencyDto }) => {
  const { url, error } = useAdminDashboard({
    name: "adminAgencyDetails",
    agencyId: agency.id,
  });

  if (!agency) return null;

  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <MetabaseView title={agency.name} url={url} />
  );
};
