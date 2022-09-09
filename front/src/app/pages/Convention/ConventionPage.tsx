import { CircularProgress } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { OmitFromExistingKeys } from "shared/src/utils";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { ConventionForm } from "src/app/pages/Convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/pages/Convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/pages/Convention/conventionHelpers";

import { routes } from "src/app/routing/routes";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { Route } from "type-route";

export type ConventionPageRoute = Route<typeof routes.convention>;

interface ConventionPageProps {
  route: ConventionPageRoute;
}

export type ConventionPresentation = OmitFromExistingKeys<
  Partial<ConventionDto>,
  "id" | "rejectionJustification"
> & {
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
};

export const ConventionPage = ({ route }: ConventionPageProps) => (
  <HeaderFooterLayout>
    <ConventionFormContainerLayout>
      <PageContent route={route} />
    </ConventionFormContainerLayout>
  </HeaderFooterLayout>
);

const PageContent = ({ route }: ConventionPageProps) => {
  const { enablePeConnectApi, areFeatureFlagsLoading } = useFeatureFlags();
  const connectedWith = useAppSelector(authSelectors.connectedWith);
  const dispatch = useDispatch();

  useEffect(() => {
    if (route.params.federatedIdentity)
      dispatch(
        authSlice.actions.federatedIdentityProvided(
          route.params.federatedIdentity as FederatedIdentity,
        ),
      );
  }, [route.params.federatedIdentity]);

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

  if (areFeatureFlagsLoading) return <CircularProgress />;

  if (route.params.jwt)
    return (
      <ConventionForm
        properties={conventionInitialValuesFromUrl(route)}
        routeParams={route.params}
      />
    );

  if (enablePeConnectApi && !connectedWith)
    return (
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <InitiateConventionCard
          title="Une demande de convention d'immersion a été partagée avec vous. "
          peConnectNotice="Je suis demandeur d’emploi et je connais mes identifiants à mon compte Pôle emploi, j'accède au formulaire partagé avec mes identifiants Pôle emploi. J'accède au formulaire ici :"
          otherCaseNotice="Je suis dans une autre situation (candidat à une immersion sans identifiant Pôle emploi, entreprise ou conseiller emploi). J'accède au formulaire partagé ici :"
          showFormButtonLabel="Ouvrir le formulaire"
        />
      </div>
    );

  return (
    <ConventionForm
      properties={conventionInitialValuesFromUrl(route)}
      routeParams={route.params}
    />
  );
};
