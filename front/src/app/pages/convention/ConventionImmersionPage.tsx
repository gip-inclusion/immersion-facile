import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { FederatedIdentity } from "shared";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { routes } from "src/app/routes/routes";
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
    <ConventionFormContainerLayout
      title={useConventionTexts("immersion").intro.conventionTitle}
    >
      <PageContent route={route} />
    </ConventionFormContainerLayout>
  </HeaderFooterLayout>
);

const PageContent = ({ route }: ConventionImmersionPageProps) => {
  const { enablePeConnectApi, isLoading } = useFeatureFlags();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);

  const isNotPeConnected = enablePeConnectApi && !federatedIdentity;
  const isSharedConvention = Object.keys(route.params).length > 0;

  useFederatedIdentity(route);
  useFederatedIdentityOnReload();

  if (isLoading) return <Loader />;

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

  return isNotPeConnected ? (
    <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
      <InitiateConventionCard
        title={
          isSharedConvention
            ? "Une demande de convention d'immersion a été partagée avec vous."
            : "Activer une demande de convention"
        }
        peConnectNotice="Je suis demandeur d’emploi et je connais mes identifiants à mon compte Pôle emploi. J'accède au formulaire ici :"
        otherCaseNotice="Je suis dans une autre situation (candidat à une immersion sans identifiant Pôle emploi, entreprise ou conseiller emploi). J'accède au formulaire partagé ici :"
        showFormButtonLabel="Ouvrir le formulaire"
      />
    </div>
  ) : (
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
