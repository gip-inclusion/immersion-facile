import { FrClassName, fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { partition, values } from "ramda";
import React, { useState } from "react";
import { Tag } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  AgencyRole,
  UserParamsForAgency,
  domElementIds,
} from "shared";
import { AgencyUserModificationForm } from "src/app/components/agency/AgencyUserModificationForm";
import { AgencyUsersTable } from "src/app/components/agency/AgencyUsersTable";
import { UsersWithoutNameHint } from "src/app/components/agency/UsersWithoutNameHint";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import {
  NormalizedInclusionConnectedUser,
  icUsersAdminSlice,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { v4 as uuidV4 } from "uuid";
import { Feedback } from "../feedback/Feedback";

type AgencyUsersProperties = {
  agency: AgencyDto;
};

type AgencyDisplayedRoleAndClass = {
  label: string;
  className: FrClassName;
  description: string;
};

export const agencyRoleToDisplay: Record<
  AgencyRole,
  AgencyDisplayedRoleAndClass
> = {
  "agency-admin": {
    label: "Administrateur",
    className: "fr-badge--green-emeraude",
    description:
      "Peut modifier les informations de l'organisme, ajouter et supprimer des utilisateurs, modifier leur rôles, consulter les conventions.",
  },
  "to-review": {
    label: "À valider",
    className: "fr-badge--yellow-tournesol",
    description: "",
  },
  validator: {
    label: "Validateur",
    className: "fr-badge--purple-glycine",
    description:
      "Peut valider des conventions de l'agence et modifier leur statut.",
  },
  counsellor: {
    label: "Pré-validateur",
    className: "fr-badge--brown-caramel",
    description:
      "Peut pré-valider les conventions de l'agence et modifier leur statut.",
  },
  "agency-viewer": {
    label: "Lecteur",
    className: "fr-badge--blue-cumulus",
    description: "Peut consulter les conventions de l'agence.",
  },
};

const manageUserModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.admin.agencyTab.editAgencyManageUserModal,
});

const removeUserModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.admin.agencyTab.editAgencyRemoveUserModal,
});

