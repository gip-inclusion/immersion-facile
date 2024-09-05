import { FrClassName, fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { values } from "ramda";
import React, { useState } from "react";
import { Tooltip } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  AgencyRole,
  UserParamsForAgency,
  domElementIds,
} from "shared";
import { AgencyUserModificationForm } from "src/app/components/agency/AgencyUserModificationForm";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { v4 as uuidV4 } from "uuid";
import { Feedback } from "../feedback/Feedback";

type AgencyUsersProperties = {
  agency: AgencyDto;
};

type AgencyDisplayedRoleAndClass = {
  label: string;
  className: FrClassName;
};

export const agencyRoleToDisplay: Record<
  AgencyRole,
  AgencyDisplayedRoleAndClass
> = {
  toReview: {
    label: "À valider",
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
    className: "fr-badge--blue-cumulus",
  },
};

export type UserFormMode = "add" | "update" | "register";

const manageUserModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.admin.agencyTab.editAgencyManageUserModal,
});

export const AgencyUsers = ({ agency }: AgencyUsersProperties) => {
  const agencyUsers = useAppSelector(icUsersAdminSelectors.agencyUsers);
  const dispatch = useDispatch();

  const [selectedUserData, setSelectedUserData] = useState<
    (UserParamsForAgency & { isIcUser: boolean }) | null
  >(null);

  const [mode, setMode] = useState<UserFormMode | null>(null);

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
      <Feedback topic="agency-user" />
      <Button
        iconId="fr-icon-file-add-line"
        className={fr.cx("fr-m-1w", "fr-grid-row--right")}
        priority="primary"
        onClick={() => {
          setMode("add");
          setSelectedUserData({
            agencyId: agency.id,
            userId: uuidV4(),
            roles: [],
            email: "",
            isNotifiedByEmail: true,
            isIcUser: false,
          });
          manageUserModal.open();
        }}
        id={domElementIds.admin.agencyTab.openManageUserModalButton}
      >
        Ajouter un utilisateur
      </Button>

      <Table
        id={domElementIds.admin.agencyTab.agencyUsersTable}
        headers={[
          "Utilisateurs",
          "Préférence de communication",
          "Rôles",
          "Actions",
        ]}
        data={values(agencyUsers).map((agencyUser, index) => {
          const hasFirstNameOrLastName =
            agencyUser.firstName || agencyUsers.lastName;

          return [
            <>
              {hasFirstNameOrLastName ? (
                <>
                  <strong>
                    {agencyUser.firstName} {agencyUser.lastName}
                  </strong>
                  <br />
                </>
              ) : null}
              {agencyUser.email}
            </>,
            agencyUser.agencyRights[agency.id].isNotifiedByEmail
              ? "Reçoit les notifications"
              : "Ne reçoit pas les notifications",
            agencyUser.agencyRights[agency.id].roles.map((role) => {
              return (
                <Badge small className={agencyRoleToDisplay[role].className}>
                  {agencyRoleToDisplay[role].label}
                </Badge>
              );
            }),
            <Button
              priority="secondary"
              className={fr.cx("fr-m-1w")}
              id={`${domElementIds.admin.agencyTab.editAgencyUserRoleButton}-${agency.id}-${index}`}
              onClick={() => {
                dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
                setMode("update");
                setSelectedUserData({
                  agencyId: agency.id,
                  userId: agencyUser.id,
                  roles: agencyUser.agencyRights[agency.id].roles,
                  email: agencyUser.email,
                  isNotifiedByEmail:
                    agencyUser.agencyRights[agency.id].isNotifiedByEmail,
                  isIcUser: !!agencyUser.externalId,
                });
                manageUserModal.open();
              }}
            >
              Modifier
            </Button>,
          ];
        })}
        fixed
      />

      {createPortal(
        <manageUserModal.Component
          title={
            mode === "update"
              ? "Modifier le rôle de l'utilisateur"
              : "Ajouter un utilisateur"
          }
        >
          {selectedUserData && mode && (
            <AgencyUserModificationForm
              agencyUser={selectedUserData}
              closeModal={() => manageUserModal.close()}
              mode={mode}
              agency={agency}
            />
          )}
        </manageUserModal.Component>,
        document.body,
      )}
    </>
  );
};
