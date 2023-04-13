import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Route } from "type-route";
import {
  ConventionMagicLinkPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { Loader, MainWrapper } from "react-design-system";
import { ImmersionAssessmentForm } from "src/app/components/forms/immersion-assessment/ImmersionAssessmentForm";
import { ImmersionDescription } from "src/app/components/forms/immersion-assessment/ImmersionDescription";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConvention } from "src/app/hooks/convention.hooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { routes } from "src/app/routes/routes";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentPageProps {
  route: ImmersionAssessmentRoute;
}

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentPageProps) => {
  const { role, applicationId: conventionId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(
      route.params.jwt,
    );
  const { convention, fetchConventionError, isLoading } = useConvention({
    jwt: route.params.jwt,
    conventionId,
  });
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
          <Alert
            severity="error"
            title="Erreur"
            description="Vous n'êtes pas autorisé a accéder à cette page"
          />
        ) : (
          <>
            {convention && !canCreateAssessment && (
              <Alert
                severity="error"
                title="Votre convention n'est pas prête à recevoir un bilan"
                description="Seule une convention entièrement validée peut recevoir un bilan"
              />
            )}
            {convention && (
              <h1>
                {convention.internshipKind === "immersion"
                  ? "Bilan de l'immersion"
                  : "Bilan du mini-stage"}{" "}
                de {convention.signatories.beneficiary.firstName}
                {convention.signatories.beneficiary.lastName}
              </h1>
            )}
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
        {isLoading && <Loader />}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
