import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Table } from "@codegouvfr/react-dsfr/Table";

import { type AgencyDto, domElementIds } from "shared";
import { NameAndEmailInTable } from "src/app/components/admin/NameAndEmailInTable";
import type { AgencyOverviewRouteName } from "src/app/components/forms/agency/AgencyOverview";
import { agencyRolesToDisplay } from "src/app/contents/userRolesToDisplay";
import type { NormalizedInclusionConnectedUser } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

type AgencyUsersTableProps = {
  agencyUsers: NormalizedInclusionConnectedUser[];
  agency: AgencyDto;
  onModifyClicked: (user: NormalizedInclusionConnectedUser) => void;
  onDeleteClicked: (user: NormalizedInclusionConnectedUser) => void;
  routeName: AgencyOverviewRouteName;
};

export const AgencyUsersTable = ({
  agency,
  agencyUsers,
  onModifyClicked,
  onDeleteClicked,
  routeName,
}: AgencyUsersTableProps) => {
  const id =
    routeName === "adminAgencies" || routeName === "adminAgencyDetail"
      ? domElementIds.admin.agencyTab.agencyUsersTable
      : domElementIds.agencyDashboard.agencyDetails.agencyUsersTable;
  return (
    <Table
      fixed
      id={id}
      headers={[
        "Utilisateurs",
        "Préférence de communication",
        "Rôles",
        "Actions",
      ]}
      data={agencyUsers.map((agencyUser, index) => [
        <NameAndEmailInTable
          key={`${agencyUser.firstName}-${agencyUser.lastName}-${agencyUser.email}`}
          firstName={agencyUser.firstName}
          lastName={agencyUser.lastName}
          email={agencyUser.email}
        />,
        agencyUser.agencyRights[agency.id].isNotifiedByEmail
          ? "Reçoit les notifications"
          : "Ne reçoit pas les notifications",
        agencyUser.agencyRights[agency.id].roles.map((role) => {
          return (
            <Badge
              key={`${agencyUser.firstName}-${agencyUser.lastName}-${agencyUser.email}-${role}`}
              small
              className={fr.cx(
                agencyRolesToDisplay[role].className,
                "fr-mr-1w",
              )}
            >
              {agencyRolesToDisplay[role].label}
            </Badge>
          );
        }),
        <ButtonsGroup
          key={`${agencyUser.firstName}-${agencyUser.lastName}-${agencyUser.email}-buttons`}
          inlineLayoutWhen={"always"}
          buttons={[
            {
              children: "Modifier",
              priority: "secondary",
              disabled:
                agency.refersToAgencyId !== null &&
                agencyUser.agencyRights[agency.id].roles.includes("validator"),
              id: `${
                routeName === "adminAgencies" ||
                routeName === "adminAgencyDetail"
                  ? domElementIds.admin.agencyTab.editAgencyUserRoleButton
                  : domElementIds.agencyDashboard.agencyDetails
                      .editAgencyUserRoleButton
              }-${agency.id}-${index}`,
              onClick: () => onModifyClicked(agencyUser),
            },
            {
              children: "Supprimer",
              priority: "secondary",
              disabled:
                agency.refersToAgencyId !== null &&
                agencyUser.agencyRights[agency.id].roles.includes("validator"),
              id: `${
                routeName === "adminAgencies" ||
                routeName === "adminAgencyDetail"
                  ? domElementIds.admin.agencyTab.editAgencyRemoveUserButton
                  : domElementIds.agencyDashboard.agencyDetails
                      .editAgencyRemoveUserButton
              }-${agency.id}-${index}`,
              onClick: () => onDeleteClicked(agencyUser),
            },
          ]}
        />,
      ])}
    />
  );
};
