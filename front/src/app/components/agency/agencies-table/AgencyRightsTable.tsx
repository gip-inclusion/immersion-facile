import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Table from "@codegouvfr/react-dsfr/Table";
import { values } from "ramda";
import { Fragment, useMemo, useState } from "react";
import { HeadingSection, NotificationIndicator } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
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
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { fetchAgencySelectors } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.selectors";
import { fetchAgencySlice } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
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
  const dispatch = useDispatch();
  const [selectedAgencyRight, setSelectedAgencyRight] =
    useState<AgencyRight | null>(null);
  const selectedAgencyUsersById = useAppSelector(
    fetchAgencySelectors.agencyUsers,
  );
  const selectedAgencyHasCounsellorRoles = values(selectedAgencyUsersById).some(
    (user) =>
      values(user.agencyRights)
        .filter((right) => right.agency.id === selectedAgencyRight?.agency.id)
        .some((right) => right.roles.includes("counsellor")),
  );

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
    dispatch(
      fetchAgencySlice.actions.fetchAgencyUsersRequested({
        agencyId: agencyRight.agency.id,
      }),
    );
    setSelectedAgencyRight(agencyRight);
    userModal.open();
  };

  return (
    <HeadingSection title={title} titleAs="h4">
      <Table
        headers={[
          "Organisme",
          "Type",
          "Administrateurs",
          "Mes Rôles & préférences",
        ]}
        data={agencyRights
          .sort((a, b) => {
            const aIsClosedOrRejected =
              a.agency.status === "closed" || a.agency.status === "rejected";
            const bIsClosedOrRejected =
              b.agency.status === "closed" || b.agency.status === "rejected";

            if (aIsClosedOrRejected && !bIsClosedOrRejected) return 1;
            if (!aIsClosedOrRejected && bIsClosedOrRejected) return -1;

            return a.agency.name.localeCompare(b.agency.name);
          })
          .map((agencyRight) =>
            AgencyRightLine(
              agencyRight,
              onUserUpdateRequested && onUpdateClicked,
              onUserRegistrationCancelledRequested,
              isBackofficeAdmin,
            ),
          )}
      />
      {onUserUpdateRequested &&
        userModal &&
        createPortal(
          <userModal.Component title={"Modifier le rôle de l'utilisateur"}>
            {selectedAgencyRight && (
              <AgencyUserModificationForm
                modalId={modalId}
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
                hasCounsellorRoles={selectedAgencyHasCounsellorRoles}
              />
            )}
          </userModal.Component>,
          document.body,
        )}
    </HeadingSection>
  );
};

const AgencyRightLine = (
  agencyRight: AgencyRight,
  onUpdateClicked?: (agencyRight: AgencyRight) => void,
  onRegistrationCancelledClicked?: (agencyRight: AgencyRight) => void,
  isBackofficeAdmin?: boolean,
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

  <AgencyLineAdminEmails
    key={`${agencyRight.agency.id}-admin-emails`}
    agencyRight={agencyRight}
  />,

  <Fragment key={`${agencyRight.agency.id}-agency-infos`}>
    <div className={fr.cx("fr-mb-1w")}>
      {agencyRight.roles
        .map((role) => agencyRolesToDisplay[role].label)
        .join(", ")}
    </div>
    <div className={fr.cx("fr-mb-1w")}>
      <NotificationIndicator isNotified={agencyRight.isNotifiedByEmail} />
    </div>
    <AgencyLineRightsCTAs
      key={`${agencyRight.agency.id}-rights-ctas`}
      agencyRight={agencyRight}
      onUpdateClicked={onUpdateClicked}
      onRegistrationCancelledClicked={onRegistrationCancelledClicked}
      isBackofficeAdmin={isBackofficeAdmin}
    />
  </Fragment>,
];
