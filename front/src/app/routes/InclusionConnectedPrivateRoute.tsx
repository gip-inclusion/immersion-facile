import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import type React from "react";
import { useEffect } from "react";
import {
  Loader,
  LoginForm,
  MainWrapper,
  OAuthButton,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type AllowedStartOAuthLoginPage,
  absoluteUrlSchema,
  domElementIds,
  inclusionConnectImmersionRoutes,
  queryParamsAsString,
} from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FrontAdminRouteTab } from "src/app/pages/admin/AdminTabs";
import { routes } from "src/app/routes/routes";
import { loginIllustration } from "src/assets/img/illustrations";
import { outOfReduxDependencies } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import type { Route } from "type-route";

export type FrontAdminRoute =
  | FrontAdminRouteTab
  | Route<typeof routes.adminUserDetail>
  | Route<typeof routes.adminConventionDetail>
  | Route<typeof routes.adminAgencyDetail>;

export const agencyDashboardTabsList = [
  "agencyDashboardMain",
  "agencyDashboardSynchronisedConventions",
  "agencyDashboardAgencies",
] satisfies AgencyDashboardRouteName[];

export type AgencyTabRoute = (typeof agencyDashboardTabsList)[number];

export const agencyDashboardRoutes = [
  "agencyDashboardMain",
  "agencyDashboardSynchronisedConventions",
  "agencyDashboardAgencies",
  "agencyDashboardAgencyDetails",
  "agencyDashboardOnboarding",
] satisfies AgencyDashboardRouteName[];

export type AgencyDashboardRouteName = FrontAgencyDashboardRoute["name"];

export type FrontAgencyDashboardRoute =
  | Route<typeof routes.agencyDashboardMain>
  | Route<typeof routes.agencyDashboardOnboarding>
  | Route<typeof routes.agencyDashboardSynchronisedConventions>
  | Route<typeof routes.agencyDashboardAgencies>
  | Route<typeof routes.agencyDashboardAgencyDetails>;

type InclusionConnectPrivateRoute =
  | FrontAdminRoute
  | FrontAgencyDashboardRoute
  | Route<typeof routes.establishmentDashboard>
  | Route<typeof routes.myProfile>;

type InclusionConnectedPrivateRouteProps = {
  route: InclusionConnectPrivateRoute;
  children: React.ReactElement;
  inclusionConnectConnexionPageHeader: React.ReactElement;
  allowAdminOnly?: boolean;
};

const proConnectProvider = {
  name: "ProConnect",
  buttonProvider: "pro-connect" as const,
  baseline:
    "ProConnect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne pour les professionnels.",
};

const getPage = (
  route: InclusionConnectPrivateRoute,
): AllowedStartOAuthLoginPage => {
  if (route.name === "establishmentDashboard") return "establishmentDashboard";
  if (route.name === "agencyDashboardMain") return "agencyDashboard";
  return "admin";
};

export const InclusionConnectedPrivateRoute = ({
  route,
  children,
  allowAdminOnly,
  inclusionConnectConnexionPageHeader,
}: InclusionConnectedPrivateRouteProps) => {
  const dispatch = useDispatch();
  const isInclusionConnected = useAppSelector(
    authSelectors.isInclusionConnected,
  );
  const authIsLoading = useAppSelector(authSelectors.isLoading);
  const isLoadingUser = useAppSelector(inclusionConnectedSelectors.isLoading);
  const isAdminConnected = useAppSelector(authSelectors.isAdminConnected);

  const afterLoginRedirectionUrl = useAppSelector(
    authSelectors.afterLoginRedirectionUrl,
  );

  useEffect(() => {
    const {
      token,
      email = "",
      firstName = "",
      lastName = "",
      idToken = "",
      siret = "",
    } = route.params;

    if (token) {
      dispatch(
        authSlice.actions.federatedIdentityProvided({
          federatedIdentityWithUser: {
            provider: "connectedUser",
            token,
            email,
            lastName,
            firstName,
            idToken,
          },
          feedbackTopic: "auth-global",
        }),
      );
      outOfReduxDependencies.localDeviceRepository.set(
        "connectedUserSiret",
        siret,
      );
      const { token: _, ...routeParams } = route.params;
      routes[route.name](routeParams as any).replace();
    }
  }, [route.params, dispatch, afterLoginRedirectionUrl]);

  useEffect(() => {
    if (!authIsLoading && !isInclusionConnected) {
      const windowUrl = absoluteUrlSchema.parse(window.location.href);
      dispatch(
        authSlice.actions.saveRedirectionAfterLoginRequested({
          url: windowUrl,
        }),
      );
    }
    if (!authIsLoading && isInclusionConnected && afterLoginRedirectionUrl)
      dispatch(authSlice.actions.redirectAndClearUrlAfterLoginRequested());
  }, [authIsLoading, isInclusionConnected, afterLoginRedirectionUrl, dispatch]);

  const page = getPage(route);

  if (!isInclusionConnected) {
    return (
      <HeaderFooterLayout>
        <MainWrapper
          layout="default"
          pageHeader={inclusionConnectConnexionPageHeader}
          vSpacing={6}
        >
          <div className={fr.cx("fr-grid-row")}>
            <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
              <LoginForm
                sections={[
                  {
                    title: `Se connecter avec ${proConnectProvider.name}`,
                    description: proConnectProvider.baseline,
                    authComponent: (
                      <OAuthButton
                        id={domElementIds[page].login.inclusionConnectButton}
                        authenticationEndpoint={`${
                          inclusionConnectImmersionRoutes
                            .startInclusionConnectLogin.url
                        }?${queryParamsAsString(
                          inclusionConnectImmersionRoutes.startInclusionConnectLogin.queryParamsSchema.parse(
                            { page },
                          ),
                        )}`}
                        provider={proConnectProvider.buttonProvider}
                      />
                    ),
                  },
                ]}
              />
            </div>
            <div
              className={fr.cx(
                "fr-col-12",
                "fr-col-lg-6",
                "fr-hidden",
                "fr-unhidden-lg",
                "fr-px-12w",
                "fr-py-4w",
              )}
            >
              <img src={loginIllustration} width={400} height={260} alt="" />
            </div>
          </div>
        </MainWrapper>
      </HeaderFooterLayout>
    );
  }

  if (isLoadingUser) return <Loader />;

  if (allowAdminOnly && !isAdminConnected)
    return (
      <HeaderFooterLayout>
        <MainWrapper layout="default">
          <Alert
            severity="error"
            title={"Accès refusé"}
            description={
              "Vous n'avez pas les droits nécessaires pour accéder à cette page."
            }
          />
        </MainWrapper>
      </HeaderFooterLayout>
    );
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default">{children}</MainWrapper>
    </HeaderFooterLayout>
  );
};
