import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import {
  ConventionJwtPayload,
  Role,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { AssessmentForm } from "src/app/components/forms/assessment/AssessmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConvention } from "src/app/hooks/convention.hooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

type AssessmentRoute = Route<typeof routes.assessment>;

interface AssessmentPageProps {
  route: AssessmentRoute;
}

export const AssessmentPage = ({ route }: AssessmentPageProps) => {
  const { role, applicationId: conventionId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
      route.params.jwt,
    );
  const { convention, fetchConventionError, isLoading } = useConvention({
    jwt: route.params.jwt,
    conventionId,
  });
  const canCreateAssessment = convention?.status === "ACCEPTED_BY_VALIDATOR";

  const hasRight =
    role === "establishment-tutor" ||
    // TODO : keep this temporary for old JWT support until 2023/10
    role === ("establishment" as Role);
  // ---------------------------

  if (fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={fetchConventionError}
        jwt={route.params.jwt}
      />
    );

  return (
    <HeaderFooterLayout>
      {isLoading && <Loader />}
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
          {convention && canCreateAssessment && (
            <MainWrapper
              layout="default"
              pageHeader={
                <PageHeader
                  title={
                    convention.internshipKind === "immersion"
                      ? `Bilan de l'immersion de ${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName}`
                      : `Bilan du mini-stage de ${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName}`
                  }
                />
              }
            >
              <AssessmentForm convention={convention} jwt={route.params.jwt} />
            </MainWrapper>
          )}
        </>
      )}
    </HeaderFooterLayout>
  );
};
