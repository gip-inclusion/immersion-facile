import { MainWrapper, Notification } from "react-design-system";
import { useDispatch } from "react-redux";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { Route } from "type-route";
import React, { useEffect } from "react";

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
  }, []);

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
      <Notification
        title={"Impossible de récupérer l'état de la convention"}
        type="error"
      >
        {feedback.errorMessage}
      </Notification>
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
