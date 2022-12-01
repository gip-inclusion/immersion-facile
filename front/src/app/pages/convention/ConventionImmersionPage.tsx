import { CircularProgress } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { FederatedIdentity } from "shared";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";

import { routes } from "src/app/routes/routes";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { Route } from "type-route";

export type ConventionImmersionPageRoute = Route<
  typeof routes.conventionImmersion
>;

interface ConventionImmersionPageProps {
  route: ConventionImmersionPageRoute;
}

export const ConventionImmersionPage = ({
  route,
}: ConventionImmersionPageProps) => (
  <HeaderFooterLayout>
    <ConventionFormContainerLayout>
      <PageContent route={route} />
    </ConventionFormContainerLayout>
  </HeaderFooterLayout>
);

const PageContent = ({ route }: ConventionImmersionPageProps) => {
  const { enablePeConnectApi, isLoading } = useFeatureFlags();
  const connectedWith = useAppSelector(authSelectors.connectedWith);

  useFederatedIdentity(route);
  useFederatedIdentityOnReload();

  if (isLoading) return <CircularProgress />;

  if (route.params.jwt)
    return (
      <ConventionForm
        properties={conventionInitialValuesFromUrl({
          route,
          internshipKind: "immersion",
        })}
        routeParams={route.params}
      />
    );

  if (enablePeConnectApi && !connectedWith)
    return (
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <InitiateConventionCard
          title="Une demande de convention d'immersion a été partagée avec vous. "
          peConnectNotice="Je suis demandeur d’emploi et je connais mes identifiants à mon compte Pôle emploi. J'accède au formulaire ici :"
          otherCaseNotice="Je suis dans une autre situation (candidat à une immersion sans identifiant Pôle emploi, entreprise ou conseiller emploi). J'accède au formulaire partagé ici :"
          showFormButtonLabel="Ouvrir le formulaire"
        />
      </div>
    );

  return (
    <ConventionForm
      properties={conventionInitialValuesFromUrl({
        route,
        internshipKind: "immersion",
      })}
      routeParams={route.params}
    />
  );
};

const useFederatedIdentity = (route: ConventionImmersionPageRoute) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (route.params.federatedIdentity)
      dispatch(
        authSlice.actions.federatedIdentityProvided(
          route.params.federatedIdentity as FederatedIdentity,
        ),
      );
  }, [route.params.federatedIdentity]);
};

const useFederatedIdentityOnReload = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(authSlice.actions.federatedIdentityInDeviceDeletionTriggered());
    const onWindowUnload = () => {
      dispatch(
        authSlice.actions.federatedIdentityFromStoreToDeviceStorageTriggered(),
      );
    };
    window.addEventListener("beforeunload", onWindowUnload);
    return () => window.removeEventListener("beforeunload", onWindowUnload);
  }, []);
};
