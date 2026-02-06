import { fr } from "@codegouvfr/react-dsfr";

import type { AgencyDto } from "shared";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUsers } from "src/app/components/agency/AgencyUsers";
import { CopyAgencyId } from "src/app/components/agency/CopyAgencyId";
import { Feedback } from "src/app/components/feedback/Feedback";
import { EditAgencyForm } from "src/app/components/forms/agency/EditAgencyForm";
import type { routes } from "src/app/routes/routes";
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
}: AgencyOverviewProps) => (
  <div>
    <h1 className={fr.cx("fr-h1")}>{agency.name}</h1>
    <CopyAgencyId agencyId={agency.id} />

    {routeName === "adminAgencies" || routeName === "adminAgencyDetail" ? (
      <Feedback topics={["agency-admin"]} />
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
