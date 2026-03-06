import {
  errors,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  type WithAssessmentDto,
  type WithConventionDto,
  withAssessmentSchema,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import type { CreateConventionMagicLinkPayloadProperties } from "../../../../utils/jwt";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyBeneficiaryThatAssessmentNeedsSignature = ReturnType<
  typeof makeNotifyBeneficiaryThatAssessmentNeedsSignature
>;

export const makeNotifyBeneficiaryThatAssessmentNeedsSignature = useCaseBuilder(
  "NotifyBeneficiaryThatAssessmentNeedsSignature",
)
  .withInput<WithConventionDto & WithAssessmentDto>(
    withConventionSchema.and(withAssessmentSchema),
  )
  .withOutput<void>()
  .withCurrentUser<void>()
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    timeGateway: TimeGateway;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    config: AppConfig;
  }>()
  .build(async ({ uow, inputParams, deps }) => {
    const convention = await uow.conventionRepository.getById(
      inputParams.convention.id,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.convention.id,
      });

    const assessment = await uow.assessmentRepository.getByConventionId(
      inputParams.convention.id,
    );

    if (!assessment)
      throw errors.assessment.notFound(inputParams.convention.id);

    if (assessment.status === "DID_NOT_SHOW") return;

    const beneficiary = convention.signatories.beneficiary;
    const conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties =
      {
        id: convention.id,
        role: beneficiary.role,
        email: beneficiary.email,
        now: deps.timeGateway.now(),
      };

    const makeMagicShortLink = prepareConventionMagicShortLinkMaker({
      conventionMagicLinkPayload,
      uow,
      config: deps.config,
      generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
    });

    const assessmentSignatureLink = await makeMagicShortLink({
      targetRoute: frontRoutes.assessmentDocument,
      lifetime: "2Days",
    });

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "ASSESSMENT_NEEDS_SIGNATURE_BENEFICIARY_NOTIFICATION",
        recipients: [beneficiary.email],
        params: {
          beneficiaryFirstName: getFormattedFirstnameAndLastname({
            firstname: beneficiary.firstName,
          }),
          beneficiaryLastName: getFormattedFirstnameAndLastname({
            lastname: beneficiary.lastName,
          }),
          businessName: convention.businessName,
          internshipKind: convention.internshipKind,
          assessmentSignatureLink,
        },
      },
      followedIds: {
        conventionId: convention.id,
        agencyId: convention.agencyId,
        establishmentSiret: convention.siret,
      },
    });
  });
