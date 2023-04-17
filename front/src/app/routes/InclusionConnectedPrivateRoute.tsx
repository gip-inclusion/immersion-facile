import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route } from "type-route";
import { inclusionConnectImmersionTargets } from "shared";
import {
  InclusionConnectButton,
  LoginForm,
  MainWrapper,
  PageHeader,
} from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";

export const InclusionConnectedPrivateRoute = ({
  route,
  children,
}: {
  route: Route<typeof routes.agencyDashboard>;
  children: React.ReactElement;
}) => {
  const dispatch = useDispatch();
  const isInclusionConnected = useAppSelector(
    authSelectors.isInclusionConnected,
  );

  const { token, email = "", firstName = "", lastName = "" } = route.params;

  useEffect(() => {
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
      routes.agencyDashboard().replace();
    }
  }, [token]);

  if (!isInclusionConnected)
    return (
      <HeaderFooterLayout>
        <MainWrapper
          layout="boxed"
          pageHeader={
            <PageHeader
              title="Retrouvez vos conventions en tant que prescripteur"
              theme="agency"
              centered
            />
          }
        >
          <LoginForm
            sections={[
              {
                title: "Se connecter avec Inclusion Connect",
                description:
                  "Inclusion Connect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne de l'inclusion.",
                authComponent: (
                  <InclusionConnectButton
                    inclusionConnectEndpoint={
                      inclusionConnectImmersionTargets
                        .startInclusionConnectLogin.url
                    }
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
