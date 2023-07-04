import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { match } from "ts-pattern";
import { Route } from "type-route";
import { FederatedIdentityProvider, isPeConnectIdentity } from "shared";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

export type ConventionImmersionPageRoute = Route<
  typeof routes.conventionImmersion
>;

interface ConventionImmersionPageProps {
  route: ConventionImmersionPageRoute;
}

export const ConventionImmersionPage = ({
  route,
}: ConventionImmersionPageProps) => {
  const t = useConventionTexts("immersion");
  const showSummary = useAppSelector(conventionSelectors.showSummary);
  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout={"default"}
        pageHeader={
          <PageHeader
            title={
              showSummary
                ? t.intro.conventionSummaryTitle
                : t.intro.conventionTitle
            }
            theme="candidate"
          />
        }
      >
        <PageContent route={route} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const PageContent = ({ route }: ConventionImmersionPageProps) => {
  const { enablePeConnectApi, isLoading } = useFeatureFlags();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const [shouldShowForm, setShouldShowForm] = useState(false);
  const isSharedConvention = useMemo(
    // depends on initial (on page load) route params, shouldn't change on re-render
    () => Object.keys(route.params).length > 0,
    [],
  );
  const mode = "jwt" in route.params ? "edit" : "create";
  useFederatedIdentityFromUrl(route);
  useScrollToTop(shouldShowForm);
  useEffect(() => {
    setShouldShowForm(
      enablePeConnectApi &&
        !!federatedIdentity &&
        isPeConnectIdentity(federatedIdentity),
    );
  }, [enablePeConnectApi, federatedIdentity]);

  return match({
    isLoading,
    mode,
    shouldShowForm,
  })
    .with({ isLoading: true }, () => <Loader />)
    .with({ shouldShowForm: false }, () => (
      <InitiateConventionCard
        title={
          isSharedConvention
            ? "Une demande de convention d'immersion a été partagée avec vous."
            : "Remplir la demande de convention"
        }
        peConnectNotice="Je suis demandeur d’emploi et je connais mes identifiants à mon compte Pôle emploi. J'accède au formulaire ici :"
        otherCaseNotice="Je suis dans une autre situation (candidat à une immersion sans identifiant Pôle emploi, entreprise ou conseiller emploi). J'accède au formulaire partagé ici :"
        showFormButtonLabel="Ouvrir le formulaire"
        onNotPeConnectButtonClick={() => setShouldShowForm(true)}
      />
    ))
    .with({ mode: "edit" }, () => (
      <ConventionForm internshipKind="immersion" mode={mode} />
    ))
    .with({ shouldShowForm: true }, () => (
      <ConventionForm
        internshipKind="immersion"
        mode={isSharedConvention ? "edit" : mode}
      />
    ))
    .exhaustive();
};

const useFederatedIdentityFromUrl = (route: ConventionImmersionPageRoute) => {
  const dispatch = useDispatch();

  const {
    fedId,
    fedIdProvider,
    email = "",
    firstName = "",
    lastName = "",
  } = route.params;

  useEffect(() => {
    if (fedId && fedIdProvider) {
      dispatch(
        authSlice.actions.federatedIdentityProvided({
          provider: fedIdProvider as FederatedIdentityProvider,
          token: fedId,
          email,
          firstName,
          lastName,
        }),
      );
    }
  }, [fedId, fedIdProvider, email, firstName, lastName]);
};
