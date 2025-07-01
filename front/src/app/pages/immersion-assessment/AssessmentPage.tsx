import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import { useEffect } from "react";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  getFormattedFirstnameAndLastname,
  hasAllowedRoleOnAssessment,
  type Role,
} from "shared";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { FullPageFeedback } from "src/app/components/feedback/FullpageFeedback";
import { AssessmentForm } from "src/app/components/forms/assessment/AssessmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConvention } from "src/app/hooks/convention.hooks";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { routes } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
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
  const assessmentFormFeedback = useFeedbackTopic("assessment");

  const isLoading = isConventionLoading || isAssessmentLoading;

  const isConventionValidated = convention?.status === "ACCEPTED_BY_VALIDATOR";

  const isAssessmentSuccessfullySubmitted =
    assessmentFormFeedback?.level === "success" &&
    assessmentFormFeedback?.on === "create";

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

  if (fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={conventionFormFeedback?.message}
        jwt={route.params.jwt}
      />
    );

  if (isAssessmentSuccessfullySubmitted)
    return (
      <FullPageFeedback
        title="Merci d'avoir rempli le bilan !"
        illustration={commonIllustrations.success}
        content={
          <>
            <p id={domElementIds.assessment.successMessage}>
              Nous vous remercions d'avoir utilisé Immersion Facilitée pour
              accompagner {convention?.signatories.beneficiary.firstName}{" "}
              {convention?.signatories.beneficiary.lastName} dans son immersion.
              Votre implication contribue à améliorer notre site et à enrichir
              le dossier du candidat.
            </p>
            {roles.includes("establishment-tutor") ? (
              <Highlight>
                <p>
                  <strong>Que faire ensuite ?</strong> Maintenez à jour votre
                  fiche entreprise afin de continuer à recevoir des immersions.
                </p>
              </Highlight>
            ) : null}
          </>
        }
        buttonProps={{
          ...(roles.includes("establishment-tutor")
            ? {
                children: "Accéder à ma fiche entreprise",
                onClick: () => {
                  routes.establishmentDashboard().push();
                },
              }
            : {
                children: "Accéder à mon espace prescripteur",
                onClick: () => {
                  routes.agencyDashboard().push();
                },
              }),
        }}
      />
    );

  return (
    <HeaderFooterLayout>
      {isLoading && <Loader />}
      {convention &&
      !hasAllowedRoleOnAssessment(roles, "CreateAssessment", convention) ? (
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
                  title={`Bilan ${convention.internshipKind === "immersion" ? "de l'immersion" : "du mini-stage"} de ${getFormattedFirstnameAndLastname(
                    {
                      firstname: convention.signatories.beneficiary.firstName,
                      lastname: convention.signatories.beneficiary.lastName,
                    },
                  )}`}
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
