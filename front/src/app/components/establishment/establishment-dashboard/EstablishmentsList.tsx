import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { type ReactNode, useState } from "react";
import { CopyButton, RichTable } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  type AcceptedUserEstablishmentRightDetails,
  domElementIds,
  type Email,
  frontRoutes,
  getDisplayedBusinessName,
  onlyAdminUserRightsWithStatusAccepted,
  toLowerCaseWithoutDiacritics,
} from "shared";
import { establishmentRoleToDisplay } from "src/app/components/establishment/establishment-users";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import { geocodingSlice } from "src/core-logic/domain/geocoding/geocoding.slice";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";

const maxAdminsDisplayedInTable = 3;

const adminsListModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.establishmentDashboard.manageEstablishments.adminsListModal,
});

type EstablishmentsListProps = {
  establishments: AcceptedUserEstablishmentRightDetails[];
  currentUserEmail: Email;
  isBackofficeAdmin: boolean | undefined;
  shouldUpdateAvailability: string | undefined;
};

export const EstablishmentsList = ({
  establishments,
  currentUserEmail,
  isBackofficeAdmin,
  shouldUpdateAvailability,
}: EstablishmentsListProps): ReactNode => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [
    establishmentWithAdminsDisplayed,
    setEstablishmentWithAdminsDisplayed,
  ] = useState<AcceptedUserEstablishmentRightDetails | null>(null);

  const displayedEstablishments = establishments
    .filter((establishment) =>
      isEstablishmentMatchingSearchQuery(establishment, searchQuery),
    )
    .sort((a, b) =>
      getDisplayedBusinessName(a).localeCompare(getDisplayedBusinessName(b)),
    );

  const onManageEstablishmentClicked = (
    establishment: AcceptedUserEstablishmentRightDetails,
  ): void => {
    dispatch(establishmentSlice.actions.clearEstablishmentRequested());
    dispatch(siretSlice.actions.siretInfoClearRequested());
    dispatch(
      geocodingSlice.actions.clearLocatorDataRequested({
        locator: "create-establishment-in-person-address",
      }),
    );
    frontRoutes
      .establishmentDashboardFormEstablishment({
        siret: establishment.siret,
        shouldUpdateAvailability,
      })
      .push();
  };

  const onShowAllAdminsClicked = (
    establishment: AcceptedUserEstablishmentRightDetails,
  ): void => {
    setEstablishmentWithAdminsDisplayed(establishment);
    adminsListModal.open();
  };

  return (
    <>
      <RichTable
        label="Mes entreprises"
        isLoading={false}
        hasViewSwitch={false}
        searchBar={{
          label: "Rechercher une entreprise",
          placeholder: "Rechercher par nom d’enseigne, raison sociale ou SIRET",
          onSubmit: setSearchQuery,
        }}
        headers={["Entreprise", "Mon rôle", "Administrateurs", "Actions"]}
        tableData={displayedEstablishments.map((establishment) => [
          <EstablishmentNameAndSiret
            key={`${establishment.siret}-name`}
            establishment={establishment}
          />,
          <EstablishmentRole
            key={`${establishment.siret}-role`}
            establishment={establishment}
          />,
          <EstablishmentAdmins
            key={`${establishment.siret}-admins`}
            establishment={establishment}
            currentUserEmail={currentUserEmail}
            onShowAllAdminsClicked={onShowAllAdminsClicked}
          />,
          <EstablishmentActions
            key={`${establishment.siret}-actions`}
            establishment={establishment}
            isBackofficeAdmin={isBackofficeAdmin}
            onManageEstablishmentClicked={onManageEstablishmentClicked}
          />,
        ])}
      />
      {createPortal(
        <adminsListModal.Component
          title={`Administrateurs (${establishmentWithAdminsDisplayed?.admins.length ?? 0})`}
          buttons={[
            {
              id: domElementIds.establishmentDashboard.manageEstablishments
                .adminsListModalCloseButton,
              children: "Fermer",
            },
          ]}
        >
          {establishmentWithAdminsDisplayed && (
            <AdminsListModalContent
              establishment={establishmentWithAdminsDisplayed}
              currentUserEmail={currentUserEmail}
            />
          )}
        </adminsListModal.Component>,
        document.body,
      )}
    </>
  );
};

const isEstablishmentMatchingSearchQuery = (
  establishment: AcceptedUserEstablishmentRightDetails,
  searchQuery: string,
): boolean => {
  const normalizedSearchQuery = toLowerCaseWithoutDiacritics(
    searchQuery.trim(),
  );
  if (!normalizedSearchQuery) return true;

  return (
    toLowerCaseWithoutDiacritics(establishment.businessName).includes(
      normalizedSearchQuery,
    ) ||
    toLowerCaseWithoutDiacritics(
      establishment.businessNameCustomized ?? "",
    ).includes(normalizedSearchQuery) ||
    establishment.siret.includes(normalizedSearchQuery.replaceAll(" ", ""))
  );
};

const EstablishmentNameAndSiret = ({
  establishment,
}: {
  establishment: AcceptedUserEstablishmentRightDetails;
}): ReactNode => {
  const displayedBusinessName = getDisplayedBusinessName(establishment);
  const siretLabel = `SIRET ${establishment.siret}`;

  return (
    <>
      <p className={fr.cx("fr-text--bold", "fr-mb-0")}>
        {displayedBusinessName}
      </p>
      <p className={fr.cx("fr-text--sm", "fr-hint-text", "fr-mb-0")}>
        {displayedBusinessName === establishment.businessName
          ? siretLabel
          : `${establishment.businessName} • ${siretLabel}`}
      </p>
    </>
  );
};

