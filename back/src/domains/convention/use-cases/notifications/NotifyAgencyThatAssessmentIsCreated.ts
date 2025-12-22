import { uniq } from "ramda";
import {
  computeTotalHours,
  type Email,
  executeInSequence,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  makeUrlWithQueryParams,
  type WithAssessmentDto,
  withAssessmentSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { retrieveConventionWithAgency } from "../../entities/Convention";

export class NotifyAgencyThatAssessmentIsCreated extends TransactionalUseCase<WithAssessmentDto> {
  protected inputSchema = withAssessmentSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  readonly #config: AppConfig;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    config: AppConfig,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#config = config;
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

    const recipientsEmails: Email[] = conventionAdvisor?.advisor
      ? [conventionAdvisor?.advisor.email]
      : uniq([...validatorEmails, ...counsellorEmails]);

    if (assessment.status === "DID_NOT_SHOW") {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
          recipients: recipientsEmails,
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

      await executeInSequence(recipientsEmails, async (email) => {
        const manageConventionLink = `${this.#config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
          `/${frontRoutes.manageConventionUserConnected}`,
          { conventionId: convention.id },
        )}`;
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
              manageConventionLink,
            },
          },
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
          },
        });
      });
    }
  }
}
