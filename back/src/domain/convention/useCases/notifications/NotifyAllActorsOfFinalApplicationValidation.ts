import { parseISO } from "date-fns";
import { AgencyDto } from "shared/src/agency/agency.dto";
import {
  calculateTotalImmersionHoursBetweenDate,
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  ValidatedConventionFinalConfirmationParams,
} from "../../ports/EmailGateway";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);
export class NotifyAllActorsOfFinalApplicationValidation extends UseCase<ConventionDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute(dto: ConventionDto): Promise<void> {
    logger.info({ ConventionId: dto.id }, "------------- Entering execute.");

    const agency = await this.agencyRepository.getById(dto.agencyId);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${dto.agencyId}`,
      );
    }

    const recipients = [
      dto.email,
      dto.mentorEmail,
      ...agency.counsellorEmails,
      ...agency.validatorEmails,
    ];

    await this.emailFilter.withAllowedRecipients(
      recipients,
      (recipients) =>
        this.emailGateway.sendValidatedConventionFinalConfirmation(
          recipients,
          getValidatedApplicationFinalConfirmationParams(agency, dto),
        ),
      logger,
    );
  }
}

// Visible for testing.
export const getValidatedApplicationFinalConfirmationParams = (
  agency: AgencyDto,
  dto: ConventionDto,
): ValidatedConventionFinalConfirmationParams => ({
  totalHours: calculateTotalImmersionHoursBetweenDate({
    dateStart: dto.dateStart,
    dateEnd: dto.dateEnd,
    schedule: dto.schedule,
  }),
  beneficiaryFirstName: dto.firstName,
  beneficiaryLastName: dto.lastName,
  emergencyContact: dto.emergencyContact,
  emergencyContactPhone: dto.emergencyContactPhone,
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
  immersionSkills: dto.immersionSkills ?? "Non renseigné",
  sanitaryPrevention:
    dto.sanitaryPrevention && dto.sanitaryPreventionDescription
      ? dto.sanitaryPreventionDescription
      : "non",
  individualProtection: dto.individualProtection ? "oui" : "non",
  questionnaireUrl: agency.questionnaireUrl,
  signature: agency.signature,
  workConditions: dto.workConditions,
});