const EstablishmentRole = ({
  establishment,
}: {
  establishment: AcceptedUserEstablishmentRightDetails;
}): ReactNode => {
  const roleDisplay = establishmentRoleToDisplay[establishment.role];

  return (
    <Badge small className={fr.cx(roleDisplay.className)}>
      {roleDisplay.label}
    </Badge>
  );
};

const getAdminEmailsWithCurrentUserFirst = (
  establishment: AcceptedUserEstablishmentRightDetails,
  currentUserEmail: Email,
): Email[] =>
  [
    ...establishment.admins.filter(({ email }) => email === currentUserEmail),
    ...establishment.admins.filter(({ email }) => email !== currentUserEmail),
  ].map(({ email }) => email);

const EstablishmentAdmins = ({
  establishment,
  currentUserEmail,
  onShowAllAdminsClicked,
}: {
  establishment: AcceptedUserEstablishmentRightDetails;
  currentUserEmail: Email;
  onShowAllAdminsClicked: (
    establishment: AcceptedUserEstablishmentRightDetails,
  ) => void;
}): ReactNode => {
  const adminEmails = getAdminEmailsWithCurrentUserFirst(
    establishment,
    currentUserEmail,
  );

  return (
    <>
      <ul className={fr.cx("fr-raw-list")}>
        {adminEmails.slice(0, maxAdminsDisplayedInTable).map((email) => (
          <li key={email}>
            {email === currentUserEmail ? (
              <span className={fr.cx("fr-text--sm")}>Vous</span>
            ) : (
              <a
                href={`mailto:${email}`}
                className={fr.cx("fr-link", "fr-link--sm")}
              >
                {email}
              </a>
            )}
          </li>
        ))}
      </ul>
      {adminEmails.length > maxAdminsDisplayedInTable && (
        <Button
          id={`${domElementIds.establishmentDashboard.manageEstablishments.showAllAdminsButton}-${establishment.siret}`}
          priority="tertiary"
          size="small"
          className={fr.cx("fr-mt-1w")}
          onClick={() => onShowAllAdminsClicked(establishment)}
        >
          Voir la liste complète ({adminEmails.length})
        </Button>
      )}
    </>
  );
};

const AdminsListModalContent = ({
  establishment,
  currentUserEmail,
}: {
  establishment: AcceptedUserEstablishmentRightDetails;
  currentUserEmail: Email;
}): ReactNode => (
  <>
    <p className={fr.cx("fr-text--lg", "fr-mb-2w")}>
      {getDisplayedBusinessName(establishment)}
    </p>
    <p className={fr.cx("fr-hint-text", "fr-mb-2w")}>
      Pour modifier votre rôle ou débloquer l'accès d'un collègue, contactez
      l'un de ces administrateurs :
    </p>
    <ul className={fr.cx("fr-raw-list")}>
      {getAdminEmailsWithCurrentUserFirst(establishment, currentUserEmail).map(
        (email, index) => (
          <li key={email} className={fr.cx("fr-mb-1w")}>
            {email === currentUserEmail ? (
              <span>Vous</span>
            ) : (
              <>
                <a href={`mailto:${email}`} className={fr.cx("fr-link")}>
                  {email}
                </a>
                <CopyButton
                  id={`${domElementIds.establishmentDashboard.manageEstablishments.adminsListModalCopyEmailButton}-${index}`}
                  label="Copier l'adresse email"
                  textToCopy={email}
                  withIcon
                  iconOnly
                  className={fr.cx("fr-ml-1v")}
                />
              </>
            )}
          </li>
        ),
      )}
    </ul>
  </>
);

const EstablishmentActions = ({
  establishment,
  isBackofficeAdmin,
  onManageEstablishmentClicked,
}: {
  establishment: AcceptedUserEstablishmentRightDetails;
  isBackofficeAdmin: boolean | undefined;
  onManageEstablishmentClicked: (
    establishment: AcceptedUserEstablishmentRightDetails,
  ) => void;
}): ReactNode => (
  <>
    {onlyAdminUserRightsWithStatusAccepted(establishment) ? (
      <Button
        id={`${domElementIds.establishmentDashboard.manageEstablishments.manageEstablishmentButton}-${establishment.siret}`}
        priority="secondary"
        size="small"
        onClick={() => onManageEstablishmentClicked(establishment)}
      >
        Gérer l'entreprise
      </Button>
    ) : (
      <p className={fr.cx("fr-text--xs", "fr-hint-text", "fr-mb-0")}>
        <span
          className={fr.cx("fr-icon-lock-fill", "fr-icon--xs", "fr-mr-1v")}
          aria-hidden="true"
        />
        Gestion réservée aux administrateurs
      </p>
    )}
    {isBackofficeAdmin && (
      <Button
        id={`${domElementIds.establishmentDashboard.manageEstablishments.adminEstablishmentLink}-${establishment.siret}`}
        priority="tertiary no outline"
        size="small"
        linkProps={
          frontRoutes.adminEstablishments({ siret: establishment.siret }).link
        }
      >
        Voir comme admin IF
      </Button>
    )}
  </>
);
