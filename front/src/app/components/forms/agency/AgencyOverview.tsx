import { fr } from "@codegouvfr/react-dsfr";

import type { AgencyDto } from "shared";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { agencyAdminSubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUsers } from "src/app/components/agency/AgencyUsers";
import { CopyAgencyId } from "src/app/components/agency/CopyAgencyId";
import { Feedback } from "src/app/components/feedback/Feedback";
import { EditAgencyForm } from "src/app/components/forms/agency/EditAgencyForm";

import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";

import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";

import type { ConnectedUsersWithNormalizedAgencyRightsById } from "src/core-logic/domain/admin/connectedUsersAdmin/connectedUsersAdmin.slice";
import type { Route } from "type-route";

export type AgencyOverviewRouteName = Route<
  | typeof routes.adminAgencyDetail
  | typeof routes.adminAgencies
  | typeof routes.myProfile
  | typeof routes.agencyDashboardAgencyDetails
>["name"];

type AgencyOverviewProps = {
  agency: AgencyDto;
  agencyUsers: ConnectedUsersWithNormalizedAgencyRightsById;
  routeName: AgencyOverviewRouteName;
};

export const AgencyOverview = ({
  agency,
  agencyUsers,
  routeName,
}: AgencyOverviewProps) => {
  const feedback = useAppSelector(agencyAdminSelectors.feedback);

  return (
    <div>
      <h1 className={fr.cx("fr-h1")}>{agency.name}</h1>
      <CopyAgencyId agencyId={agency.id} />

      {/* //Todo remove after feedback refactor */}
      {routeName === "adminAgencies" || routeName === "adminAgencyDetail" ? (
        <SubmitFeedbackNotification
          submitFeedback={feedback}
          messageByKind={agencyAdminSubmitMessageByKind}
        />
      ) : (
        <Feedback topics={["agency-for-dashboard"]} />
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
