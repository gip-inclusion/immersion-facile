import { Alert } from "@codegouvfr/react-dsfr/Alert";

import type { AgencyDto } from "shared";
import { ActivateAgency } from "src/app/components/agency/ActivateAgency";
import { agencyAdminSubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { EditAgency } from "src/app/components/agency/EditAgency";
import { RegisterUsersToAgencies } from "src/app/components/agency/RegisterUsersToAgencies";
import { Feedback } from "src/app/components/feedback/Feedback";
import { MetabaseView } from "src/app/components/MetabaseView";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";

export const AgencyTab = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);
  const feedback = useAppSelector(agencyAdminSelectors.feedback);
  const { url, error } = useAdminDashboard({ name: "adminAgencies" });
  return (
    <>
      <SubmitFeedbackNotification
        submitFeedback={feedback}
        messageByKind={agencyAdminSubmitMessageByKind}
      />
      <Feedback
        className="fr-mb-2w"
        topics={["close-agency-and-transfer-conventions"]}
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
