import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { MetabaseView } from "src/app/components/MetabaseView";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";

export const AgencyDashboardPage = () => {
  // the Layout (Header, Footer...) is given by InclusionConnectedPrivateRoute (higher order component)
  const inclusionConnectToken = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const agencyDashboardUrl = useAppSelector(
    inclusionConnectedSelectors.agencyDashboardUrl,
  );
  const feedback = useAppSelector(inclusionConnectedSelectors.feedback);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      inclusionConnectedSlice.actions.agencyDashboardUrlFetchRequested(),
    );
  }, []);

  if (!inclusionConnectToken)
    return (
      <p>
        No inclusion token, should not happen as we are in
        InclusionConnectedPrivateRoute
      </p>
    );

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

      {agencyDashboardUrl ? (
        <MetabaseView title="Tableau de bord agence" url={agencyDashboardUrl} />
      ) : (
        <Alert
          severity="warning"
          title="Pas d'agence rattachée"
          description="Vous êtes bien connecté avec Inclusion Connect mais nous ne savons pas à
    quelle agence vous êtes rattachée... Vous pouvez contacter le support pour
    nous communiquer votre agence."
        />
      )}

      {feedback.kind === "errored" &&
        !feedback.errorMessage.includes("No agency found for user with ID") && (
          <SubmitFeedbackNotification
            submitFeedback={feedback}
            messageByKind={{ errored: "pas utilisé" }}
          />
        )}
    </>
  );
};
