import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { useEffect } from "react";
import { type ConnectedUser, domElementIds } from "shared";
import { ressourcesAndWebinarsUrl } from "src/app/contents/home/content";
import { routes, useRoute } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
import { AgenciesTablesSection } from "../agency/agencies-table/AgenciesTablesSection";
import { EstablishmentsTablesSection } from "../establishment/establishments-table/EstablishmentsTablesSection";
import { PersonnalInformationsSection } from "./PersonnalInformationsSection";

type ProfileTabRouteName = "myProfileAgencies" | "myProfileEstablishments";

type UserProfileProps = {
  title: string;
  userWithRights: ConnectedUser;
  editInformationsLink?: string;
};

export const UserProfile = ({
  title,
  userWithRights,
  editInformationsLink,
}: UserProfileProps) => {
  const route = useRoute();

  const userWithRightsEstablishments =
    userWithRights.establishments?.filter(
      (userEstablishment) => userEstablishment.status === "ACCEPTED",
    ) || [];
  const userWithRightsAgencies = userWithRights.agencyRights;
  const currentTab = route.name || "myProfileAgencies";

  useEffect(() => {
    if (route.name === "myProfile") {
      routes.myProfileAgencies().push();
    }
  }, [route.name]);

  const tabs = [
    {
      tabId: "myProfileAgencies" satisfies ProfileTabRouteName,
      label: `Organismes (${userWithRightsAgencies.length})`,
      content:
        userWithRightsAgencies.length === 0 ? (
          <div
            className={fr.cx(
              "fr-grid-row",
              "fr-grid-row--gutters",
              "fr-grid-row--middle",
            )}
          >
            <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
              <h2 className={fr.cx("fr-h4", "fr-mt-2w")}>
                Vous n’êtes rattaché(e) à aucun organisme
              </h2>
              <p>Vous n’êtes actuellement rattaché(e) à aucun organisme.</p>
              <p>
                Un organisme (France Travail, Mission Locale, Cap emploi,
                Conseil Départemental, etc.) permet de valider les conventions
                d’immersion ou encore de suivre les immersions.
              </p>
              <Highlight className={fr.cx("fr-ml-0")} size="sm">
                Vous pourrez d’abord vérifier si votre organisme existe déjà
                pour demander à y être rattaché(e). S’il n’existe pas encore,
                vous serez guidé(e) vers le formulaire de création.
              </Highlight>
              <Button
                id={domElementIds.profile.registerEstablishmentButton}
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
        ) : (
          <AgenciesTablesSection
            user={userWithRights}
            agencyRights={userWithRights.agencyRights}
          />
        ),
    },
    {
      tabId: "myProfileEstablishments" satisfies ProfileTabRouteName,
      label: `Entreprises (${userWithRightsEstablishments.length})`,
      content:
        userWithRightsEstablishments.length === 0 ? (
          <div
            className={fr.cx(
              "fr-grid-row",
              "fr-grid-row--gutters",
              "fr-grid-row--middle",
            )}
          >
            <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
              <h2 className={fr.cx("fr-h4", "fr-mt-2w")}>
                Vous n’êtes rattaché(e) à aucune entreprise
              </h2>
              <p>
                Vous n’êtes actuellement rattaché(e) à aucune entreprise
                accueillante.
              </p>
              <p>
                Être rattaché(e) à une entreprise permet de gérer les offres
                d’immersion, accéder aux mises en relation et suivre les
                immersions.
              </p>
              <Highlight className={fr.cx("fr-ml-0")} size="sm">
                Vous pourrez d’abord vérifier si votre entreprise existe déjà
                pour demander à y être rattaché(e). Si elle n’existe pas encore,
                vous serez guidé(e) vers le formulaire de création.
              </Highlight>
              <p className={fr.cx("fr-text--xs")}>
                Besoin d’aide pour référencer votre entreprise ?{" "}
                <a
                  className={fr.cx("fr-download__link")}
                  href={ressourcesAndWebinarsUrl}
                  aria-label="Transcription textuelle, téléchargement en format texte"
                >
                  Participez à notre webinaire
                </a>
              </p>
              <Button
                id={domElementIds.profile.registerEstablishmentButton}
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
              <img
                src={commonIllustrations.structureAccueil}
                alt="Accès limité"
              />
            </div>
          </div>
        ) : (
          <EstablishmentsTablesSection
            withEstablishmentData={userWithRightsEstablishments}
          />
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
        onTabChange={(tab) => {
          routes[tab as ProfileTabRouteName]().push();
        }}
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
