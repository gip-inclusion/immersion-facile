import React, { useEffect, useState } from "react";
import { InclusionConnectButton, MainWrapper } from "react-design-system";
import { inclusionConnectImmersionTargets } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

export const InclusionConnectedPrivateRoute = ({
  route,
  children,
}: {
  route: Route<typeof routes.agencyDashboard>;
  children: React.ReactElement;
}) => {
  const [isInclusionConnected, setIsInclusionConnected] = useState(false);

  useEffect(() => {
    if (route.params.token) setIsInclusionConnected(true);
    // TODO : use redux instead
  }, [route.params.token]);

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
      <MainWrapper layout="boxed">{children}</MainWrapper>
    </HeaderFooterLayout>
  );
};
