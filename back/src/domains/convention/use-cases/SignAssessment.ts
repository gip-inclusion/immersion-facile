import {
  type ConventionDomainJwtPayload,
  errors,
  signAssessmentRequestDtoSchema,
} from "shared";
import { throwIfNotAuthorizedForRole } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { getOnlyAssessmentDto } from "../entities/AssessmentEntity";

export type SignAssessment = ReturnType<typeof makeSignAssessment>;

export const makeSignAssessment = useCaseBuilder("SignAssessment")
  .withInput(signAssessmentRequestDtoSchema)
  .withOutput<void>()
  .withCurrentUser<ConventionDomainJwtPayload>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
    const convention = await uow.conventionQueries.getConventionById(
      inputParams.conventionId,
    );
    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    await throwIfNotAuthorizedForRole({
      authorizedRoles: ["beneficiary"],
      uow,
      jwtPayload,
      convention,
      errorToThrow: errors.assessment.signForbidden(),
      isPeAdvisorAllowed: false,
      isValidatorOfAgencyRefersToAllowed: false,
    });

    const assessmentEntity = await uow.assessmentRepository.getByConventionId(
      inputParams.conventionId,
    );
    if (!assessmentEntity)
      throw errors.assessment.notFound(inputParams.conventionId);

    const assessmentDto = getOnlyAssessmentDto(assessmentEntity);
    if (!assessmentDto)
      throw errors.assessment.signNotAvailableForLegacyAssessment();

    if (assessmentDto.signedAt)
      throw errors.assessment.alreadySigned(inputParams.conventionId);

    const signedAssessmentDto = {
      ...assessmentDto,
      beneficiaryAgreement: inputParams.beneficiaryAgreement,
      beneficiaryFeedback: inputParams.beneficiaryFeedback,
      signedAt: deps.timeGateway.now().toISOString(),
    };

    const signedAssessmentEntity = {
      ...assessmentEntity,
      ...signedAssessmentDto,
    };

    await uow.assessmentRepository.update(
      inputParams.conventionId,
      signedAssessmentEntity,
    );

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "AssessmentSignedByBeneficiary",
        payload: {
          conventionId: inputParams.conventionId,
          assessment: signedAssessmentDto,
          triggeredBy: { kind: "convention-magic-link", role: jwtPayload.role },
        },
      }),
    );
  });
