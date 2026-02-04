import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
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
import { ShowConventionErrorOrRenewExpiredJwt } from "src/app/pages/convention/ShowErrorOrRenewExpiredJwt";
import { routes } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import type { Route } from "type-route";

type AssessmentRoute = Route<typeof routes.assessment>;

interface AssessmentPageProps {
  route: AssessmentRoute;
}

export const AssessmentPage = ({ route }: AssessmentPageProps) => {
  const conventionFormFeedback = useFeedbackTopic("convention-form");
  const userRolesForFetchedConvention = useAppSelector(
    connectedUserSelectors.userRolesForFetchedConvention,
  );

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
  const roles: Role[] = roleFromJwt
    ? [roleFromJwt]
    : userRolesForFetchedConvention;
  const { convention, isLoading: isConventionLoading } = useConvention({
    jwt: route.params.jwt,
    conventionId,
  });
  const assessmentFormFeedback = useFeedbackTopic("assessment");

  const isLoading = isConventionLoading;

  const isConventionValidated = convention?.status === "ACCEPTED_BY_VALIDATOR";

  const isAssessmentSuccessfullySubmitted =
    assessmentFormFeedback?.level === "success" &&
    assessmentFormFeedback?.on === "create";

  if (fetchConventionError)
    return (
      <MainWrapper layout="default" vSpacing={0}>
        <ShowConventionErrorOrRenewExpiredJwt
          errorMessage={conventionFormFeedback?.message}
          jwt={route.params.jwt}
        />
      </MainWrapper>
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
        convention && (
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
            {convention.assessment && (
              <Alert
                severity="error"
                title="Erreur"
                description="Le bilan a déjà été rempli et ne peut être modifié."
              />
            )}
            {convention && isConventionValidated && !convention.assessment && (
              <AssessmentForm
                convention={convention}
                jwt={route.params.jwt}
                currentUserRoles={roles}
              />
            )}
          </MainWrapper>
        )
      )}
    </HeaderFooterLayout>
  );
};
