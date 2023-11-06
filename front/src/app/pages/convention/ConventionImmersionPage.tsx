import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { keys } from "ramda";
import { match } from "ts-pattern";
import { Route } from "type-route";
import {
  FederatedIdentityProvider,
  isPeConnectIdentity,
  loginPeConnect,
} from "shared";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import {
  ConventionForm,
  ConventionFormMode,
} from "src/app/components/forms/convention/ConventionForm";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { routes, useRoute } from "src/app/routes/routes";
import { deviceRepository } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

export type ConventionImmersionPageRoute = Route<
  typeof routes.conventionImmersion
>;

interface ConventionImmersionPageProps {
  route: ConventionImmersionPageRoute;
}

const storeConventionRouteParamsOnDevice = (
  routeParams: ConventionImmersionPageRoute["params"],
) => {
  const { fedId, fedIdProvider, jwt, ...partialConvention } = routeParams;
  if (keys(partialConvention).length) {
    deviceRepository.set("partialConventionInUrl", partialConvention);
  }
};

export const ConventionImmersionPage = ({
  route,
}: ConventionImmersionPageProps) => {
  const currentRoute = useRoute();
  const t = useConventionTexts("immersion");
  const showSummary = useAppSelector(conventionSelectors.showSummary);
  const isSharedConvention = useMemo(
    () => Object.keys(route.params).length > 0,
    [route.params],
  );
  const [displaySharedConventionMessage, setDisplaySharedConventionMessage] =
    useState(isSharedConvention);
  const { enablePeConnectApi } = useFeatureFlags();

  useEffect(() => {
    if (enablePeConnectApi && currentRoute.name === "conventionImmersion") {
      storeConventionRouteParamsOnDevice(currentRoute.params);
    }
  }, []);

  return (
    <HeaderFooterLayout>
      {displaySharedConventionMessage && (
        <MainWrapper layout={"default"}>
          <div className={fr.cx("fr-grid-row")}>
            <div className={fr.cx("fr-col-8")}>
              <h1>
                Quelqu'un a partagé une demande de convention d'immersion avec
                vous
              </h1>
              <p>
                Une entreprise ou un candidat a rempli ses informations dans le
                formulaire de demande de convention. Vous n'avez plus qu'à
                remplir vos informations et à valider le formulaire en quelques
                clics.
              </p>
              <Button
                onClick={() => setDisplaySharedConventionMessage(false)}
                iconId="fr-icon-arrow-right-line"
                iconPosition="right"
              >
                Continuer
              </Button>
              {enablePeConnectApi && (
                <p className={fr.cx("fr-mt-2w")}>
                  <a
                    href={`/api/${loginPeConnect}`}
                    className={fr.cx(
                      "fr-link",
                      "fr-icon-arrow-right-line",
                      "fr-link--icon-right",
                    )}
                  >
                    Ou continuer avec mes identifiants Pôle emploi (candidats
                    inscrits à Pôle emploi)
                  </a>
                </p>
              )}
            </div>
            <div className={fr.cx("fr-col-4")}>
              <img src="/src/assets/img/share-convention.png" alt="" />
            </div>
          </div>
        </MainWrapper>
      )}
      {!displaySharedConventionMessage && (
        <MainWrapper
          layout={"default"}
          pageHeader={
            <PageHeader
              title={
                showSummary
                  ? t.intro.conventionSummaryTitle
                  : t.intro.conventionTitle
              }
              theme="default"
            />
          }
        >
          <PageContent route={route} />
        </MainWrapper>
      )}
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
    [route.params],
  );
  const mode: ConventionFormMode = "jwt" in route.params ? "edit" : "create";
  useFederatedIdentityFromUrl(route);
  useScrollToTop(shouldShowForm);
  useEffect(() => {
    setShouldShowForm(
      isSharedConvention ||
        (enablePeConnectApi.isActive &&
          !!federatedIdentity &&
          isPeConnectIdentity(federatedIdentity)),
    );
  }, [enablePeConnectApi.isActive, federatedIdentity]);

  return match({
    isLoading,
    mode,
    shouldShowForm,
  })
    .with({ isLoading: true }, () => <Loader />)
    .with({ mode: "create", shouldShowForm: false }, () => (
      <InitiateConventionCard
        onNotPeConnectButtonClick={() => setShouldShowForm(true)}
      />
    ))
    .with({ mode: "edit", shouldShowForm: false }, () => (
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
  }, [fedId, fedIdProvider, email, firstName, lastName, dispatch]);
};
