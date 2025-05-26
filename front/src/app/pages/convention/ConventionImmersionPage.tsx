import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { keys } from "ramda";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { useDispatch } from "react-redux";
import { loginFtConnect } from "shared";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import {
  type ConventionFormMode,
  ConventionFormWrapper,
} from "src/app/components/forms/convention/ConventionFormWrapper";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { routes } from "src/app/routes/routes";
import illustrationShareConvention from "src/assets/img/share-convention.svg";
import { outOfReduxDependencies } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { match } from "ts-pattern";
import type { Route } from "type-route";

export type ConventionImmersionPageRoute = Route<
  typeof routes.conventionImmersion
>;

interface ConventionImmersionPageProps {
  route: ConventionImmersionPageRoute;
}

const storeConventionRouteParamsOnDevice = (
  routeParams: ConventionImmersionPageRoute["params"],
) => {
  const {
    fedId: _1,
    fedIdProvider: _2,
    jwt: _3,
    ...partialConvention
  } = routeParams;
  if (keys(partialConvention).length) {
    outOfReduxDependencies.localDeviceRepository.set(
      "partialConventionInUrl",
      partialConvention,
    );
  }
};

export const ConventionImmersionPage = ({
  route,
}: ConventionImmersionPageProps) => {
  const {
    jwt,
    mtm_campaign: _,
    mtm_kwd: __,
    skipIntro,
    ...routeParamsWithoutJwtAndTrackers
  } = route.params;

  const t = useConventionTexts("immersion");
  const showSummary = useAppSelector(conventionSelectors.showSummary);
  const isPeConnected = useAppSelector(authSelectors.isPeConnected);

  useFederatedIdentityFromUrl(route);

  const isSharedConvention = useMemo(
    () =>
      keys(routeParamsWithoutJwtAndTrackers).length > 0 &&
      !isPeConnected &&
      !skipIntro,
    [routeParamsWithoutJwtAndTrackers, isPeConnected, skipIntro],
  );

  const [displaySharedConventionMessage, setDisplaySharedConventionMessage] =
    useState(isSharedConvention);

  const getPageHeaderTitle = (
    jwt: string | undefined,
    showSummary: boolean,
  ) => {
    const createOrEditTitle = jwt
      ? t.intro.conventionEditTitle
      : t.intro.conventionTitle;
    return showSummary ? t.intro.conventionSummaryTitle : createOrEditTitle;
  };

  useEffect(() => {
    if (isPeConnected) setDisplaySharedConventionMessage(false);
  }, [isPeConnected]);

  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout={"default"}
        vSpacing={3}
        pageHeader={
          !displaySharedConventionMessage && (
            <PageHeader
              title={getPageHeaderTitle(jwt, showSummary)}
              breadcrumbs={<Breadcrumbs />}
            />
          )
        }
      >
        {displaySharedConventionMessage ? (
          <SharedConventionMessage
            route={route}
            onClickContinue={() => setDisplaySharedConventionMessage(false)}
          />
        ) : (
          <PageContent route={route} />
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const PageContent = ({ route }: ConventionImmersionPageProps) => {
  const { isLoading } = useFeatureFlags();
  const initialRouteParams = useRef(route.params).current;
  const {
    jwt: _,
    mtm_campaign: __,
    mtm_kwd: ____,
    ...routeParamsWithoutJwtAndTrackers
  } = initialRouteParams;
  const isSharedConvention = useMemo(
    () => keys(routeParamsWithoutJwtAndTrackers).length > 0,
    [routeParamsWithoutJwtAndTrackers],
  );

  const getMode = (): ConventionFormMode => {
    if ("jwt" in initialRouteParams) return "edit";
    if (isSharedConvention) return "create-from-shared";
    return "create-from-scratch";
  };

  const mode = getMode();

  return match({
    isLoading,
    mode,
  })
    .with({ isLoading: true }, () => <Loader />)
    .with({ isLoading: false }, () => (
      <ConventionFormWrapper internshipKind="immersion" mode={mode} />
    ))
    .exhaustive();
};

const useFederatedIdentityFromUrl = (route: ConventionImmersionPageRoute) => {
  const dispatch = useDispatch();
  const initialRouteParams = useRef(route.params).current;

  useEffect(() => {
    if (
      initialRouteParams.fedId &&
      initialRouteParams.fedIdProvider &&
      initialRouteParams.email &&
      initialRouteParams.firstName &&
      initialRouteParams.lastName
    ) {
      const {
        fedId: _,
        fedIdProvider: __,
        ...paramsWithoutFederatedIdentity
      } = initialRouteParams;
      if (initialRouteParams.fedIdProvider === "peConnect")
        dispatch(
          authSlice.actions.federatedIdentityProvided({
            federatedIdentityWithUser: {
              provider: initialRouteParams.fedIdProvider,
              token: initialRouteParams.fedId,
              email: initialRouteParams.email,
              firstName: initialRouteParams.firstName,
              lastName: initialRouteParams.lastName,
            },
            feedbackTopic: "auth-global",
          }),
        );
      routes
        .conventionImmersion({
          ...paramsWithoutFederatedIdentity,
          fromPeConnectedUser: true,
        })
        .replace();
    }
  }, [initialRouteParams, dispatch]);
};

const SharedConventionMessage = ({
  onClickContinue,
  route,
}: {
  onClickContinue: () => void;
  route: ConventionImmersionPageRoute;
}) => (
  <div className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
    <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
      <h1>
        Quelqu'un a partagé une demande de convention d'immersion avec vous
      </h1>
      <p>
        Une entreprise ou un candidat a rempli ses informations dans le
        formulaire de demande de convention. Vous n'avez plus qu'à remplir vos
        informations et à valider le formulaire en quelques clics.
      </p>
      <Button
        onClick={() => onClickContinue()}
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
      >
        Continuer
      </Button>

      <p className={fr.cx("fr-mt-4w", "fr-mb-0")}>
        {/* biome-ignore lint/a11y/useValidAnchor: This is a trusted source */}
        <a
          href={`/api/${loginFtConnect}`}
          onClick={() => {
            storeConventionRouteParamsOnDevice(route.params);
          }}
          className={fr.cx(
            "fr-link",
            "fr-icon-arrow-right-line",
            "fr-link--icon-right",
          )}
        >
          Ou continuer avec mes identifiants France Travail (candidats inscrits
          à France Travail)
        </a>
      </p>
    </div>
    <div
      className={fr.cx(
        "fr-col-12",
        "fr-col-md-4",
        "fr-hidden",
        "fr-unhidden-md",
        "fr-mb-6w",
      )}
    >
      <img src={illustrationShareConvention} alt="" />
    </div>
  </div>
);
