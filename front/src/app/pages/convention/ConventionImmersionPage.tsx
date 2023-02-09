import { fr } from "@codegouvfr/react-dsfr";
import React, { useEffect, useState } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { FederatedIdentityProvider, isPeConnectIdentity } from "shared";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
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
    <ConventionFormContainerLayout>
      <PageContent route={route} />
    </ConventionFormContainerLayout>
  </HeaderFooterLayout>
);

const PageContent = ({ route }: ConventionImmersionPageProps) => {
  const { enablePeConnectApi, isLoading } = useFeatureFlags();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const [shouldShowForm, setShouldShowForm] = useState(false);
  const isSharedConvention = Object.keys(route.params).length > 0;

  useFederatedIdentityFromUrl(route);

  useEffect(() => {
    setShouldShowForm(
      enablePeConnectApi &&
        !!federatedIdentity &&
        isPeConnectIdentity(federatedIdentity),
    );
  }, [enablePeConnectApi, federatedIdentity]);

  if (isLoading) return <Loader />;

  if ("jwt" in route.params)
    return (
      <ConventionForm
        properties={conventionInitialValuesFromUrl({
          route,
          internshipKind: "immersion",
        })}
        routeParams={route.params}
      />
    );

  return shouldShowForm ? (
    <ConventionForm
      properties={conventionInitialValuesFromUrl({
        route,
        internshipKind: "immersion",
      })}
      routeParams={route.params}
    />
  ) : (
    <div
      className={fr.cx(
        "fr-grid-row",
        "fr-grid-row--center",
        "fr-grid-row--gutters",
      )}
    >
      <InitiateConventionCard
        title={
          isSharedConvention
            ? "Une demande de convention d'immersion a été partagée avec vous."
            : "Activer une demande de convention"
        }
        peConnectNotice="Je suis demandeur d’emploi et je connais mes identifiants à mon compte Pôle emploi. J'accède au formulaire ici :"
        otherCaseNotice="Je suis dans une autre situation (candidat à une immersion sans identifiant Pôle emploi, entreprise ou conseiller emploi). J'accède au formulaire partagé ici :"
        showFormButtonLabel="Ouvrir le formulaire"
        onNotPeConnectButtonClick={() => setShouldShowForm(true)}
      />
    </div>
  );
};

const useFederatedIdentityFromUrl = (route: ConventionImmersionPageRoute) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (route.params.fedId && route.params.fedIdProvider) {
      dispatch(
        authSlice.actions.federatedIdentityProvided({
          provider: route.params.fedIdProvider as FederatedIdentityProvider,
          token: route.params.fedId,
        }),
      );
    }
  }, [route.params.fedId, route.params.fedIdProvider]);
};
