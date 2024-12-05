import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Table } from "@codegouvfr/react-dsfr/Table";
import React, { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import {
  AgencyRight,
  InclusionConnectedUser,
  User,
  UserParamsForAgency,
  activeAgencyStatuses,
  addressDtoToString,
  agencyKindToLabelIncludingIF,
  domElementIds,
} from "shared";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUserModificationForm } from "src/app/components/agency/AgencyUserModificationForm";
import { agencyRoleToDisplay } from "src/app/components/agency/AgencyUsers";
import { Feedback } from "src/app/components/feedback/Feedback";
import { routes } from "src/app/routes/routes";

type UserDetailProps = {
  title: string;
  userWithRights: InclusionConnectedUser;
  editInformationsLink?: string;
  onUserUpdateRequested: (userParamsForAgency: UserParamsForAgency) => void;
};

const manageUserModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.admin.agencyTab.editAgencyManageUserModal,
});

export const UserDetail = ({
  title,
  userWithRights,
  editInformationsLink,
  onUserUpdateRequested,
}: UserDetailProps) => {
  return (
    <div>
      <h1>{title}</h1>

      <h2 className={fr.cx("fr-h4")}>Informations personnelles</h2>

      <ul className={fr.cx("fr-text--sm", "fr-mb-2w")}>
        <li>Id de l'utilisateur: {userWithRights.id}</li>
        <li>Email : {userWithRights.email}</li>
        {userWithRights.firstName && (
          <li>Prénom : {userWithRights.firstName}</li>
        )}
        {userWithRights.lastName && <li>Nom : {userWithRights.lastName}</li>}
      </ul>

      {editInformationsLink && (
        <Button
          className={fr.cx("fr-mb-4w")}
          priority="secondary"
          linkProps={{
            href: editInformationsLink,
            target: "_blank",
          }}
        >
          Modifier mes informations
        </Button>
      )}

      <AgenciesTable
        user={userWithRights}
        agencyRights={[...userWithRights.agencyRights].sort((a, b) =>
          a.agency.name.localeCompare(b.agency.name),
        )}
        isBackofficeAdmin={userWithRights.isBackofficeAdmin}
        onUserUpdateRequested={onUserUpdateRequested}
      />
    </div>
  );
};

const AgenciesTable = ({
  user,
  agencyRights,
  isBackofficeAdmin,
  onUserUpdateRequested,
}: {
  user: User;
  agencyRights: AgencyRight[];
  isBackofficeAdmin?: boolean;
  onUserUpdateRequested: (userParamsForAgency: UserParamsForAgency) => void;
}) => {
  if (!agencyRights.length)
    return <p>Cet utilisateur n'est lié à aucune agence</p>;

  const [selectedAgencyRight, setSelectedAgencyRight] =
    useState<AgencyRight | null>(null);

  const onUpdateClicked = (agencyRight: AgencyRight) => {
    setSelectedAgencyRight(agencyRight);
    manageUserModal.open();
  };

  const availableActions = (agencyRight: AgencyRight): ReactNode => {
    const editRolesButton = (
      <Button
        size="small"
        onClick={() => {
          onUpdateClicked(agencyRight);
        }}
      >
        Modifier
      </Button>
    );
    const viewAgencyButton = (
      <Button
        priority="tertiary no outline"
        size="small"
        linkProps={
          routes.adminAgencyDetail({
            agencyId: agencyRight.agency.id,
          }).link
        }
      >
        Voir l'agence comme admin IF
      </Button>
    );

    if (isBackofficeAdmin) {
      return (
        <>
          {editRolesButton}
          {viewAgencyButton}
        </>
      );
    }

    return <>{editRolesButton}</>;
  };

  return (
    <>
      <h2 className={fr.cx("fr-h4")}>
        Organismes rattachés au profil ({agencyRights.length} agences)
      </h2>
      <Feedback topic="user" />
      <Table
        headers={[
          "Nom d'agence",
          "Carractéristiques de l'agence",
          "Roles",
          "Reçoit les notifications",
          "Actions",
        ]}
        data={agencyRights.map((agencyRight) => [
          <>
            {agencyRight.agency.name}
            <span className={fr.cx("fr-hint-text")}>
              {addressDtoToString(agencyRight.agency.address)}
            </span>

            {/* TODO: agency-admin will be able to go to agency page event if not backOfficeAdmin */}
            {agencyRight.roles.includes("agency-admin") &&
              isBackofficeAdmin && (
                <a
                  className={fr.cx(
                    "fr-link",
                    "fr-text--sm",
                    "fr-icon-arrow-right-line",
                    "fr-link--icon-right",
                  )}
                  {...routes.adminAgencyDetail({
                    // this should be changed to agencyDashboardAgency/:agencyId, when it is ready
                    agencyId: agencyRight.agency.id,
                  }).link}
                >
                  Voir l'agence
                </a>
              )}
          </>,
          <ul className={fr.cx("fr-raw-list")}>
            <li>
              <AgencyTag
                refersToAgencyName={agencyRight.agency.refersToAgencyName}
              />
            </li>
            {!activeAgencyStatuses.includes(agencyRight.agency.status) && (
              <li>
                <AgencyStatusBadge status={agencyRight.agency.status} />
              </li>
            )}
            <li>
              Type : {agencyKindToLabelIncludingIF[agencyRight.agency.kind]}
            </li>
          </ul>,
          agencyRight.roles
            .map((role) => agencyRoleToDisplay[role].label)
            .join(", "),
          agencyRight.isNotifiedByEmail ? "Oui" : "Non",
          availableActions(agencyRight),
        ])}
      />
      {createPortal(
        <manageUserModal.Component title={"Modifier le rôle de l'utilisateur"}>
          {selectedAgencyRight && (
            <AgencyUserModificationForm
              agencyUser={{
                agencyId: selectedAgencyRight.agency.id,
                userId: user.id,
                roles: selectedAgencyRight.roles,
                email: user.email,
                isNotifiedByEmail: selectedAgencyRight.isNotifiedByEmail,
                isIcUser: !!user.externalId,
              }}
              closeModal={() => manageUserModal.close()}
              agencyHasRefersTo={!!selectedAgencyRight.agency.refersToAgencyId}
              isEmailDisabled={true}
              areRolesDisabled={
                !isBackofficeAdmin &&
                !selectedAgencyRight.roles.includes("agency-admin")
              }
              onSubmit={onUserUpdateRequested}
            />
          )}
        </manageUserModal.Component>,
        document.body,
      )}
    </>
  );
};