export const AgencyUsers = ({ agency }: AgencyUsersProperties) => {
  const { enableProConnect } = useAppSelector(
    featureFlagSelectors.featureFlagState,
  );
  const agencyUsersById = useAppSelector(icUsersAdminSelectors.agencyUsers);
  const dispatch = useDispatch();

  const [selectedUserData, setSelectedUserData] = useState<
    (UserParamsForAgency & { isIcUser: boolean }) | null
  >(null);

  const [mode, setMode] = useState<"add" | "update" | null>(null);

  const provider = enableProConnect ? "ProConnect" : "Inclusion Connect";

  const onModifyClicked = (agencyUser: NormalizedInclusionConnectedUser) => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    setMode("update");
    setSelectedUserData({
      agencyId: agency.id,
      userId: agencyUser.id,
      roles: agencyUser.agencyRights[agency.id].roles,
      email: agencyUser.email,
      isNotifiedByEmail: agencyUser.agencyRights[agency.id].isNotifiedByEmail,
      isIcUser: !!agencyUser.externalId,
    });
    manageUserModal.open();
  };

  const onDeleteClicked = (agencyUser: NormalizedInclusionConnectedUser) => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    setSelectedUserData({
      agencyId: agency.id,
      userId: agencyUser.id,
      roles: agencyUser.agencyRights[agency.id].roles,
      email: agencyUser.email,
      isNotifiedByEmail: agencyUser.agencyRights[agency.id].isNotifiedByEmail,
      isIcUser: !!agencyUser.externalId,
    });
    removeUserModal.open();
  };

  const agencyRefersToOtherAgency = agency.refersToAgencyId !== null;

  const [agencyUsers, agencyUsersInOtherAgency] = agencyRefersToOtherAgency
    ? partition(
        (user) => !user.agencyRights[agency.id].roles.includes("validator"),
        values(agencyUsersById),
      )
    : [values(agencyUsersById), []];

  const onUserUpdateSubmitted = (userParamsForAgency: UserParamsForAgency) => {
    dispatch(
      icUsersAdminSlice.actions.updateUserOnAgencyRequested({
        ...userParamsForAgency,
        feedbackTopic: "agency-user",
      }),
    );
  };

  const onUserCreationSubmitted = (
    userParamsForAgency: UserParamsForAgency,
  ) => {
    dispatch(
      icUsersAdminSlice.actions.createUserOnAgencyRequested({
        ...userParamsForAgency,
        feedbackTopic: "agency-user",
      }),
    );
  };

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-1v", "fr-mt-4w")}>Utilisateurs</h5>
      <UsersWithoutNameHint />
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

      <div className={fr.cx("fr-mb-1v", "fr-mt-4w")}>
        <span className={fr.cx("fr-h6")}>Utilisateurs de : </span>
        {agency.refersToAgencyName ? (
          <Tag
            theme={"structureAccompagnement"}
            label={`Structure d'accompagnement : ${agency.name}`}
          />
        ) : (
          <Tag theme={"prescripteur"} label={`Prescripteur : ${agency.name}`} />
        )}
      </div>

      <AgencyUsersTable
        agencyUsers={agencyUsers}
        agency={agency}
        onModifyClicked={onModifyClicked}
        onDeleteClicked={onDeleteClicked}
      />

      {agency.refersToAgencyName && (
        <>
          <div className={fr.cx("fr-mb-1v", "fr-mt-4w")}>
            <span className={fr.cx("fr-h6")}>Utilisateurs de : </span>
            <Tag
              theme={"prescripteur"}
              label={`Prescripteur : ${agency.refersToAgencyName}`}
            />
          </div>
          <AgencyUsersTable
            agencyUsers={agencyUsersInOtherAgency}
            agency={agency}
            onModifyClicked={onModifyClicked}
            onDeleteClicked={onDeleteClicked}
          />
        </>
      )}

      {createPortal(
        <manageUserModal.Component
          title={
            mode === "update"
              ? "Modifier le rôle de l'utilisateur"
              : "Ajouter un utilisateur"
          }
        >
          {selectedUserData && mode && (
            <>
              <h5 className={fr.cx("fr-text--bold", "fr-text--sm")}>
                Informations personnelles
              </h5>
              <p className={fr.cx("fr-text--sm")}>
                {selectedUserData.isIcUser
                  ? `Pour modifier ses informations personnelles, l'utilisateur doit passer par son compte ${provider} créé avec l'email ${selectedUserData.email}`
                  : `Pour ajouter un nom, prénom et mot de passe, l'utilisateur doit se créer un compte 
                  via ${provider}, avec l'email ${selectedUserData.email}.
                  Nous vous déconseillons de créer un compte pour les boites génériques pour conserver la traçabilité des actions sur les demandes de conventions d'immersion.`}
              </p>
              <AgencyUserModificationForm
                agencyUser={selectedUserData}
                closeModal={() => manageUserModal.close()}
                agencyHasRefersTo={!!agency.refersToAgencyId}
                onSubmit={
                  mode === "add"
                    ? onUserCreationSubmitted
                    : onUserUpdateSubmitted
                }
              />
            </>
          )}
        </manageUserModal.Component>,
        document.body,
      )}

      {createPortal(
        <removeUserModal.Component title="Confirmer la suppression">
          <p>
            Vous êtes sur le point de supprimer le rattachement de{" "}
            {selectedUserData?.email} à l'agence "{agency.name}".
          </p>
          <p>Souhaitez-vous continuer ?</p>
          <ButtonsGroup
            inlineLayoutWhen="always"
            buttons={[
              {
                priority: "secondary",
                children: "Annuler",
                onClick: () => {
                  removeUserModal.close();
                },
              },
              {
                priority: "primary",
                children: "Supprimer le rattachement",
                onClick: () => {
                  if (!selectedUserData) return;
                  dispatch(
                    icUsersAdminSlice.actions.removeUserFromAgencyRequested({
                      userId: selectedUserData.userId,
                      agencyId: agency.id,
                      feedbackTopic: "agency-user",
                    }),
                  );
                  removeUserModal.close();
                },
              },
            ]}
          />
        </removeUserModal.Component>,
        document.body,
      )}
    </>
  );
};
