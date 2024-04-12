import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { all } from "ramda";
import React from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { AgencyRight, InclusionConnectedUser, domElementIds } from "shared";
import { MetabaseView } from "src/app/components/MetabaseView";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ManageConventionFormSection } from "src/app/pages/admin/ManageConventionFormSection";
import { isAgencyDashboardTab } from "src/app/routes/routeParams/agencyDashboardTabs";
import { routes } from "src/app/routes/routes";
import { DashboardTab, getDashboardTabs } from "src/app/utils/dashboard";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { partnersErroredConventionSelectors } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.selector";
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
  const markErroredConventionAsHandledFeedback = useAppSelector(
    partnersErroredConventionSelectors.feedback,
  );
  const isLoading = useAppSelector(inclusionConnectedSelectors.isLoading);
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const dispatch = useDispatch();

  const rawAgencyDashboardTabs = ({
    agencyDashboardUrl,
    erroredConventionsDashboardUrl,
  }: InclusionConnectedUser): DashboardTab[] => [
    ...(agencyDashboardUrl
      ? [
          {
            tabId: "dashboard",
            label: "Tableau de bord agence",
            content: (
              <>
                <ManageConventionFormSection
                  routeNameToRedirectTo={"manageConventionInclusionConnected"}
                />
                <MetabaseView
                  title="Tableau de bord agence"
                  url={agencyDashboardUrl}
                />
              </>
            ),
          },
        ]
      : []),
    ...(erroredConventionsDashboardUrl
      ? [
          {
            tabId: "conventions-en-erreur",
            label: "Conventions en erreur",
            content: (
              <>
                <Button
                  priority="secondary"
                  linkProps={{
                    href: "https://view.officeapps.live.com/op/embed.aspx?src=https://mediatheque.pole-emploi.fr/documents/Immersion_facilitee/GUIDE_SAISIE_DES_CONVENTIONS.pptx",
                    target: "_blank",
                    rel: "noreferrer",
                  }}
                >
                  Guide de saisie des conventions
                </Button>
                {inclusionConnectedJwt ? (
                  <>
                    <MarkPartnersErroredConventionAsHandledFormSection
                      jwt={inclusionConnectedJwt}
                    />
                    <SubmitFeedbackNotification
                      submitFeedback={markErroredConventionAsHandledFeedback}
                      messageByKind={{
                        markedAsHandled: {
                          title: "Succès",
                          message:
                            "La convention a bien été marquée comme traité.",
                        },
                      }}
                    />
                  </>
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
        <div className={fr.cx("fr-ml-auto", "fr-mt-1w")}>
          <Button
            onClick={() => {
              dispatch(
                authSlice.actions.federatedIdentityDeletionTriggered(
                  route.name,
                ),
              );
            }}
            type="button"
            priority="secondary"
          >
            Se déconnecter
          </Button>
        </div>
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
          () => <RegisterAgenciesForm />,
        )
        .with(
          {
            currentUser: {
              agencyRights: P.when(
                all(
                  (agencyRight: AgencyRight) => agencyRight.role === "toReview",
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
            currentUser: {
              agencyRights: P.when(
                all(
                  (agencyRight: AgencyRight) => agencyRight.role === "toReview",
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