import React, { useEffect } from "react";
import { InclusionConnectButton, MainWrapper } from "react-design-system";
import { useDispatch } from "react-redux";
import { inclusionConnectImmersionTargets } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { Route } from "type-route";

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
        <MainWrapper layout="boxed">
          <InclusionConnectButton
            inclusionConnectEndpoint={
              inclusionConnectImmersionTargets.startInclusionConnectLogin.url
            }
            layout="2-lines"
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
