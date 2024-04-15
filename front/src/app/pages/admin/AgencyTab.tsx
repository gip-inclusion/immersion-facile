import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { AgencyDto } from "shared";
import { MetabaseView } from "src/app/components/MetabaseView";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { ActivateAgency } from "src/app/components/agency/ActivateAgency";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { EditAgency } from "src/app/components/agency/EditAgency";
import { RegisterUsersToAgencies } from "src/app/components/agency/RegisterUsersToAgencies";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";

export const AgencyTab = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);
  const feedback = useAppSelector(agencyAdminSelectors.feedback);
  const { url, error } = useAdminDashboard({ name: "agencies" });
  return (
    <>
      <SubmitFeedbackNotification
        submitFeedback={feedback}
        messageByKind={agencySubmitMessageByKind}
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

const AgencyDashboard = ({ agency }: { agency: AgencyDto }) => {
  const { url, error } = useAdminDashboard({
    name: "agencyForAdmin",
    agencyId: agency.id,
  });

  if (!agency) return null;

  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <MetabaseView title={agency.name} url={url} />
  );
};
