import { uniqBy } from "ramda";
import {
  type ConventionRole,
  computeTotalHours,
  type Email,
  executeInSequence,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  type WithAssessmentDto,
  withAssessmentSchema,
} from "shared";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { retrieveConventionWithAgency } from "../../entities/Convention";

export class NotifyAgencyThatAssessmentIsCreated extends TransactionalUseCase<WithAssessmentDto> {
  protected inputSchema = withAssessmentSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#timeGateway = timeGateway;
  }

  public async _execute(
    { assessment }: WithAssessmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const { agency, convention } = await retrieveConventionWithAgency(
      uow,
      assessment.conventionId,
    );

    const { validatorEmails, counsellorEmails } =
      await agencyWithRightToAgencyDto(uow, agency);

    const conventionAdvisor =
      await uow.conventionFranceTravailAdvisorRepository.getByConventionId(
        convention.id,
      );

    const recipientsRoleAndEmail: { email: Email; role: ConventionRole }[] =
      conventionAdvisor?.advisor
        ? [{ email: conventionAdvisor?.advisor.email, role: "validator" }]
        : uniqBy(
            (recipient) => recipient.email,
            [
              ...validatorEmails.map(
                (validatorEmail): { email: Email; role: ConventionRole } => ({
                  email: validatorEmail,
                  role: "validator",
                }),
              ),
              ...counsellorEmails.map(
                (counsellorEmail): { email: Email; role: ConventionRole } => ({
                  email: counsellorEmail,
                  role: "counsellor",
                }),
              ),
            ],
          );

    if (assessment.status === "DID_NOT_SHOW") {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
          recipients: recipientsRoleAndEmail.map(
            (recipient) => recipient.email,
          ),
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            businessName: convention.businessName,
            conventionId: convention.id,
            immersionObjective: convention.immersionObjective,
            internshipKind: convention.internshipKind,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
          },
        },
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    } else {
      const numberOfHoursMade = computeTotalHours({
        convention,
        lastDayOfPresence:
          assessment.status === "PARTIALLY_COMPLETED"
            ? assessment.lastDayOfPresence
            : "",
        numberOfMissedHours:
          assessment.status === "PARTIALLY_COMPLETED"
            ? assessment.numberOfMissedHours
            : 0,
        status: assessment.status,
      });

      await executeInSequence(
        recipientsRoleAndEmail,
        async ({ email, role }) => {
          const magicLink = this.#generateConventionMagicLinkUrl({
            targetRoute: frontRoutes.assessmentDocument,
            id: convention.id,
            role,
            email,
            now: this.#timeGateway.now(),
            lifetime: "long",
          });
          await this.#saveNotificationAndRelatedEvent(uow, {
            kind: "email",
            templatedContent: {
              kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
              recipients: [email],
              params: {
                agencyReferentName: getFormattedFirstnameAndLastname(
                  convention.agencyReferent ?? {},
                ),
                beneficiaryFirstName: getFormattedFirstnameAndLastname({
                  firstname: convention.signatories.beneficiary.firstName,
                }),
                beneficiaryLastName: getFormattedFirstnameAndLastname({
                  lastname: convention.signatories.beneficiary.lastName,
                }),
                businessName: convention.businessName,
                conventionId: convention.id,
                immersionObjective: convention.immersionObjective,
                internshipKind: convention.internshipKind,
                conventionDateEnd: convention.dateEnd,
                immersionAppellationLabel:
                  convention.immersionAppellation.appellationLabel,
                assessment,
                numberOfHoursMade,
                magicLink,
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
    }
  }
}
