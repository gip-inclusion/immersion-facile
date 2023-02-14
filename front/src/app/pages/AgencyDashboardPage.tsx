import { Button } from "@codegouvfr/react-dsfr/Button";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
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
    <div>
      <Button
        onClick={() => {
          dispatch(authSlice.actions.federatedIdentityDeletionTriggered());
        }}
        type="button"
      >
        Se déconnecter
      </Button>
      <br />
      <br />
      <div>
        Bienvenue sur le tableau de bord de l'agence
        <br />
        Voici votre token,(obtenu grâce à inclusion connect)
        <p style={{ width: "200px" }}>{inclusionConnectToken}</p>
        <strong>
          Url du dashboard récupérée du back : {agencyDashboardUrl}
        </strong>
      </div>
      <SubmitFeedbackNotification
        submitFeedback={feedback}
        messageByKind={{ success: "Dashboard récupéré avec succès" }}
      />
    </div>
  );
};
