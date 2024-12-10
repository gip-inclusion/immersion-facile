import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Table } from "@codegouvfr/react-dsfr/Table";
import React from "react";
import { AgencyDto, domElementIds } from "shared";
import { NameAndEmailInTable } from "src/app/components/admin/NameAndEmailInTable";
import { agencyRoleToDisplay } from "src/app/components/agency/AgencyUsers";
import { AgencyOverviewRouteName } from "src/app/components/forms/agency/AgencyOverview";
import { NormalizedInclusionConnectedUser } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

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
              small
              className={fr.cx(agencyRoleToDisplay[role].className, "fr-mr-1w")}
            >
              {agencyRoleToDisplay[role].label}
            </Badge>
          );
        }),
        <ButtonsGroup
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
