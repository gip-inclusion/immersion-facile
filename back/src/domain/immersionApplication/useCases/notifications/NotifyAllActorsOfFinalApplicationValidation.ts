import { parseISO } from "date-fns";
import {
  calculateTotalImmersionHoursBetweenDate,
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "../../../../shared/ScheduleUtils";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyConfig, AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  ValidatedApplicationFinalConfirmationParams,
} from "../../ports/EmailGateway";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "../../../../shared/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);
export class NotifyAllActorsOfFinalApplicationValidation extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(dto: ImmersionApplicationDto): Promise<void> {
    logger.info(
      { immersionApplicationId: dto.id },
      "------------- Entering execute.",
    );

    const agencyConfig = await this.agencyRepository.getById(dto.agencyId);
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${dto.agencyId}`,
      );
    }

    const recipients = [
      dto.email,
      dto.mentorEmail,
      ...agencyConfig.counsellorEmails,
      ...agencyConfig.validatorEmails,
    ];

    await this.emailFilter.withAllowedRecipients(
      recipients,
      (recipients) =>
        this.emailGateway.sendValidatedApplicationFinalConfirmation(
          recipients,
          getValidatedApplicationFinalConfirmationParams(agencyConfig, dto),
        ),
      logger,
    );
  }
}

// Visible for testing.
export const getValidatedApplicationFinalConfirmationParams = (
  agencyConfig: AgencyConfig,
  dto: ImmersionApplicationDto,
): ValidatedApplicationFinalConfirmationParams => ({
  totalHours: calculateTotalImmersionHoursBetweenDate({
    dateStart: dto.dateStart,
    dateEnd: dto.dateEnd,
    schedule: dto.schedule,
  }),
  beneficiaryFirstName: dto.firstName,
  beneficiaryLastName: dto.lastName,
  dateStart: parseISO(dto.dateStart).toLocaleDateString("fr"),
  dateEnd: parseISO(dto.dateEnd).toLocaleDateString("fr"),
  mentorName: dto.mentor,
  scheduleText: dto.legacySchedule?.description
    ? prettyPrintLegacySchedule(dto.legacySchedule)
    : prettyPrintSchedule(dto.schedule),
  businessName: dto.businessName,
  immersionAddress: dto.immersionAddress || "",
  immersionAppellationLabel: dto.immersionAppellation.appellationLabel,
  immersionActivities: dto.immersionActivities,
  sanitaryPrevention:
    dto.sanitaryPrevention && dto.sanitaryPreventionDescription
      ? dto.sanitaryPreventionDescription
      : "non",
  individualProtection: dto.individualProtection ? "oui" : "non",
  questionnaireUrl: agencyConfig.questionnaireUrl,
  signature: agencyConfig.signature,
  workConditions: dto.workConditions,
});
