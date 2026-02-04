import { useEffect } from "react";
import { MainWrapper } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionId,
  type ConventionJwt,
  type ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ShowConventionErrorOrRenewExpiredJwt } from "src/app/pages/convention/ShowErrorOrRenewExpiredJwt";
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

const ConventionStatusDashboard = ({ jwt }: { jwt: ConventionJwt }) => {
  const { applicationId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(jwt);

  const conventionStatusDashboardFeedback = useFeedbackTopic(
    "convention-status-dashboard",
  );
  const { conventionStatusDashboardUrl, isLoading } =
    useConventionStatusDashboardUrl(jwt, applicationId);

  if (isLoading) return <p>Chargement en cours...</p>;

  if (conventionStatusDashboardFeedback?.level === "error")
    return (
      <ShowConventionErrorOrRenewExpiredJwt
        errorMessage={conventionStatusDashboardFeedback.message}
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

const useConventionStatusDashboardUrl = (
  jwt: ConventionJwt,
  conventionId: ConventionId,
) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      conventionSlice.actions.conventionStatusDashboardRequested({
        conventionId,
        jwt,
        feedbackTopic: "convention-status-dashboard",
      }),
    );
  }, [dispatch, jwt]);

  const conventionStatusDashboardUrl = useAppSelector(
    conventionSelectors.conventionStatusDashboardUrl,
  );
  const isLoading = useAppSelector(conventionSelectors.isLoading);

  return {
    conventionStatusDashboardUrl,
    isLoading,
  };
};
