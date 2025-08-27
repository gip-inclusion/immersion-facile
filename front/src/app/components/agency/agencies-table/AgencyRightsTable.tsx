import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Table from "@codegouvfr/react-dsfr/Table";
import { Fragment, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  type AgencyRight,
  addressDtoToString,
  agencyKindToLabelIncludingIFAndPrepa,
  type User,
  type UserParamsForAgency,
} from "shared";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUserModificationForm } from "src/app/components/agency/AgencyUserModificationForm";
import { AgencyLineRightsCTAs } from "src/app/components/agency/agencies-table/agency-line/AgencyLineRightsCTAs";
import { agencyRolesToDisplay } from "src/app/contents/userRolesToDisplay";
import { routes } from "src/app/routes/routes";
import { AgencyLineAdminEmails } from "./agency-line/AgencyLineAdminEmails";

type AgencyRightsTableProps = {
  agencyRights: AgencyRight[];
  title: string;
  user: User;
  isBackofficeAdmin?: boolean;
  onUserRegistrationCancelledRequested?: (agencyRight: AgencyRight) => void;
} & (
  | {
      onUserUpdateRequested: (userParamsForAgency: UserParamsForAgency) => void;
      modalId: string;
    }
  | { onUserUpdateRequested?: undefined; modalId?: string }
);

export const AgencyRightsTable = ({
  agencyRights,
  user,
  title,
  isBackofficeAdmin,
  modalId,
  onUserUpdateRequested,
  onUserRegistrationCancelledRequested,
}: AgencyRightsTableProps) => {
  const [selectedAgencyRight, setSelectedAgencyRight] =
    useState<AgencyRight | null>(null);

  const userModal = useMemo(
    () =>
      onUserUpdateRequested && modalId
        ? createModal({
            isOpenedByDefault: false,
            id: modalId,
          })
        : null,
    [modalId, onUserUpdateRequested],
  );

  const onUpdateClicked = (agencyRight: AgencyRight) => {
    if (!userModal) return;
    setSelectedAgencyRight(agencyRight);
    userModal.open();
  };

  return (
    <>
      <h2 className={fr.cx("fr-h6")}>{title}</h2>

      <Table
        fixed
        headers={[
          "Organisme",
          "Type",
          "Administrateurs",
          "Mes Rôles & préférences",
        ]}
        data={agencyRights
          .sort((a, b) => a.agency.name.localeCompare(b.agency.name))
          .map((agencyRight) =>
            AgencyRightLine(
              agencyRight,
              onUserUpdateRequested && onUpdateClicked,
              onUserRegistrationCancelledRequested,
            ),
          )}
      />
      {onUserUpdateRequested &&
        userModal &&
        createPortal(
          <userModal.Component title={"Modifier le rôle de l'utilisateur"}>
            {selectedAgencyRight && (
              <AgencyUserModificationForm
                agencyUser={{
                  agencyId: selectedAgencyRight.agency.id,
                  userId: user.id,
                  roles: selectedAgencyRight.roles,
                  email: user.email,
                  isNotifiedByEmail: selectedAgencyRight.isNotifiedByEmail,
                  isIcUser: !!user.proConnect,
                }}
                closeModal={() => userModal.close()}
                agencyHasRefersTo={
                  !!selectedAgencyRight.agency.refersToAgencyId
                }
                isEmailDisabled={true}
                areRolesDisabled={
                  !isBackofficeAdmin &&
                  !selectedAgencyRight.roles.includes("agency-admin")
                }
                onSubmit={onUserUpdateRequested}
                routeName="myProfile"
              />
            )}
          </userModal.Component>,
          document.body,
        )}
    </>
  );
};

const AgencyRightLine = (
  agencyRight: AgencyRight,
  onUpdateClicked?: (agencyRight: AgencyRight) => void,
  onRegistrationCancelledClicked?: (agencyRight: AgencyRight) => void,
) => [
  <Fragment key={`${agencyRight.agency.id}-agency-infos`}>
    <AgencyTag refersToAgencyName={agencyRight.agency.refersToAgencyName} />
    <AgencyStatusBadge status={agencyRight.agency.status} />
    <br />
    <span>{agencyRight.agency.name}</span>
    <br />
    <span className={fr.cx("fr-hint-text", "fr-mb-1w")}>
      {addressDtoToString(agencyRight.agency.address)}
    </span>
    {agencyRight.roles.includes("agency-admin") && (
      <Button
        key={`${agencyRight.agency.id}-see-agency-link`}
        linkProps={
          routes.agencyDashboardAgencyDetails({
            agencyId: agencyRight.agency.id,
          }).link
        }
        size="small"
        priority="secondary"
        iconId="fr-icon-arrow-right-line"
      >
        Voir l'organisme
      </Button>
    )}
  </Fragment>,
  agencyKindToLabelIncludingIFAndPrepa[agencyRight.agency.kind],

  AgencyLineAdminEmails({ agencyRight }),

  <Fragment key={`${agencyRight.agency.id}-agency-infos`}>
    {/* {!agencyRight.roles.includes("to-review") && (
      <> */}
    <div className={fr.cx("fr-mb-1w")}>
      {agencyRight.roles
        .map((role) => agencyRolesToDisplay[role].label)
        .join(", ")}
    </div>
    <div className={fr.cx("fr-hint-text", "fr-mb-1w")}>
      {agencyRight.isNotifiedByEmail
        ? "✅ reçoit les notifications"
        : "❌ ne reçoit pas les notifications"}
    </div>
    {/* </>
    )} */}

    {AgencyLineRightsCTAs({
      agencyRight,
      onUpdateClicked,
      onRegistrationCancelledClicked,
    })}
  </Fragment>,
];
