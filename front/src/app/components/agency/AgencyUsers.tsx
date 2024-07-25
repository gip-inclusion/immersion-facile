import { FrClassName, fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { values } from "ramda";
import React from "react";
import { Tooltip } from "react-design-system";
import { AgencyId, AgencyRole, domElementIds } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import { ManageUserModal } from "./ManageUserModal";

type AgencyUsersProperties = {
  agencyId: AgencyId;
};

type AgencyRoleClasses = {
  label: string;
  className: FrClassName;
};

export const agencyRoleToDisplay: Record<AgencyRole, AgencyRoleClasses> = {
  toReview: {
    label: "A valider",
    className: "fr-badge--yellow-tournesol",
  },
  validator: {
    label: "Validateur",
    className: "fr-badge--purple-glycine",
  },
  counsellor: {
    label: "Pré-validateur",
    className: "fr-badge--brown-caramel",
  },
  agencyOwner: {
    label: "Responsable d'agence",
    className: "fr-badge--green-emeraude",
  },
  "agency-viewer": {
    label: "Lecteur",
    className: "fr-badge--beige-gris-galet",
  },
};

export const AgencyUsers = ({ agencyId }: AgencyUsersProperties) => {
  const agencyUsers = useAppSelector(icUsersAdminSelectors.agencyUsers);

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
        return (
          <Badge small className={agencyRoleToDisplay[role].className}>
            {agencyRoleToDisplay[role].label}
          </Badge>
        );
      },
    );
    const formattedContactMode = agencyUser.agencyRights[agencyId]
      .isNotifiedByEmail
      ? "Reçoit les notifications"
      : "Ne reçoit pas les notifications";

    return [
      formattedUserInfo,
      formattedContactMode,
      formattedUserRights,
      <ManageUserModal
        userEmail={agencyUser.email}
        userRole={agencyUser.agencyRights[agencyId].roles}
        userId={agencyUser.id}
        agencyId={agencyId}
      />,
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
