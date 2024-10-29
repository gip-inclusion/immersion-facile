import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { subMinutes } from "date-fns";
import { all } from "ramda";
import React from "react";
import { Loader } from "react-design-system";
import { AgencyRight, InclusionConnectedUser, domElementIds } from "shared";
import { MetabaseView } from "src/app/components/MetabaseView";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { isAgencyDashboardTab } from "src/app/routes/routeParams/agencyDashboardTabs";
import { routes } from "src/app/routes/routes";
import { DashboardTab, getDashboardTabs } from "src/app/utils/dashboard";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { P, match } from "ts-pattern";
import { Route } from "type-route";
import { RegisterAgenciesForm } from "../../components/forms/register-agencies/RegisterAgenciesForm";
import { MarkPartnersErroredConventionAsHandledFormSection } from "./MarkPartnersErroredConventionAsHandledFormSection";

export const AgencyDashboardPage = ({
  route,
}: {
  route: Route<typeof routes.agencyDashboard>;
}) => {
  // the Layout (Header, Footer...) is given by InclusionConnectedPrivateRoute (higher order component)
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const feedback = useAppSelector(inclusionConnectedSelectors.feedback);
  const isLoading = useAppSelector(inclusionConnectedSelectors.isLoading);
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );

  const rawAgencyDashboardTabs = ({
    dashboards: {
      agencies: { agencyDashboardUrl, erroredConventionsDashboardUrl },
    },
    agencyRights,
  }: InclusionConnectedUser): DashboardTab[] => [
    ...(agencyDashboardUrl
      ? [
          {
            tabId: "dashboard",
            label: "Tableau de bord",
            content: (
              <MetabaseView
                title="Tableau de bord agence"
                subtitle="Cliquer sur l'identifiant de la convention pour y accéder."
                url={agencyDashboardUrl}
              />
            ),
          },
        ]
      : []),
    ...(erroredConventionsDashboardUrl
      ? [
          {
            tabId: "conventions-synchronisees",
            label: "Conventions synchronisées",
            content: (
              <>
                {isPeUser(agencyRights) && (
                  <Button
                    priority="secondary"
                    linkProps={{
                      href: "https://view.officeapps.live.com/op/embed.aspx?src=https://mediatheque.francetravail.fr/documents/Immersion_facilitee/GUIDE_SAISIE_(de_gestion)_DES_CONVENTIONS_(en_erreur).pptx",
                      target: "_blank",
                      rel: "noreferrer",
                    }}
                  >
                    Guide de gestion des conventions en erreur
                  </Button>
                )}
                {inclusionConnectedJwt ? (
                  <MarkPartnersErroredConventionAsHandledFormSection
                    jwt={inclusionConnectedJwt}
                    isPeUser={isPeUser(agencyRights)}
                  />
                ) : (
                  <Alert
                    severity="error"
                    title="Non autorisé"
                    description="Cette page est reservée aux utilisateurs connectés avec Inclusion Connect, et dont l'agence est responsable de cette convention."
                  />
                )}
                <MetabaseView
                  title="Tableau de bord agence"
                  url={erroredConventionsDashboardUrl}
                />
                {isPeUser(agencyRights) && (
                  <>
                    <h2 className={fr.cx("fr-h5", "fr-mt-2w")}>
                      Comment prévenir les erreurs :
                    </h2>

                    <h3 className={fr.cx("fr-h6")}>
                      Identifiant National DE trouvé mais écart sur la date de
                      naissance
                    </h3>
                    <p>
                      Action → Modifier la date de naissance dans la demande
                      pour correspondre à l'information présente dans le dossier
                      du Demandeur d'emploi
                    </p>

                    <h3 className={fr.cx("fr-h6")}>
                      Identifiant National DE non trouvé
                    </h3>
                    <p>
                      Action → Soit le mail utilisé chez Immersion Facilitée est
                      différent de celui du dossier du Demandeur d'emploi. Dans
                      ce cas, modifier l'email dans le dossier du Demandeur
                      d'emploi avant validation et avec son accord.
                    </p>
                    <p>
                      Action → Soit le candidat n'est pas inscrit. Dans ce cas,
                      procéder à l'inscription ou réinscription avant la
                      validation .
                    </p>
                  </>
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  const currentTab = route.params.tab;

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <h1>Bienvenue</h1>
      </div>
      {isLoading && <Loader />}
      {match({ currentUser, feedback })
        .with(
          {
            feedback: {
              kind: "idle",
            },
          },
          () => <Loader />,
        )
        .with(
          {
            feedback: {
              kind: "agencyRegistrationSuccess",
            },
          },
          () => (
            <Alert
              severity="success"
              title="Bravo !"
              description="Votre demande de première connexion a bien été reçue. Vous recevrez un email de confirmation dès qu'elle aura  été acceptée par nos équipes (2-7 jours ouvrés)."
            />
          ),
        )
        .with(
          {
            currentUser: {
              agencyRights: [],
            },
          },
          ({ currentUser }) => {
            if (new Date(currentUser.createdAt) > subMinutes(new Date(), 1))
              return (
                <Alert
                  severity="warning"
                  title="Rattachement à vos agences en cours"
                  description="Vous êtes bien connecté. Nous sommes en train de vérifier si vous avez des agences rattachées à votre compte. Merci de patienter. Ca ne devrait pas prendre plus de 1 minute. Veuillez recharger la page après ce delai."
                />
              );
            return <RegisterAgenciesForm />;
          },
        )
        .with(
          {
            currentUser: {
              agencyRights: P.when(
                all((agencyRight: AgencyRight) =>
                  agencyRight.roles.includes("to-review"),
                ),
              ),
            },
          },
          () => (
            <Alert
              severity="info"
              title="En attente de validation"
              description="Votre demande d'accès à l'outil est en cours de validation par l'administration. Vous recevrez un email dès que votre accès sera validé."
            />
          ),
        )
        .with(
          {
            currentUser: P.not(null),
          },
          ({ currentUser }) => (
            <Tabs
              tabs={getDashboardTabs(
                rawAgencyDashboardTabs(currentUser),
                currentTab,
              )}
              id={domElementIds.agencyDashboard.dashboard.tabContainer}
              selectedTabId={currentTab}
              onTabChange={(tab) => {
                if (isAgencyDashboardTab(tab))
                  routes
                    .agencyDashboard({
                      tab,
                    })
                    .push();
              }}
            >
              {
                rawAgencyDashboardTabs(currentUser).find(
                  (tab) => tab.tabId === currentTab,
                )?.content
              }
            </Tabs>
          ),
        )
        .with(
          { feedback: { kind: "errored", errorMessage: P.select() } },
          (errorMessage) => (
            <Alert severity="error" title="Erreur" description={errorMessage} />
          ),
        )
        .otherwise(() => null)}

      {feedback.kind === "errored" && (
        <SubmitFeedbackNotification
          submitFeedback={feedback}
          messageByKind={{
            errored: { title: "Erreur", message: "pas utilisé" },
          }}
        />
      )}
    </>
  );
};

const isPeUser = (agencyRights: AgencyRight[]) =>
  agencyRights.some((agencyRight) => agencyRight.agency.kind === "pole-emploi");
