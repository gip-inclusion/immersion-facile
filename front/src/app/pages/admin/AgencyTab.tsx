import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { AgencyDto } from "shared";

import { ActivateAgency } from "src/app/components/agency/ActivateAgency";
import { EditAgency } from "src/app/components/agency/EditAgency";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";

export const AgencyTab = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);
  const feedback = useAppSelector(agencyAdminSelectors.feedback);
  return (
    <>
      <SubmitFeedbackNotification
        submitFeedback={feedback}
        messageByKind={agencySubmitMessageByKind}
      />
      <ActivateAgency />
      <EditAgency />

      {agency && <AgencyDashboard agency={agency} />}
    </>
  );
};

const AgencyDashboard = ({ agency }: { agency: AgencyDto }) => {
  const { url, error } = useAdminDashboard({
    name: "agency",
    agencyId: agency.id,
  });

  if (!agency) return null;

  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <MetabaseView title={agency.name} url={url} />
  );
};
