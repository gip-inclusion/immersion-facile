import { CircularProgress } from "@mui/material";
import React from "react";
import {
  MainWrapper,
  Notification,
  Title,
} from "react-design-system/immersionFacile";
import { ConventionMagicLinkPayload } from "shared";
import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { useConvention } from "src/app/hooks/convention.hooks";
import { Route } from "type-route";
import { ImmersionAssessmentForm } from "src/app/components/forms/immersion-assessment/ImmersionAssessmentForm";
import { ImmersionDescription } from "src/app/components/forms/immersion-assessment/ImmersionDescription";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentPageProps {
  route: ImmersionAssessmentRoute;
}

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentPageProps) => {
  const { role } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(
      route.params.jwt,
    );
  const { convention, fetchConventionError, isLoading } = useConvention(
    route.params.jwt,
  );
  const canCreateAssessment = convention?.status === "ACCEPTED_BY_VALIDATOR";
  const hasRight =
    role === "establishment" || role === "establishment-representative";

  if (fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={fetchConventionError}
        jwt={route.params.jwt}
      />
    );

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        {!hasRight ? (
          <Notification type="error" title="Erreur">
            Vous n'êtes pas autorisé a accéder à cette page
          </Notification>
        ) : (
          <>
            {convention && !canCreateAssessment && (
              <Notification
                type="error"
                title="Votre convention n'est pas prête à recevoir un bilan"
              >
                Seule une convention entièrement validée peut recevoir un bilan
              </Notification>
            )}
            <Title>
              Bilan de l'immersion
              {convention
                ? ` de ${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName}`
                : ""}
            </Title>
            {canCreateAssessment && (
              <>
                <ImmersionDescription convention={convention} />
                <ImmersionAssessmentForm
                  convention={convention}
                  jwt={route.params.jwt}
                />
              </>
            )}
          </>
        )}
        {isLoading && <CircularProgress />}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
