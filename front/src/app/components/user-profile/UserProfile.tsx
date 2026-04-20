import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import type { ReactNode } from "react";
import { type ConnectedUser, domElementIds, type UserId } from "shared";
import { ressourcesAndWebinarsUrl } from "src/app/contents/home/content";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { match } from "ts-pattern";
import type { Route } from "type-route";
import { AgenciesTablesSection } from "../agency/agencies-table/AgenciesTablesSection";
import { EstablishmentsTablesSection } from "../establishment/establishments-table/EstablishmentsTablesSection";
import { PersonnalInformationsSection } from "./PersonnalInformationsSection";

type UserProfileAllowedRouteNames = Route<
  | typeof routes.adminUserDetailAgencies
  | typeof routes.adminUserDetailEstablishments
  | typeof routes.myProfileAgencies
  | typeof routes.myProfileEstablishments
>["name"];

type UserProfileTabId = "establishments" | "agencies";

type UserProfileTab = {
  tabId: UserProfileTabId;
  label: string;
  content: ReactNode;
};

type RouteConfig = {
  tabId: UserProfileTabId;
  showRegistrationButtons: boolean;
  onTabChange: (tabId: UserProfileTabId) => void;
  emptyContent: Record<UserProfileTabId, ReactNode>;
};

type UserProfileProps = {
  title: string;
  userWithRights: ConnectedUser;
  editInformationsLink?: string;
  routeName: UserProfileAllowedRouteNames;
};

const adminTabChange =
  (userId: string) =>
  (tabId: UserProfileTabId): void =>
    match(tabId)
      .with("agencies", () => routes.adminUserDetailAgencies({ userId }).push())
      .with("establishments", () =>
        routes.adminUserDetailEstablishments({ userId }).push(),
      )
      .exhaustive();

const myProfileTabChange = (tabId: UserProfileTabId): void =>
  match(tabId)
    .with("agencies", () => routes.myProfileAgencies().push())
    .with("establishments", () => routes.myProfileEstablishments().push())
    .exhaustive();

const getRouteConfig = (
  routeName: UserProfileAllowedRouteNames,
  userId: UserId,
): RouteConfig =>
  match(routeName)
    .returnType<RouteConfig>()
    .with("adminUserDetailAgencies", () => ({
      tabId: "agencies",
      showRegistrationButtons: false,
      onTabChange: adminTabChange(userId),
      emptyContent: adminEmptyContent,
    }))
    .with("adminUserDetailEstablishments", () => ({
      tabId: "establishments",
      showRegistrationButtons: false,
      onTabChange: adminTabChange(userId),
      emptyContent: adminEmptyContent,
    }))
    .with("myProfileAgencies", () => ({
      tabId: "agencies",
      showRegistrationButtons: true,
      onTabChange: myProfileTabChange,
      emptyContent: myProfileEmptyContent,
    }))
    .with("myProfileEstablishments", () => ({
      tabId: "establishments",
      showRegistrationButtons: true,
      onTabChange: myProfileTabChange,
      emptyContent: myProfileEmptyContent,
    }))
    .exhaustive();

export const UserProfile = ({
  title,
  userWithRights,
  editInformationsLink,
  routeName,
}: UserProfileProps) => {
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);

  const userEstablishmentsRights =
    userWithRights.establishments?.filter(
      (userEstablishment) => userEstablishment.status === "ACCEPTED",
    ) || [];
  const userAgenciesRights = userWithRights.agencyRights;

  const {
    tabId: currentTab,
    showRegistrationButtons: showAddButtons,
    onTabChange,
    emptyContent,
  } = getRouteConfig(routeName, userWithRights.id);

  const tabs: UserProfileTab[] = [
    {
      tabId: "agencies",
      label: `Organismes (${userAgenciesRights.length})`,
      content:
        userAgenciesRights.length === 0 ? (
          emptyContent.agencies
        ) : (
          <>
            {showAddButtons && (
              <div className={fr.cx("fr-grid-row")}>
                <Button
                  id={domElementIds.profile.registerAgenciesSearchLink}
                  priority="primary"
                  linkProps={{
                    href: `${routes.myProfileAgencyRegistration().href}`,
                  }}
                  iconId="fr-icon-add-line"
                  className={fr.cx("fr-ml-auto")}
                >
                  Se rattacher à un organisme
                </Button>
              </div>
            )}
            <AgenciesTablesSection
              user={userWithRights}
              agencyRights={userWithRights.agencyRights}
            />
          </>
        ),
    },
    {
      tabId: "establishments",
      label: `Entreprises (${userEstablishmentsRights.length})`,
      content:
        userEstablishmentsRights.length === 0 ? (
          emptyContent.establishments
        ) : (
          <>
            {showAddButtons && (
              <div className={fr.cx("fr-grid-row")}>
                <Button
                  id={
                    domElementIds.myProfileEstablishmentRegistration
                      .registerEstablishmentButton
                  }
                  priority="primary"
                  linkProps={routes.myProfileEstablishmentRegistration({}).link}
                  className={fr.cx("fr-ml-auto")}
                  iconId="fr-icon-add-line"
                >
                  Se rattacher à une entreprise
                </Button>
              </div>
            )}
            <EstablishmentsTablesSection
              withEstablishmentData={userEstablishmentsRights}
              isBackofficeAdmin={currentUser?.isBackofficeAdmin}
            />
          </>
        ),
    },
  ];

  return (
    <div>
      <div className={fr.cx("fr-grid-row")}>
        <h1 className={fr.cx("fr-col-12", "fr-col-md")}>{title}</h1>
      </div>
      <PersonnalInformationsSection
        user={userWithRights}
        editInformationsLink={editInformationsLink}
      />
      <h2 className={fr.cx("fr-h4", "fr-mt-2w")}>Mes rattachements</h2>
      <Tabs
        onTabChange={(tabId) => onTabChange(tabId as UserProfileTabId)}
        selectedTabId={currentTab}
        tabs={tabs.map((tab) => ({
          ...tab,
          isDefault: tab.tabId === currentTab,
        }))}
      >
        {tabs.find((tab) => tab.tabId === currentTab)?.content}
      </Tabs>
    </div>
  );
};

