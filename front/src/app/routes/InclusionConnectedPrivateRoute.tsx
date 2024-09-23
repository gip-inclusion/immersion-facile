import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import React, { useEffect } from "react";
import {
  InclusionConnectButton,
  Loader,
  LoginForm,
  MainWrapper,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
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
  const isLoadingUser = useAppSelector(inclusionConnectedSelectors.isLoading);
  const isAdminConnected = useAppSelector(authSelectors.isAdminConnected);

  useEffect(() => {
    const { token, email = "", firstName = "", lastName = "" } = route.params;
    if (token) {
      dispatch(
        authSlice.actions.federatedIdentityProvided({
          provider: "inclusionConnect",
          token,
          email,
          lastName,
          firstName,
        }),
      );
      if (route.name === "agencyDashboard") routes.agencyDashboard().replace();
      if (route.name === "establishmentDashboard")
        routes.establishmentDashboard({ tab: "conventions" }).replace();
    }
  }, [route.params, route.name, dispatch]);

  if (!isInclusionConnected)
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
                    title: "Se connecter avec Inclusion Connect",
                    description:
                      "Inclusion Connect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne de l'inclusion.",
                    authComponent: (
                      <InclusionConnectButton
                        id={
                          domElementIds[route.name].login.inclusionConnectButton
                        }
                        inclusionConnectEndpoint={`${
                          inclusionConnectImmersionRoutes
                            .startInclusionConnectLogin.url
                        }?${queryParamsAsString(
                          inclusionConnectImmersionRoutes.startInclusionConnectLogin.queryParamsSchema.parse(
                            { page: route.name },
                          ),
                        )}`}
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
