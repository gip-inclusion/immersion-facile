import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import type { ReactNode } from "react";
import { type ConnectedUser, domElementIds } from "shared";
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

type UserProfileMode = "my-profile" | "admin-user";
type UserProfileTabId = "establishments" | "agencies";

type UserProfileTab = {
  tabId: UserProfileTabId;
  label: string;
  content: ReactNode;
};

type UserProfileProps = {
  title: string;
  userWithRights: ConnectedUser;
  editInformationsLink?: string;
  routeName: UserProfileAllowedRouteNames;
};

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

  const mode: UserProfileMode = getUserProfileMode(routeName);
  const currentTab = getCurrentTabId(routeName);

  const tabs: UserProfileTab[] = [
    {
      tabId: "agencies",
      label: `Organismes (${userAgenciesRights.length})`,
      content:
        userAgenciesRights.length === 0 ? (
          contentToShowWhenEmptyTab[mode].agencies
        ) : (
          <>
            {mode === "my-profile" && (
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
          contentToShowWhenEmptyTab[mode].establishments
        ) : (
          <>
            {mode === "my-profile" && (
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

  const onTabChange = (tabId: string) => {
    match({ mode, tabId: tabId as UserProfileTabId })
      .with({ mode: "admin-user", tabId: "agencies" }, () =>
        routes.adminUserDetailAgencies({ userId: userWithRights.id }).push(),
      )
      .with({ mode: "admin-user", tabId: "establishments" }, () =>
        routes
          .adminUserDetailEstablishments({ userId: userWithRights.id })
          .push(),
      )
      .with({ mode: "my-profile", tabId: "agencies" }, () =>
        routes.myProfileAgencies().push(),
      )
      .with({ mode: "my-profile", tabId: "establishments" }, () =>
        routes.myProfileEstablishments().push(),
      )
      .exhaustive();
  };

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
        onTabChange={onTabChange}
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

const getUserProfileMode = (
  routeName: UserProfileAllowedRouteNames,
): UserProfileMode => {
  return match(routeName)
    .returnType<UserProfileMode>()
    .with("adminUserDetailAgencies", () => "admin-user")
    .with("adminUserDetailEstablishments", () => "admin-user")
    .with("myProfileAgencies", () => "my-profile")
    .with("myProfileEstablishments", () => "my-profile")
    .exhaustive();
};

const getCurrentTabId = (
  routeName: UserProfileAllowedRouteNames,
): UserProfileTabId => {
  return match(routeName)
    .returnType<UserProfileTabId>()
    .with("adminUserDetailAgencies", () => "agencies")
    .with("adminUserDetailEstablishments", () => "establishments")
    .with("myProfileAgencies", () => "agencies")
    .with("myProfileEstablishments", () => "establishments")
    .exhaustive();
};

const contentToShowWhenEmptyTab: Record<
  UserProfileMode,
  Record<UserProfileTabId, ReactNode>
> = {
  "admin-user": {
    agencies: <p>Cet utilisateur n'est rattaché à aucune agence</p>,
    establishments: <p>Cet utilisateur n'est rattaché à aucune entreprise</p>,
  },
  "my-profile": {
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
            Départemental, etc.) permet de valider les conventions d'immersion
            ou encore de suivre les immersions.
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
            Vous n'êtes actuellement rattaché(e) à aucune entreprise
            accueillante.
          </p>
          <p>
            Être rattaché(e) à une entreprise permet de gérer les offres
            d'immersion, accéder aux mises en relation et suivre les immersions.
          </p>
          <Highlight className={fr.cx("fr-ml-0")} size="sm">
            Vous pourrez d'abord vérifier si votre entreprise existe déjà pour
            demander à y être rattaché(e). Si elle n'existe pas encore, vous
            serez guidé(e) vers le formulaire de création.
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
  },
};
