import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { all } from "ramda";
import { match, P } from "ts-pattern";
import { AbsoluteUrl, AgencyRight } from "shared";
import { Loader } from "react-design-system";
import { MetabaseView } from "src/app/components/MetabaseView";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ManageConventionFormSection } from "src/app/pages/admin/ManageConventionFormSection";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { RegisterAgenciesForm } from "../components/forms/register-agencies/RegisterAgenciesForm";

export const AgencyDashboardPage = () => {
  // the Layout (Header, Footer...) is given by InclusionConnectedPrivateRoute (higher order component)
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const feedback = useAppSelector(inclusionConnectedSelectors.feedback);
  const isLoading = useAppSelector(inclusionConnectedSelectors.isLoading);

  const dispatch = useDispatch();

  type AgencyDashboardTab = {
    label: string;
    content: JSX.Element;
  };

  const agencyDashboardTabs = (
    dashboardUrl: AbsoluteUrl,
    conventionErrorUrl?: AbsoluteUrl,
  ): AgencyDashboardTab[] => [
    {
      label: "Tableau de bord agence",
      content: (
        <>
          <ManageConventionFormSection
            routeNameToRedirectTo={"manageConventionAdmin"}
          />
          <MetabaseView title="Tableau de bord agence" url={dashboardUrl} />
        </>
      ),
    },
    ...(conventionErrorUrl
      ? [
          {
            label: "Conventions en erreur",
            content: (
              <MetabaseView
                title="Tableau de bord agence"
                url={conventionErrorUrl}
              />
            ),
          },
        ]
      : []),
  ];

  useEffect(() => {
    dispatch(inclusionConnectedSlice.actions.currentUserFetchRequested());
  }, []);

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <h1>Bienvenue</h1>
        <div className={fr.cx("fr-ml-auto", "fr-mt-1w")}>
          <Button
            onClick={() => {
              dispatch(authSlice.actions.federatedIdentityDeletionTriggered());
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
              dashboardUrl: P.select(
                "dashboardUrl",
                P.when((dashboardUrl) => dashboardUrl !== undefined),
              ),
              erroredConventionsDashboardUrl: P.select(
                "erroredConventionsDashboardUrl",
                P.when(
                  (erroredConventionsDashboardUrl) =>
                    erroredConventionsDashboardUrl !== undefined,
                ),
              ),
            },
          },
          ({ dashboardUrl, erroredConventionsDashboardUrl }) =>
            dashboardUrl &&
            erroredConventionsDashboardUrl && (
              <Tabs
                tabs={agencyDashboardTabs(
                  dashboardUrl,
                  erroredConventionsDashboardUrl,
                )}
              />
            ),
        )
        .with(
          {
            currentUser: {
              dashboardUrl: P.select(
                P.when((dashboardUrl) => dashboardUrl !== undefined),
              ),
            },
          },
          (dashboardUrl) => <Tabs tabs={agencyDashboardTabs(dashboardUrl)} />,
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
          { feedback: { kind: "errored", errorMessage: P.select() } },
          (errorMessage) => (
            <Alert severity="error" title="Erreur" description={errorMessage} />
          ),
        )
        .otherwise(() => null)}

      {feedback.kind === "errored" && (
        <SubmitFeedbackNotification
          submitFeedback={feedback}
          messageByKind={{ errored: "pas utilisé" }}
        />
      )}
    </>
  );
};
