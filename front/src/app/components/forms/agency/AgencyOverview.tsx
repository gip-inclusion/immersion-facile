import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { AgencyDto } from "shared";

import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { agencyAdminSubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUsers } from "src/app/components/agency/AgencyUsers";
import { Feedback } from "src/app/components/feedback/Feedback";
import { EditAgencyForm } from "src/app/components/forms/agency/EditAgencyForm";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { routes } from "src/app/routes/routes";

import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";

import { NormalizedIcUserById } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { Route } from "type-route";

export type AgencyOverviewRouteName = Route<
  | typeof routes.adminAgencyDetail
  | typeof routes.adminAgencies
  | typeof routes.myProfile
  | typeof routes.agencyDashboardAgencyDetails
>["name"];

type AgencyOverviewProps = {
  agency: AgencyDto;
  agencyUsers: NormalizedIcUserById;
  routeName: AgencyOverviewRouteName;
};

export const AgencyOverview = ({
  agency,
  agencyUsers,
  routeName,
}: AgencyOverviewProps) => {
  const feedback = useAppSelector(agencyAdminSelectors.feedback);

  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton("Copier");

  return (
    <div>
      <h1 className={fr.cx("fr-h1")}>{agency.name}</h1>
      <div>
        Id de l'agence : <Badge severity="success">{agency.id}</Badge>{" "}
        <Button
          type="button"
          disabled={copyButtonIsDisabled}
          iconId={"fr-icon-clipboard-fill"}
          onClick={() => onCopyButtonClick(agency.id)}
        >
          {copyButtonLabel}
        </Button>
      </div>
      {/* //Todo remove after feedback refactor */}
      {routeName === "adminAgencies" || routeName === "adminAgencyDetail" ? (
        <SubmitFeedbackNotification
          submitFeedback={feedback}
          messageByKind={agencyAdminSubmitMessageByKind}
        />
      ) : (
        <Feedback topic="agency-for-dashboard" />
      )}
      {agency && (
        <>
          <AgencyTag
            refersToAgencyName={agency.refersToAgencyName}
            className={fr.cx("fr-my-2w")}
          />
          <AgencyStatusBadge status={agency.status} />
          <EditAgencyForm agency={agency} routeName={routeName} />
        </>
      )}
      {agency && (
        <AgencyUsers
          agency={agency}
          agencyUsersById={agencyUsers}
          routeName={routeName}
        />
      )}
    </div>
  );
};
