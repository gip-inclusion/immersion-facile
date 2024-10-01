import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import React, { useEffect } from "react";
import {
  Loader,
  LoginForm,
  MainWrapper,
  OAuthButton,
  OAuthButtonProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  OAuthGatewayProvider,
  absoluteUrlSchema,
  domElementIds,
  inclusionConnectImmersionRoutes,
  queryParamsAsString,
} from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { loginIllustration } from "src/assets/img/illustrations";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { Route } from "type-route";

type InclusionConnectPrivateRoute =
  | Route<typeof routes.agencyDashboard>
  | Route<typeof routes.establishmentDashboard>
  | Route<typeof routes.admin>;

type InclusionConnectedPrivateRouteProps = {
  route: InclusionConnectPrivateRoute;
  children: React.ReactElement;
  inclusionConnectConnexionPageHeader: React.ReactElement;
  allowAdminOnly?: boolean;
};

const providers: Record<
  OAuthGatewayProvider,
  {
    name: string;
    baseline: string;
    buttonProvider: OAuthButtonProps["provider"];
  }
> = {
  InclusionConnect: {
    name: "Inclusion Connect",
    buttonProvider: "inclusion-connect",
    baseline:
      "Inclusion Connect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne de l'inclusion.",
  },
  ProConnect: {
    name: "ProConnect",
    buttonProvider: "pro-connect",
    baseline:
      "ProConnect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne pour les professionnels.",
  },
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
  const { enableProConnect } = useAppSelector(
    featureFlagSelectors.featureFlagState,
  );

  const provider = enableProConnect.isActive
    ? providers.ProConnect
    : providers.InclusionConnect;
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
    } = route.params;
    if (token) {
      dispatch(
        authSlice.actions.federatedIdentityProvided({
          provider: "inclusionConnect",
          token,
          email,
          lastName,
          firstName,
          idToken,
        }),
      );
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
                    title: `Se connecter avec ${provider.name}`,
                    description: provider.baseline,
                    authComponent: (
                      <OAuthButton
                        id={
                          domElementIds[route.name].login.inclusionConnectButton
                        }
                        authenticationEndpoint={`${
                          inclusionConnectImmersionRoutes
                            .startInclusionConnectLogin.url
                        }?${queryParamsAsString(
                          inclusionConnectImmersionRoutes.startInclusionConnectLogin.queryParamsSchema.parse(
                            { page: route.name },
                          ),
                        )}`}
                        provider={provider.buttonProvider}
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
