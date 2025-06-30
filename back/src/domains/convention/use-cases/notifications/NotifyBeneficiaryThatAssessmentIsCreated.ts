import {
  type WithAssessmentDto,
  errors,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  withAssessmentSchema,
} from "shared";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";

export type NotifyBeneficiaryThatAssessmentIsCreated = ReturnType<
  typeof makeNotifyBeneficiaryThatAssessmentIsCreated
>;
export const makeNotifyBeneficiaryThatAssessmentIsCreated =
  createTransactionalUseCase<
    WithAssessmentDto,
    void,
    void,
    {
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
      generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
      timeGateway: TimeGateway;
    }
  >(
    {
      name: "NotifyBeneficiaryThatAssessmentIsCreated",
      inputSchema: withAssessmentSchema,
    },
    async ({ uow, inputParams, deps }) => {
      const convention = await uow.conventionRepository.getById(
        inputParams.assessment.conventionId,
      );

      if (!convention)
        throw errors.convention.notFound({
          conventionId: inputParams.assessment.conventionId,
        });

      const today = deps.timeGateway.now();
      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "ASSESSMENT_CREATED_BENEFICIARY_NOTIFICATION",
          recipients: [convention.signatories.beneficiary.email],
          params: {
            internshipKind: convention.internshipKind,
            conventionId: convention.id,
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            magicLink: deps.generateConventionMagicLinkUrl({
              id: convention.id,
              email: convention.signatories.beneficiary.email,
              role: "beneficiary",
              targetRoute: frontRoutes.assessmentDocument,
              now: today,
              lifetime: "long",
            }),
          },
        },
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    },
  );
