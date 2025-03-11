import React, { useEffect } from "react";
import { MainWrapper } from "react-design-system";
import { useDispatch } from "react-redux";
import { MetabaseView } from "src/app/components/MetabaseView";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import type { routes } from "src/app/routes/routes";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import type { Route } from "type-route";

export const ConventionStatusDashboardPage = ({
  route,
}: {
  route: Route<typeof routes.conventionStatusDashboard>;
}) => (
  <HeaderFooterLayout>
    <MainWrapper layout="default">
      {route.params.jwt ? (
        <ConventionStatusDashboard jwt={route.params.jwt} />
      ) : (
        <p>Lien non valide</p>
      )}
    </MainWrapper>
  </HeaderFooterLayout>
);

const useConventionStatusDashboardUrl = (jwt: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.conventionStatusDashboardRequested(jwt));
  }, [dispatch, jwt]);

  const conventionStatusDashboardUrl = useAppSelector(
    conventionSelectors.conventionStatusDashboardUrl,
  );
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const feedback = useAppSelector(conventionSelectors.feedback);

  return {
    conventionStatusDashboardUrl,
    isLoading,
    feedback,
  };
};

const ConventionStatusDashboard = ({ jwt }: { jwt: string }) => {
  const { conventionStatusDashboardUrl, isLoading, feedback } =
    useConventionStatusDashboardUrl(jwt);

  if (isLoading) return <p>Chargement en cours...</p>;

  if (feedback.kind === "errored")
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={feedback.errorMessage}
        jwt={jwt}
      />
    );

  if (!conventionStatusDashboardUrl)
    return <p>Pas de convention correspondante trouvée...</p>;

  return (
    <MetabaseView
      title="Etat de votre convention"
      url={conventionStatusDashboardUrl}
    />
  );
};
