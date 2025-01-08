import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Table from "@codegouvfr/react-dsfr/Table";
import { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import {
  AgencyRight,
  User,
  UserParamsForAgency,
  activeAgencyStatuses,
  addressDtoToString,
  agencyKindToLabelIncludingIF,
  domElementIds,
} from "shared";
import { routes } from "src/app/routes/routes";
import { AgencyStatusBadge } from "../agency/AgencyStatusBadge";
import { AgencyTag } from "../agency/AgencyTag";
import { AgencyUserModificationForm } from "../agency/AgencyUserModificationForm";
import { agencyRoleToDisplay } from "../agency/AgencyUsers";
import { Feedback } from "../feedback/Feedback";

const manageUserModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.admin.agencyTab.editAgencyManageUserModal,
});

export const AgenciesTablesSection = ({
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

  const toReviewAgencyRights = agencyRights.filter((agencyRight) =>
    agencyRight.roles.includes("to-review"),
  );
  const activeAgencyRights = agencyRights.filter(
    (agencyRight) => !agencyRight.roles.includes("to-review"),
  );

  return (
    <>
      <Feedback topic="user" />
      {toReviewAgencyRights.length > 0 && (
        <OnGoingAgencyRightsTable
          agenciesWithToReviewRights={toReviewAgencyRights}
        />
      )}
      {activeAgencyRights.length > 0 && (
        <ActiveAgencyRightsTable
          agenciesWithoutToReviewRights={activeAgencyRights}
          onUpdateClicked={onUpdateClicked}
        />
      )}
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
              routeName="myProfile"
            />
          )}
        </manageUserModal.Component>,
        document.body,
      )}
    </>
  );
};

const ActiveAgencyRightsTable = ({
  agenciesWithoutToReviewRights,
  onUpdateClicked,
  isBackofficeAdmin,
}: {
  agenciesWithoutToReviewRights: AgencyRight[];
  onUpdateClicked: (agencyRight: AgencyRight) => void;
  isBackofficeAdmin?: boolean;
}) => (
  <>
    <h2 className={fr.cx("fr-h4")}>
      Organismes rattachés au profil ({agenciesWithoutToReviewRights.length}{" "}
      {agenciesWithoutToReviewRights.length === 1 ? "agence" : "agences"})
    </h2>

    <Table
      headers={[
        "Organisme",
        "Caractéristiques de l'agence",
        "Administrateurs",
        "Roles",
        "Reçoit les notifications",
        "Actions",
      ]}
      data={agenciesWithoutToReviewRights
        .sort((a, b) => a.agency.name.localeCompare(b.agency.name))
        .map(makeAgencyRightLine(onUpdateClicked, isBackofficeAdmin))}
    />
  </>
);

const OnGoingAgencyRightsTable = ({
  agenciesWithToReviewRights,
}: { agenciesWithToReviewRights: AgencyRight[] }) => (
  <>
    <h2 className={fr.cx("fr-h4")}>
      Demandes d'accès en cours ({agenciesWithToReviewRights.length}{" "}
      {agenciesWithToReviewRights.length === 1 ? "agence" : "agences"})
    </h2>
    <Table
      headers={["Organisme", "Caractéristiques de l'agence", "Administrateurs"]}
      data={agenciesWithToReviewRights
        .sort((a, b) => a.agency.name.localeCompare(b.agency.name))
        .map(makeAgencyWithToReviewRightLine())}
    />
  </>
);

const makeAgencyRightLine =
  (
    onUpdateClicked: (agencyRight: AgencyRight) => void,
    isBackofficeAdmin?: boolean,
  ) =>
  (agencyRight: AgencyRight): ReactNode[] => [
    makeAgencyName({ agencyRight }),
    makeAgencyCaracteristics({ agencyRight }),
    makeAgencyAdminEmails({ agencyRight }),
    agencyRight.roles.map((role) => agencyRoleToDisplay[role].label).join(", "),
    agencyRight.isNotifiedByEmail ? "Oui" : "Non",
    makeWithAgencyRightsCTAs({
      agencyRight,
      onUpdateClicked,
      isBackofficeAdmin,
    }),
  ];

const makeAgencyWithToReviewRightLine =
  () =>
  (agencyRight: AgencyRight): ReactNode[] => [
    makeAgencyName({ agencyRight }),
    makeAgencyCaracteristics({ agencyRight }),
    makeAgencyAdminEmails({ agencyRight }),
  ];

const makeAgencyName = ({
  agencyRight,
}: { agencyRight: AgencyRight }): ReactNode => (
  <div key={agencyRight.agency.id}>
    {agencyRight.agency.name}
    <span className={fr.cx("fr-hint-text")}>
      {addressDtoToString(agencyRight.agency.address)}
    </span>

    {agencyRight.roles.includes("agency-admin") && (
      <a
        className={fr.cx(
          "fr-link",
          "fr-text--sm",
          "fr-icon-arrow-right-line",
          "fr-link--icon-right",
        )}
        {...routes.agencyDashboardAgencyDetails({
          agencyId: agencyRight.agency.id,
        }).link}
      >
        Voir l'agence
      </a>
    )}
  </div>
);

const makeAgencyCaracteristics = ({
  agencyRight,
}: { agencyRight: AgencyRight }): ReactNode => (
  <ul className={fr.cx("fr-raw-list")}>
    <li>
      <AgencyTag refersToAgencyName={agencyRight.agency.refersToAgencyName} />
    </li>
    {!activeAgencyStatuses.includes(agencyRight.agency.status) && (
      <li>
        <AgencyStatusBadge status={agencyRight.agency.status} />
      </li>
    )}
    <li>Type : {agencyKindToLabelIncludingIF[agencyRight.agency.kind]}</li>
  </ul>
);

const makeAgencyAdminEmails = ({
  agencyRight,
}: { agencyRight: AgencyRight }): ReactNode => (
  <ul className={fr.cx("fr-raw-list")}>
    {
      // missing admin emails on agencyRight
      ["fake@email.com", "fake2@email2.com"].map((admin) => (
        <li>{admin}</li>
      ))
    }
  </ul>
);

const makeWithAgencyRightsCTAs = ({
  agencyRight,
  isBackofficeAdmin,
  onUpdateClicked,
}: {
  agencyRight: AgencyRight;
  onUpdateClicked: (agencyRight: AgencyRight) => void;
  isBackofficeAdmin: boolean | undefined;
}): ReactNode => (
  <>
    <Button
      size="small"
      id={`${domElementIds.profile.editRoleButton}-${agencyRight.agency.id}`}
      onClick={() => {
        onUpdateClicked(agencyRight);
      }}
    >
      Modifier
    </Button>
    {isBackofficeAdmin && (
      <Button
        priority="tertiary no outline"
        id={`${domElementIds.profile.adminAgencyLink}-${agencyRight.agency.id}`}
        size="small"
        linkProps={
          routes.adminAgencyDetail({
            agencyId: agencyRight.agency.id,
          }).link
        }
      >
        Voir l'agence comme admin IF
      </Button>
    )}
  </>
);
