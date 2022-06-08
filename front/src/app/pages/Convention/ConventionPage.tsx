import { CircularProgress } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { ConventionForm } from "src/app/pages/Convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/pages/Convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/pages/Convention/conventionHelpers";

import { routes } from "src/app/routing/routes";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { Route } from "type-route";

export type ConventionPageRoute = Route<typeof routes.convention>;

interface ConventionPageProps {
  route: ConventionPageRoute;
}

export type ConventionPresentation = Exclude<
  Partial<ConventionDto>,
  "id" | "rejectionJustification" | "legacySchedule"
> & {
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
};

export const ConventionPage = ({ route }: ConventionPageProps) => (
    <HeaderFooterLayout>
      <ConventionFormContainerLayout>
        <PageContent route={route} />
      </ConventionFormContainerLayout>
    </HeaderFooterLayout>
  );

const PageContent = ({ route }: ConventionPageProps) => {
  const { enablePeConnectApi, areFeatureFlagsLoading } = useFeatureFlags();
  const connectedWith = useAppSelector(authSelectors.connectedWith);
  const dispatch = useDispatch();

  useEffect(() => {
    if (route.params.federatedIdentity)
      dispatch(
        authSlice.actions.federatedIdentityProvided(
          route.params.federatedIdentity as FederatedIdentity,
        ),
      );
  }, [route.params.federatedIdentity]);

  if (areFeatureFlagsLoading) return <CircularProgress />;

  if (enablePeConnectApi && !connectedWith)
    return (
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w">
          <InitiateConventionCard />
        </div>
      </div>
    );

  return (
    <ConventionForm
      properties={conventionInitialValuesFromUrl(route)}
      routeParams={route.params}
    />
  );
};
