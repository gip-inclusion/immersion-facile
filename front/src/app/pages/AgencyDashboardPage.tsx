import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";

export const AgencyDashboardPage = () => {
  // the Layout (Header, Footer...) is given by InclusionConnectedPrivateRoute (higher order component)
  const inclusionConnectToken = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const dispatch = useDispatch();

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
      </div>
    </div>
  );
};
