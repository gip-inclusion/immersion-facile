import { parseISO } from "date-fns";
import { Agency } from "shared/src/agency/agency.dto";
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
  ValidatedApplicationFinalConfirmationParams,
} from "../../ports/EmailGateway";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

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
        this.emailGateway.sendValidatedApplicationFinalConfirmation(
          recipients,
          getValidatedApplicationFinalConfirmationParams(agency, dto),
        ),
      logger,
    );
  }
}

// Visible for testing.
export const getValidatedApplicationFinalConfirmationParams = (
  agency: Agency,
  dto: ImmersionApplicationDto,
): ValidatedApplicationFinalConfirmationParams => ({
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
