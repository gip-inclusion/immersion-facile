import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useEffect } from "react";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionJwtPayload,
  type Role,
  decodeMagicLinkJwtWithoutSignatureCheck,
  hasAllowedRoleOnAssessment,
} from "shared";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { AssessmentForm } from "src/app/components/forms/assessment/AssessmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConvention } from "src/app/hooks/convention.hooks";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import type { routes } from "src/app/routes/routes";
import { assessmentSelectors } from "src/core-logic/domain/assessment/assessment.selectors";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import type { Route } from "type-route";

type AssessmentRoute = Route<typeof routes.assessment>;

interface AssessmentPageProps {
  route: AssessmentRoute;
}

export const AssessmentPage = ({ route }: AssessmentPageProps) => {
  const dispatch = useDispatch();
  const conventionFormFeedback = useFeedbackTopic("convention-form");
  const currentAssessment = useAppSelector(
    assessmentSelectors.currentAssessment,
  );
  const inclusionConnectedRoles = useAppSelector(
    inclusionConnectedSelectors.userRolesForFetchedConvention,
  );

  const isAssessmentLoading = useAppSelector(assessmentSelectors.isLoading);
  const fetchConventionError =
    conventionFormFeedback?.level === "error" &&
    conventionFormFeedback.on === "fetch";
  const { applicationId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
      route.params.jwt,
    );
  const conventionId = applicationId ?? route.params.conventionId;

  const { role: roleFromJwt } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
      route.params.jwt,
    );
  const roles: Role[] = roleFromJwt ? [roleFromJwt] : inclusionConnectedRoles;
  const { convention, isLoading: isConventionLoading } = useConvention({
    jwt: route.params.jwt,
    conventionId,
  });

  const isLoading = isConventionLoading || isAssessmentLoading;

  const isConventionValidated = convention?.status === "ACCEPTED_BY_VALIDATOR";

  if (fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={conventionFormFeedback?.message}
        jwt={route.params.jwt}
      />
    );

  useEffect(() => {
    if (convention) {
      dispatch(
        assessmentSlice.actions.getAssessmentRequested({
          conventionId: convention.id,
          jwt: route.params.jwt,
          feedbackTopic: "assessment",
        }),
      );
    }
  }, [dispatch, convention, route.params.jwt]);

  return (
    <HeaderFooterLayout>
      {isLoading && <Loader />}
      {!hasAllowedRoleOnAssessment(roles, "CreateAssessment") ? (
        <Alert
          severity="error"
          title="Erreur"
          description="Vous n'êtes pas autorisé à accéder à cette page"
        />
      ) : (
        <>
          {convention && (
            <MainWrapper
              layout="default"
              pageHeader={
                <PageHeader
                  breadcrumbs={<Breadcrumbs />}
                  className={fr.cx("fr-mb-0")}
                  title={
                    convention.internshipKind === "immersion"
                      ? `Bilan de l'immersion de ${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName}`
                      : `Bilan du mini-stage de ${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName}`
                  }
                />
              }
            >
              {convention && !isConventionValidated && (
                <Alert
                  severity="error"
                  title="Votre convention n'est pas prête à recevoir un bilan"
                  description="Seule une convention entièrement validée peut recevoir un bilan"
                />
              )}
              {currentAssessment && (
                <Alert
                  severity="error"
                  title="Erreur"
                  description="Le bilan a déjà été rempli et ne peut être modifié."
                />
              )}
              {convention && isConventionValidated && !currentAssessment && (
                <AssessmentForm
                  convention={convention}
                  jwt={route.params.jwt}
                  currentUserRoles={roles}
                />
              )}
            </MainWrapper>
          )}
        </>
      )}
    </HeaderFooterLayout>
  );
};