const adminEmptyContent: Record<UserProfileTabId, ReactNode> = {
  agencies: <p>Cet utilisateur n'est rattaché à aucune agence</p>,
  establishments: <p>Cet utilisateur n'est rattaché à aucune entreprise</p>,
};

const myProfileEmptyContent: Record<UserProfileTabId, ReactNode> = {
  agencies: (
    <div
      className={fr.cx(
        "fr-grid-row",
        "fr-grid-row--gutters",
        "fr-grid-row--middle",
      )}
    >
      <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
        <h2 className={fr.cx("fr-h4", "fr-mt-2w")}>
          Vous n'êtes rattaché(e) à aucun organisme
        </h2>
        <p>Vous n'êtes actuellement rattaché(e) à aucun organisme.</p>
        <p>
          Un organisme (France Travail, Mission Locale, Cap emploi, Conseil
          Départemental, etc.) permet de valider les conventions d'immersion ou
          encore de suivre les immersions.
        </p>
        <Highlight className={fr.cx("fr-ml-0")} size="sm">
          Vous pourrez d'abord vérifier si votre organisme existe déjà pour
          demander à y être rattaché(e). S'il n'existe pas encore, vous serez
          guidé(e) vers le formulaire de création.
        </Highlight>
        <Button
          id={domElementIds.profile.registerAgencyButton}
          priority="primary"
          linkProps={routes.myProfileAgencyRegistration().link}
          className={fr.cx("fr-ml-auto")}
          iconId="fr-icon-add-line"
        >
          Se rattacher à un organisme
        </Button>
      </div>
      <div
        className={fr.cx(
          "fr-col-12",
          "fr-col-md-4",
          "fr-hidden",
          "fr-unhidden-md",
        )}
      >
        <img src={commonIllustrations.discussions} alt="Accès limité" />
      </div>
    </div>
  ),
  establishments: (
    <div
      className={fr.cx(
        "fr-grid-row",
        "fr-grid-row--gutters",
        "fr-grid-row--middle",
      )}
    >
      <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
        <h2 className={fr.cx("fr-h4", "fr-mt-2w")}>
          Vous n'êtes rattaché(e) à aucune entreprise
        </h2>
        <p>
          Vous n'êtes actuellement rattaché(e) à aucune entreprise accueillante.
        </p>
        <p>
          Être rattaché(e) à une entreprise permet de gérer les offres
          d'immersion, accéder aux mises en relation et suivre les immersions.
        </p>
        <Highlight className={fr.cx("fr-ml-0")} size="sm">
          Vous pourrez d'abord vérifier si votre entreprise existe déjà pour
          demander à y être rattaché(e). Si elle n'existe pas encore, vous serez
          guidé(e) vers le formulaire de création.
        </Highlight>
        <p className={fr.cx("fr-text--xs")}>
          Besoin d'aide pour référencer votre entreprise ?{" "}
          <a
            className={fr.cx("fr-download__link")}
            href={ressourcesAndWebinarsUrl}
            aria-label="Transcription textuelle, téléchargement en format texte"
          >
            Participez à notre webinaire
          </a>
        </p>
        <Button
          id={
            domElementIds.myProfileEstablishmentRegistration
              .registerEstablishmentButton
          }
          priority="primary"
          linkProps={routes.myProfileEstablishmentRegistration().link}
          className={fr.cx("fr-ml-auto")}
          iconId="fr-icon-add-line"
        >
          Se rattacher à une entreprise
        </Button>
      </div>
      <div
        className={fr.cx(
          "fr-col-12",
          "fr-col-md-4",
          "fr-hidden",
          "fr-unhidden-md",
        )}
      >
        <img src={commonIllustrations.structureAccueil} alt="Accès limité" />
      </div>
    </div>
  ),
};
