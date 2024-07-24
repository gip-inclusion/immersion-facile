import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { values } from "ramda";
import React from "react";
import { Tooltip } from "react-design-system";
import { AgencyId, AgencyRole, domElementIds } from "shared";
import { NormalizedIcUserById } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { ManageUserModal } from "./ManageUserModal";

type AgencyUsersProperties = {
  agencyId: AgencyId;
  agencyUsers: NormalizedIcUserById;
};

export const agencyRoleToDisplay: Record<AgencyRole, string> = {
  toReview: "A valider",
  validator: "Validateur",
  counsellor: "Pré-validateur",
  agencyOwner: "Responsable d'agence",
  "agency-viewer": "Lecteur",
};

export const AgencyUsers = ({
  agencyId,
  agencyUsers,
}: AgencyUsersProperties) => {
  const tableData = values(agencyUsers).map((agencyUser) => {
    const hasFirstNameOrLastName = agencyUser.firstName || agencyUsers.lastName;
    const formattedUserInfo = (
      <>
        {hasFirstNameOrLastName ? (
          <>
            <strong>
              {agencyUser.firstName} {agencyUser.lastName}
            </strong>
            <br />
          </>
        ) : (
          <></>
        )}
        {agencyUser.email}
      </>
    );
    const formattedUserRights = agencyUser.agencyRights[agencyId].roles.map(
      (role) => {
        if (role === "toReview") {
          return (
            <Badge severity="new" small>
              {agencyRoleToDisplay[role]}
            </Badge>
          );
        }
        return (
          <Badge small className={"fr-badge--purple-glycine"}>
            {agencyRoleToDisplay[role]}
          </Badge>
        );
      },
    );
    const formattedContactMode = agencyUser.agencyRights[agencyId]
      .isNotifiedByEmail
      ? "Reçoit les notifications"
      : "Ne reçoit pas les notifications";

    const manageUser = <ManageUserModal agencyUser={agencyUser} />;

    return [
      formattedUserInfo,
      formattedContactMode,
      formattedUserRights,
      manageUser,
    ];
  });

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-1v", "fr-mt-4w")}>Utilisateurs</h5>
      <div className={fr.cx("fr-mb-2w", "fr-mt-1v")}>
        Pourquoi certains utilisateurs n'ont pas de nom ?
        <Tooltip
          type="click"
          description="Certains utilisateurs n'ont pas de compte Inclusion Connect. Ils
            peuvent se créer un compte avec la même adresse email pour ajouter
            leurs infos et accéder à leur espace personnel."
          id={domElementIds.admin.agencyTab.editAgencyUserTooltip}
        />
      </div>
      <Table
        id={domElementIds.admin.agencyTab.agencyUsersTable}
        headers={[
          "Utilisateurs",
          "Préférence de communication",
          "Rôles",
          "Actions",
        ]}
        data={tableData}
        fixed
      />
    </>
  );
};
