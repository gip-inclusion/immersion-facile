import React, { useEffect } from "react";
import {
  InclusionConnectButton,
  LoginForm,
  MainWrapper,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { inclusionConnectImmersionRoutes, queryParamsAsString } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { Route } from "type-route";

type InclusionConnectPrivateRoute =
  | Route<typeof routes.agencyDashboard>
  | Route<typeof routes.establishmentDashboard>;

type InclusionConnectedPrivateRouteProps = {
  route: InclusionConnectPrivateRoute;
  children: React.ReactElement;
  inclusionConnectConnexionPageHeader: React.ReactElement;
};

export const InclusionConnectedPrivateRoute = ({
  route,
  children,
  inclusionConnectConnexionPageHeader,
}: InclusionConnectedPrivateRouteProps) => {
  const dispatch = useDispatch();
  const isInclusionConnected = useAppSelector(
    authSelectors.isInclusionConnected,
  );

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
          layout="boxed"
          pageHeader={inclusionConnectConnexionPageHeader}
        >
          <LoginForm
            sections={[
              {
                title: "Se connecter avec Inclusion Connect",
                description:
                  "Inclusion Connect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne de l'inclusion.",
                authComponent: (
                  <InclusionConnectButton
                    inclusionConnectEndpoint={`${
                      inclusionConnectImmersionRoutes.startInclusionConnectLogin
                        .url
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
        </MainWrapper>
      </HeaderFooterLayout>
    );

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default">{children}</MainWrapper>
    </HeaderFooterLayout>
  );
};
